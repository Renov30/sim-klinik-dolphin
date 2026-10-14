import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { MovementType } from '@prisma/client';

const medicineSchema = z.object({
  code: z.string().min(2, 'Kode obat minimal 2 karakter'),
  name: z.string().min(2, 'Nama obat minimal 2 karakter'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  buyPrice: z.number().nonnegative('Harga beli tidak boleh negatif'),
  sellPrice: z.number().positive('Harga jual harus lebih dari 0'),
  stock: z.number().int().nonnegative('Stok awal tidak boleh negatif'),
  minStock: z.number().int().nonnegative('Stok minimum tidak boleh negatif'),
  location: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    const medicines = await prisma.medicine.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { code: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          categoryId ? { categoryId } : {},
          lowStockOnly ? { stock: { lte: prisma.medicine.fields.minStock } } : {},
        ],
      },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: medicines });
  } catch (error) {
    console.error('Error saat mengambil data obat:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data obat' },
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
    const result = medicineSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Cek duplikasi kode obat
    const existing = await prisma.medicine.findUnique({
      where: { code: data.code.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Kode obat '${data.code}' sudah digunakan.` },
        { status: 400 }
      );
    }

    // Jalankan dalam transaksi agar stok awal dan riwayat stok konsisten
    const medicine = await prisma.$transaction(async (tx) => {
      const createdMed = await tx.medicine.create({
        data: {
          code: data.code.trim().toUpperCase(),
          name: data.name.trim(),
          categoryId: data.categoryId,
          unit: data.unit.trim(),
          buyPrice: data.buyPrice,
          sellPrice: data.sellPrice,
          stock: data.stock,
          minStock: data.minStock,
          location: data.location?.trim() || null,
        },
      });

      if (data.stock > 0) {
        await tx.stockMovement.create({
          data: {
            medicineId: createdMed.id,
            type: MovementType.IN,
            quantity: data.stock,
            balanceBefore: 0,
            balanceAfter: data.stock,
            referenceNo: 'INIT-NEW',
            notes: 'Pendaftaran obat & saldo awal',
            createdById: session.id,
          },
        });
      }

      return createdMed;
    });

    return NextResponse.json({
      success: true,
      message: `Obat ${medicine.name} (${medicine.code}) berhasil ditambahkan`,
      data: medicine,
    });
  } catch (error) {
    console.error('Error saat menambah obat:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan obat baru' },
      { status: 500 }
    );
  }
}
