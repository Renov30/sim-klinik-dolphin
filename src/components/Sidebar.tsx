'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  clinicName: string;
  userRole?: string;
  userName?: string;
}

export default function Sidebar({ clinicName, userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      code: 'DSH',
      href: '/dashboard',
      roles: ['ADMIN', 'PENDAFTARAN', 'KASIR'],
    },
    {
      label: 'Pendaftaran Pasien',
      code: 'PSN',
      href: '/pasien',
      roles: ['ADMIN', 'PENDAFTARAN'],
    },
    {
      label: 'Master Obat & Stok',
      code: 'OBT',
      href: '/obat',
      roles: ['ADMIN', 'KASIR'],
    },
    {
      label: 'Kasir Penjualan',
      code: 'KSR',
      href: '/kasir',
      roles: ['ADMIN', 'KASIR'],
    },
    {
      label: 'Riwayat Transaksi',
      code: 'TXN',
      href: '/transaksi',
      roles: ['ADMIN', 'KASIR'],
    },
    {
      label: 'Pengaturan Klinik',
      code: 'SET',
      href: '/pengaturan',
      roles: ['ADMIN'],
    },
  ];

  const allowedNavItems = navItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-emerald-800 text-white flex flex-col min-h-screen shrink-0 border-r border-emerald-900 shadow-sm">
      {/* Clinic Brand Header */}
      <div className="p-6 border-b border-emerald-700/60">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] tracking-wider px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700 font-bold uppercase">
            SIM-KLINIK
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white truncate" title={clinicName}>
          {clinicName}
        </h1>
        <p className="text-xs text-emerald-200 mt-1 uppercase tracking-wide font-medium">
          Sistem Pelayanan Klinik
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold tracking-wider text-emerald-300 uppercase">
          Menu Utama
        </div>
        {allowedNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-700/60 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white border-white/30 font-bold'
                      : 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50 font-semibold'
                  }`}
                >
                  {item.code}
                </span>
                <span>{item.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System LAN Info Pill */}
      <div className="mx-4 mb-3 p-3 rounded-xl bg-emerald-900/70 border border-emerald-700/50 text-xs">
        <div className="flex items-center justify-between text-xs text-emerald-200 mb-1 font-semibold">
          <span>JARINGAN LAN</span>
          <span className="text-emerald-300 font-bold">TERHUBUNG</span>
        </div>
        <p className="text-xs text-emerald-300 truncate font-medium">
          Status: Aktif (0.0.0.0)
        </p>
      </div>

      {/* User Profile & Logout Section (Matching Reference Avatar Layout) */}
      <div className="p-4 border-t border-emerald-700/60 bg-emerald-900/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-emerald-500/40 shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{userName || 'Pengguna'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block px-1.5 py-0.2 text-[10px] rounded font-bold uppercase bg-emerald-700 text-emerald-100 border border-emerald-600">
                {userRole || 'GUEST'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          type="button"
          className="w-full py-2 px-3 text-xs font-semibold text-center rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 hover:text-white border border-rose-500/30 transition cursor-pointer"
        >
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
}
