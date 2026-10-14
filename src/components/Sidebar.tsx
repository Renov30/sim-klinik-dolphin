'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Pill,
  ShoppingCart,
  Receipt,
  Settings,
} from 'lucide-react';
import ClinicLogo from '@/components/ClinicLogo';

interface SidebarProps {
  clinicName: string;
  userRole?: string;
  userName?: string;
}

export default function Sidebar({ clinicName, userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'PENDAFTARAN', 'KASIR'],
    },
    {
      label: 'Pendaftaran Pasien',
      href: '/pasien',
      icon: Users,
      roles: ['ADMIN', 'PENDAFTARAN'],
    },
    {
      label: 'Master Obat & Stok',
      href: '/obat',
      icon: Pill,
      roles: ['ADMIN', 'KASIR'],
    },
    {
      label: 'Kasir Penjualan',
      href: '/kasir',
      icon: ShoppingCart,
      roles: ['ADMIN', 'KASIR'],
    },
    {
      label: 'Riwayat Transaksi',
      href: '/transaksi',
      icon: Receipt,
      roles: ['ADMIN', 'KASIR'],
    },
    {
      label: 'Pengaturan Klinik',
      href: '/pengaturan',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const allowedNavItems = navItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-white text-slate-800 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-100/90 shadow-xs z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 shrink-0">
        <Link href="/dashboard" className="block">
          <ClinicLogo name={clinicName} size="md" />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {allowedNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
