import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateMedicalRecordNumber } from '@/lib/format';
import { Gender } from '@prisma/client';

const patientSchema = z.object({
  name: z.string().min(2, 'Nama pasien minimal 2 karakter'),
  nik: z.string().optional().nullable(),
  gender: z.enum(['L', 'P']),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  allergy: z.string().optional().nullable(),
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

    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { mrNumber: { contains: search, mode: 'insensitive' } },
              { nik: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error saat mengambil data pasien:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data pasien' },
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
    const result = patientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Cek duplikasi NIK jika diisi
    if (data.nik && data.nik.trim() !== '') {
      const existingNik = await prisma.patient.findUnique({
        where: { nik: data.nik.trim() },
      });
      if (existingNik) {
        return NextResponse.json(
          { success: false, message: 'NIK sudah terdaftar pada pasien lain' },
          { status: 400 }
        );
      }
    }

    // Generate No. RM Unik Otomatis
    const mrNumber = await generateMedicalRecordNumber();

    const patient = await prisma.patient.create({
      data: {
        mrNumber,
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
      message: `Pasien ${patient.name} berhasil didaftarkan dengan No. RM ${patient.mrNumber}`,
      data: patient,
    });
  } catch (error) {
    console.error('Error saat menambah pasien:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mendaftarkan pasien baru' },
      { status: 500 }
    );
  }
}
