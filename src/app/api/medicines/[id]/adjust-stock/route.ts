import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { MovementType } from '@prisma/client';

const adjustSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().min(1, 'Catatan alasan perubahan stok wajib diisi'),
});

export async function POST(
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
    const result = adjustSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { type, quantity, referenceNo, notes } = result.data;

    if (quantity === 0) {
      return NextResponse.json(
        { success: false, message: 'Jumlah perubahan stok tidak boleh 0' },
        { status: 400 }
      );
    }

    const updatedMed = await prisma.$transaction(async (tx) => {
      const current = await tx.medicine.findUnique({
        where: { id },
      });

      if (!current) {
        throw new Error('Obat tidak ditemukan');
      }

      let balanceAfter = current.stock;
      if (type === 'IN') {
        if (quantity < 0) throw new Error('Penambahan stok harus berupa angka positif');
        balanceAfter = current.stock + quantity;
      } else if (type === 'OUT') {
        const absQty = Math.abs(quantity);
        if (current.stock - absQty < 0) {
          throw new Error(`Stok tidak mencukupi. Sisa stok saat ini hanya ${current.stock} ${current.unit}`);
        }
        balanceAfter = current.stock - absQty;
      } else if (type === 'ADJUSTMENT') {
        // Penyesuaian ke nilai tertentu atau selisih
        balanceAfter = quantity;
        if (balanceAfter < 0) {
          throw new Error('Stok akhir tidak boleh bernilai negatif');
        }
      }

      const diff = balanceAfter - current.stock;

      const med = await tx.medicine.update({
        where: { id },
        data: { stock: balanceAfter },
      });

      await tx.stockMovement.create({
        data: {
          medicineId: current.id,
          type: type as MovementType,
          quantity: diff,
          balanceBefore: current.stock,
          balanceAfter: balanceAfter,
          referenceNo: referenceNo?.trim() || 'MANUAL-ADJ',
          notes: notes.trim(),
          createdById: session.id,
        },
      });

      return med;
    });

    return NextResponse.json({
      success: true,
      message: `Stok obat ${updatedMed.name} berhasil diperbarui menjadi ${updatedMed.stock} ${updatedMed.unit}`,
      data: updatedMed,
    });
  } catch (error: any) {
    console.error('Error saat penyesuaian stok:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengubah stok obat' },
      { status: 400 }
    );
  }
}
