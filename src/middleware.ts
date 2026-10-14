import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { Role } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dolphin-eclinic-jwt-secret-key-32chars-min-secure-2026'
);

const SESSION_COOKIE_NAME = 'dolphin_clinic_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lewati file statis, next internal, dan favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  let session: { id: string; username: string; role: Role } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = {
        id: payload.id as string,
        username: payload.username as string,
        role: payload.role as Role,
      };
    } catch {
      session = null;
    }
  }

  // Jika halaman login
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Jika root /
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Halaman yang butuh autentikasi
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cek Hak Akses per Role (RBAC)
  const role = session.role;

  // Hanya Admin yang boleh akses Pengaturan Sistem
  if (pathname.startsWith('/pengaturan') && role !== Role.ADMIN) {
    return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
  }

  // Petugas Pendaftaran hanya boleh akses Pasien dan Dashboard
  if (role === Role.PENDAFTARAN) {
    if (pathname.startsWith('/kasir') || pathname.startsWith('/pengaturan')) {
      return NextResponse.redirect(new URL('/pasien', req.url));
    }
  }

  // Kasir hanya boleh akses Kasir, Transaksi, Master Obat (lihat stok), dan Dashboard
  if (role === Role.KASIR) {
    if (pathname.startsWith('/pasien') || pathname.startsWith('/pengaturan')) {
      return NextResponse.redirect(new URL('/kasir', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/pasien/:path*',
    '/obat/:path*',
    '/kasir/:path*',
    '/transaksi/:path*',
    '/pengaturan/:path*',
  ],
};

