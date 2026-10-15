'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Search,
  Bell,
  Mail,
  ChevronDown,
  LogOut,
} from 'lucide-react';

interface TopNavbarProps {
  clinicName: string;
  userName?: string;
  userRole?: string;
  title: string;
  subtitle?: string;
}

export default function TopNavbar({
  clinicName,
  userName = 'Administrator',
  userRole = 'ADMIN',
  title,
  subtitle,
}: TopNavbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header className="bg-transparent px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Title with Grid Icon */}
      <div className="flex items-center gap-3">
        <div className="text-slate-800">
          <LayoutGrid className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
      </div>


      {/* Right Actions: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Bell Notification */}
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            6
          </span>
        </button>

        {/* Mail Notification */}
        <button
          type="button"
          aria-label="Pesan"
          className="relative w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            2
          </span>
        </button>

        {/* User Profile Card with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-2 p-1 rounded-xl hover:bg-slate-100/60 transition cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 overflow-hidden">
              <span className="text-base">
                {userName ? userName.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-800 leading-tight">
                  {userName || 'User'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                {userRole.toLowerCase()}@
                {clinicName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {userName}
                </p>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">
                  {userRole}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Sistem</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
