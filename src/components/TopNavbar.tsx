'use client';

import React, { useEffect, useState } from 'react';

interface TopNavbarProps {
  clinicName: string;
  userName?: string;
  userRole?: string;
  title: string;
  subtitle?: string;
}

export default function TopNavbar({
  clinicName,
  userName,
  userRole,
  title,
  subtitle,
}: TopNavbarProps) {
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now)
    );
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {clinicName}
          </span>
          <span className="text-slate-300">/</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Date pill */}
        <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono">
          {currentDate || 'Memuat tanggal...'}
        </div>

        {/* LAN Indicator Pill */}
        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>LAN : ONLINE</span>
        </div>

        {/* User Pill */}
        <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-2">
          <span className="font-mono font-bold text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">
            {userRole || 'USER'}
          </span>
          <span className="font-semibold text-slate-700">{userName || 'Pengguna'}</span>
        </div>
      </div>
    </header>
  );
}

