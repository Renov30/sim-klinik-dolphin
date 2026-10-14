import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/format';
import { MovementType, PaymentMethod } from '@prisma/client';
import { getClinicSettings } from '@/lib/clinic';

const cartItemSchema = z.object({
  medicineId: z.string().min(1, 'Obat wajib dipilih'),
  quantity: z.number().int().positive('Jumlah obat harus lebih dari 0'),
});

const checkoutSchema = z.object({
  patientId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Nama pembeli / pasien wajib diisi'),
  discount: z.number().nonnegative().default(0),
  payAmount: z.number().nonnegative('Jumlah pembayaran tidak valid'),
  paymentMethod: z.enum(['TUNAI', 'TRANSFER', 'QRIS']).default('TUNAI'),
  notes: z.string().optional().nullable(),
  items: z.array(cartItemSchema).min(1, 'Keranjang belanja minimal harus memiliki 1 item obat'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const sales = await prisma.sale.findMany({
      where: search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        patient: true,
        cashier: { select: { id: true, name: true, username: true } },
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error('Error saat mengambil riwayat transaksi:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat riwayat transaksi' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data transaksi tidak valid' },
        { status: 400 }
      );
    }

    const { patientId, customerName, discount, payAmount, paymentMethod, notes, items } = result.data;

    // Transaksi Atomik Database Prisma: Validasi stok, buat invoice, potong stok, catat kartu stok
    const saleResult = await prisma.$transaction(async (tx) => {
      // 1. Ambil data obat terbaru & periksa ketersediaan stok
      const medicineIds = items.map((i) => i.medicineId);
      const dbMedicines = await tx.medicine.findMany({
        where: { id: { in: medicineIds } },
      });

      const medicineMap = new Map(dbMedicines.map((m) => [m.id, m]));

      let subtotal = 0;
      const saleItemsData: Array<{
        medicineId: string;
        medicineName: string;
        unit: string;
        unitPrice: number;
        quantity: number;
        subtotal: number;
      }> = [];

      for (const item of items) {
        const med = medicineMap.get(item.medicineId);
        if (!med) {
          throw new Error(`Obat dengan ID '${item.medicineId}' tidak ditemukan di sistem.`);
        }

        if (!med.isActive) {
          throw new Error(`Obat '${med.name}' berstatus non-aktif.`);
        }

        // VALIDASI STOK: Tidak mengizinkan stok negatif!
        if (med.stock < item.quantity) {
          throw new Error(
            `Stok obat '${med.name}' tidak mencukupi! Sisa stok saat ini hanya ${med.stock} ${med.unit}, diminta ${item.quantity} ${med.unit}.`
          );
        }

        const itemSubtotal = med.sellPrice * item.quantity;
        subtotal += itemSubtotal;

        saleItemsData.push({
          medicineId: med.id,
          medicineName: med.name,
          unit: med.unit,
          unitPrice: med.sellPrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });
      }

      const totalAmount = Math.max(0, subtotal - discount);

      // Cek uang pembayaran untuk metode tunai
      if (paymentMethod === 'TUNAI' && payAmount < totalAmount) {
        throw new Error(
          `Uang pembayaran (${payAmount}) kurang dari total tagihan (${totalAmount}).`
        );
      }

      const changeAmount = Math.max(0, payAmount - totalAmount);

      // 2. Generate Nomor Faktur Unik
      const invoiceNumber = await generateInvoiceNumber();

      // 3. Simpan Transaksi Penjualan Kasir
      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          patientId: patientId || null,
          customerName: customerName.trim(),
          subtotal,
          discount,
          totalAmount,
          payAmount,
          changeAmount,
          paymentMethod: paymentMethod as PaymentMethod,
          notes: notes?.trim() || null,
          cashierId: session.id,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: true,
          patient: true,
          cashier: { select: { id: true, name: true, username: true } },
        },
      });

      // 4. Potong Stok Otomatis & Catat Riwayat Kartu Stok
      for (const item of items) {
        const med = medicineMap.get(item.medicineId)!;
        const newStock = med.stock - item.quantity;

        // Update stok fisik
        await tx.medicine.update({
          where: { id: med.id },
          data: { stock: newStock },
        });

        // Catat di pergerakan stok
        await tx.stockMovement.create({
          data: {
            medicineId: med.id,
            type: MovementType.SALE,
            quantity: -item.quantity,
            balanceBefore: med.stock,
            balanceAfter: newStock,
            referenceNo: invoiceNumber,
            notes: `Penjualan Kasir Kasir: ${session.name} (${createdSale.customerName})`,
            createdById: session.id,
          },
        });
      }

      return createdSale;
    });

    const clinic = await getClinicSettings();

    return NextResponse.json({
      success: true,
      message: `Transaksi kasir berhasil diproses dengan Nomor ${saleResult.invoiceNumber}`,
      data: {
        ...saleResult,
        clinic,
      },
    });
  } catch (error: any) {
    console.error('Error transaksi kasir:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memproses transaksi kasir' },
      { status: 400 }
    );
  }
}
