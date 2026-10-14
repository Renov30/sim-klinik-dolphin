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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-blue-600 text-white p-7 text-center border-b border-blue-700">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-blue-700 border border-blue-500/60 text-blue-100 font-bold tracking-wider uppercase">
              SIM-KLINIK
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{clinicName}</h1>
          <p className="text-xs text-blue-100 mt-1">{tagline}</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Silakan masukkan kredensial akun petugas
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <strong>Peringatan:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
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
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick Login Helper Box */}
          <div className="mt-7 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Akun Uji Coba Cepat (1-Klik Isi):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs text-center font-bold transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('pendaftaran', 'daftar123')}
                className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs text-center font-bold transition"
              >
                Pendaftaran
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('kasir', 'kasir123')}
                className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs text-center font-bold transition"
              >
                Kasir
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Akses Jaringan Lokal (LAN) Aktif
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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-medium">
          Memuat Halaman Login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
