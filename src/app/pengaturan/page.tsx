'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import ClinicLogo from '@/components/ClinicLogo';
import {
  Save,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export default function PengaturanPage() {
  const [formData, setFormData] = useState({
    name: 'Dolphin e-Clinic',
    tagline: 'Sistem Informasi Manajemen Klinik Terpadu',
    address: 'Jl. Kesehatan Raya No. 12, Jakarta',
    phone: '021-555-1234',
    email: 'kontak@dolphineclinic.id',
    receiptFooter: 'Semoga Lekas Sembuh & Terima Kasih Atas Kunjungan Anda',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setUserRole(d.user.role);
          setUserName(d.user.name);
        }
      });

    fetch('/api/settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setFormData(d.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Gagal menyimpan pengaturan');
        setSaving(false);
        return;
      }

      setMessage(data.message);
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setError('Kesalahan jaringan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f4f9] font-sans text-slate-800 antialiased">
      <Sidebar clinicName={formData.name} userRole={userRole} userName={userName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <TopNavbar
          clinicName={formData.name}
          userName={userName}
          userRole={userRole}
          title="Pengaturan Klinik & Instansi"
          subtitle="Ubah nama klinik, identitas instansi, alamat, dan teks struk kasir tanpa ubah source code"
        />

        <main className="flex-1 px-8 pb-8 pt-0 space-y-6">
          {message && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">Berhasil:</span>
                <span>{message}</span>
              </div>
              <button
                onClick={() => setMessage('')}
                className="text-xs text-emerald-600 hover:text-emerald-900 font-bold p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-bold">Gagal:</span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError('')}
                className="text-xs text-rose-600 hover:text-rose-900 font-bold p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Pengaturan (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-base">Identitas Klinik / Instansi</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Perubahan nama akan langsung diterapkan di seluruh antarmuka dan struk cetak
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  Memuat pengaturan...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Nama Klinik / Fasilitas Kesehatan *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Dolphin e-Clinic, Klinik Pratama Sehat"
                      className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-800 rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Catatan: Nama juga dapat diatur secara statis melalui environment variable{' '}
                      <code className="font-semibold text-slate-700">NEXT_PUBLIC_CLINIC_NAME</code> di file <code className="font-semibold text-slate-700">.env</code>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Tagline / Slogan Layanan *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                        No. Telepon / WhatsApp Klinik *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                        Email Resmi *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Alamat Lengkap Klinik *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Pesan Kaki Struk Kasir (Receipt Footer) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.receiptFooter}
                      onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                      placeholder="Contoh: Semoga Lekas Sembuh & Terima Kasih"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-md shadow-blue-500/20 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Klinik'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Preview Struk & Hak Akses (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Live Brand Preview Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-3 tracking-wider">
                  Pratinjau Logo & Branding Header:
                </span>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <ClinicLogo name={formData.name} size="md" />
                  <p className="text-xs text-slate-500 mt-2 pl-12">{formData.tagline}</p>
                </div>
              </div>

              {/* Preview Struk Kasir */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Pratinjau Live Header Struk:
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs space-y-1">
                  <p className="font-bold text-sm text-slate-900">{formData.name}</p>
                  <p className="text-xs text-slate-600">{formData.address}</p>
                  <p className="text-xs text-slate-600">Telp: {formData.phone}</p>
                  <div className="py-2 border-y border-dashed border-slate-300 my-2 text-xs text-slate-400">
                    Area Rincian Obat & Total Tagihan
                  </div>
                  <p className="text-xs text-slate-500 italic mt-2">{formData.receiptFooter}</p>
                </div>
              </div>

              {/* Data Akun Petugas Bawaan */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Hak Akses Pengguna Sistem (RBAC)
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-blue-950">Administrator</p>
                      <p className="text-xs text-blue-800">Username: admin</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-bold">
                      SEMUA FITUR
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Petugas Pendaftaran</p>
                      <p className="text-xs text-slate-500">Username: pendaftaran</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold">
                      DATA PASIEN
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Kasir Farmasi</p>
                      <p className="text-xs text-slate-500">Username: kasir</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      KASIR & STOK
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
