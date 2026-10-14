import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const categorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  description: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { medicines: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error saat mengambil kategori:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat kategori obat' },
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
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { name, description } = result.data;

    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Kategori dengan nama tersebut sudah ada' },
        { status: 400 }
      );
    }

    const created = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil ditambahkan',
      data: created,
    });
  } catch (error) {
    console.error('Error saat menambah kategori:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menambah kategori obat' },
      { status: 500 }
    );
  }
}
