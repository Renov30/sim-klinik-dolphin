import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getClinicSettings } from '@/lib/clinic';

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
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        patient: true,
        cashier: { select: { id: true, name: true, username: true } },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, message: 'Data transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    const clinic = await getClinicSettings();

    return NextResponse.json({
      success: true,
      data: {
        ...sale,
        clinic,
      },
    });
  } catch (error) {
    console.error('Error saat mengambil faktur penjualan:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data transaksi' },
      { status: 500 }
    );
  }
}

