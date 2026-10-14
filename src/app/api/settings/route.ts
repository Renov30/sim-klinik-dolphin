import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClinicSettings, updateClinicSettings } from '@/lib/clinic';
import { getSession } from '@/lib/auth';
import { Role } from '@prisma/client';

const settingsSchema = z.object({
  name: z.string().min(2, 'Nama klinik minimal 2 karakter'),
  tagline: z.string().min(2, 'Tagline minimal 2 karakter'),
  address: z.string().min(3, 'Alamat wajib diisi'),
  phone: z.string().min(3, 'Nomor telepon wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  receiptFooter: z.string().min(2, 'Pesan kaki struk wajib diisi'),
});

export async function GET() {
  try {
    const settings = await getClinicSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error saat mengambil pengaturan:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat pengaturan klinik' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: 'Hanya Administrator yang memiliki wewenang mengubah pengaturan klinik' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = settingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const updated = await updateClinicSettings(result.data);

    return NextResponse.json({
      success: true,
      message: `Nama klinik berhasil diperbarui menjadi '${updated.name}'`,
      data: updated,
    });
  } catch (error) {
    console.error('Error saat update pengaturan:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui pengaturan' },
      { status: 500 }
    );
  }
}
