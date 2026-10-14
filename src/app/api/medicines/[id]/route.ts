import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const updateMedicineSchema = z.object({
  name: z.string().min(2, 'Nama obat minimal 2 karakter'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  buyPrice: z.number().nonnegative('Harga beli tidak boleh negatif'),
  sellPrice: z.number().positive('Harga jual harus lebih dari 0'),
  minStock: z.number().int().nonnegative('Stok minimum tidak boleh negatif'),
  location: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        category: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: true },
        },
      },
    });

    if (!medicine) {
      return NextResponse.json(
        { success: false, message: 'Obat tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: medicine });
  } catch (error) {
    console.error('Error saat mengambil detail obat:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil detail obat' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateMedicineSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const data = result.data;

    const updated = await prisma.medicine.update({
      where: { id },
      data: {
        name: data.name.trim(),
        categoryId: data.categoryId,
        unit: data.unit.trim(),
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        minStock: data.minStock,
        location: data.location?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data obat ${updated.name} berhasil diperbarui`,
      data: updated,
    });
  } catch (error) {
    console.error('Error saat update obat:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui data obat' },
      { status: 500 }
    );
  }
}
