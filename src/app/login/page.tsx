'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || 'Dolphin e-Clinic';
  const tagline = process.env.NEXT_PUBLIC_CLINIC_TAGLINE || 'Sistem Informasi Manajemen Klinik Terpadu';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Gagal masuk. Periksa kembali akun Anda.');
        setLoading(false);
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError('Terjadi kendala jaringan saat menghubungi server.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-black pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-blue-700 text-white p-7 text-center border-b border-blue-600">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-blue-600 border border-blue-400 text-blue-100 font-bold tracking-wider">
              [SIM-KLINIK]
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{clinicName}</h1>
          <p className="text-xs text-blue-100/90 font-mono mt-1">{tagline}</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Silakan masukkan kredensial akun petugas
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
              [PERINGATAN] {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / pendaftaran / kasir"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium bg-slate-50 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {loading ? '[ Memverifikasi... ]' : 'Masuk ke Sistem \u2192'}
            </button>
          </form>

          {/* Quick Login Helper Box */}
          <div className="mt-7 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Akun Uji Coba Cepat (1-Klik Isi):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-mono text-center font-bold transition"
              >
                [Admin]
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('pendaftaran', 'daftar123')}
                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-mono text-center font-bold transition"
              >
                [Pendaftaran]
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('kasir', 'kasir123')}
                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-mono text-center font-bold transition"
              >
                [Kasir]
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[10px] font-mono text-slate-400">
            Akses Jaringan Lokal LAN Diaktifkan [0.0.0.0:3000]
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-xs">
          [Memuat Halaman Login...]
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

