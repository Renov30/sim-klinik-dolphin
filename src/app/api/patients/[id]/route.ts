import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Gender } from '@prisma/client';

const updatePatientSchema = z.object({
  name: z.string().min(2, 'Nama pasien minimal 2 karakter'),
  nik: z.string().optional().nullable(),
  gender: z.enum(['L', 'P']),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  allergy: z.string().optional().nullable(),
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
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Data pasien tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error saat mengambil detail pasien:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil detail pasien' },
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
    const result = updatePatientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Cek duplikasi NIK jika diubah
    if (data.nik && data.nik.trim() !== '') {
      const existingNik = await prisma.patient.findFirst({
        where: {
          nik: data.nik.trim(),
          NOT: { id },
        },
      });
      if (existingNik) {
        return NextResponse.json(
          { success: false, message: 'NIK sudah terdaftar pada pasien lain' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name: data.name.trim(),
        nik: data.nik?.trim() || null,
        gender: data.gender as Gender,
        birthDate: new Date(data.birthDate),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        bloodType: data.bloodType || null,
        allergy: data.allergy?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data pasien berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('Error saat update data pasien:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui data pasien' },
      { status: 500 }
    );
  }
}
