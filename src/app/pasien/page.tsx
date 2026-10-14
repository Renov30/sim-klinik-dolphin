'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { formatDateIndo, formatRupiah } from '@/lib/format';

interface Patient {
  id: string;
  mrNumber: string;
  nik: string | null;
  name: string;
  gender: 'L' | 'P';
  birthDate: string;
  phone: string | null;
  address: string | null;
  bloodType: string | null;
  allergy: string | null;
  createdAt: string;
  _count?: { sales: number };
}

export default function PasienPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState('Dolphin e-Clinic');
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSales, setPatientSales] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    gender: 'L' as 'L' | 'P',
    birthDate: '',
    phone: '',
    address: '',
    bloodType: 'O',
    allergy: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Fetch initial data
  const loadPatients = useCallback(async (query: string = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ambil info sesi
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setUserRole(d.user.role);
          setUserName(d.user.name);
        }
      });

    // Ambil nama klinik
    const cName = process.env.NEXT_PUBLIC_CLINIC_NAME || 'Dolphin e-Clinic';
    setClinicName(cName);

    loadPatients();
  }, [loadPatients]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadPatients(val);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      nik: '',
      gender: 'L',
      birthDate: '1995-01-01',
      phone: '',
      address: '',
      bloodType: 'O',
      allergy: '',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setSelectedPatient(p);
    setFormData({
      name: p.name,
      nik: p.nik || '',
      gender: p.gender,
      birthDate: p.birthDate.slice(0, 10),
      phone: p.phone || '',
      address: p.address || '',
      bloodType: p.bloodType || 'O',
      allergy: p.allergy || '',
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleOpenDetail = async (p: Patient) => {
    setSelectedPatient(p);
    setShowDetailModal(true);
    setPatientSales([]);
    try {
      const res = await fetch(`/api/patients/${p.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedPatient(data.data);
        setPatientSales(data.data.sales || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal menyimpan data');
        setSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setSuccessToast(data.message);
      setTimeout(() => setSuccessToast(''), 4000);
      loadPatients(search);
    } catch {
      setFormError('Kesalahan jaringan saat menyimpan pasien');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal memperbarui data');
        setSubmitting(false);
        return;
      }

      setShowEditModal(false);
      setSuccessToast('Data pasien berhasil diperbarui');
      setTimeout(() => setSuccessToast(''), 4000);
      loadPatients(search);
    } catch {
      setFormError('Kesalahan jaringan saat memperbarui pasien');
    } finally {
      setSubmitting(false);
    }
  };

  // Hitung usia
  const getAge = (birthDateStr: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar clinicName={clinicName} userRole={userRole} userName={userName} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          clinicName={clinicName}
          userName={userName}
          userRole={userRole}
          title="Pendaftaran Pasien"
          subtitle="Kelola data pasien, pembuatan otomatis Nomor Rekam Medis unik, dan rekam kontak"
        />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Toast Notifikasi */}
          {successToast && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-mono flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold">[BERHASIL]</span>
                <span>{successToast}</span>
              </div>
              <button
                onClick={() => setSuccessToast('')}
                className="text-xs text-emerald-600 hover:text-emerald-900 font-bold"
              >
                [X]
              </button>
            </div>
          )}

          {/* Action Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pencarian Data Pasien
              </label>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Cari nama, No. RM (contoh: RM-2610), NIK, atau No. HP..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-sm bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                Total: <strong className="text-slate-800">{patients.length}</strong> Pasien
              </span>
              <button
                onClick={handleOpenAdd}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow transition font-mono cursor-pointer"
              >
                + Tambah Pasien Baru
              </button>
            </div>
          </div>

          {/* Table Pasien */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm font-mono uppercase tracking-wider">
                Daftar Pasien Terdaftar
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                [Nomor RM Dihasilkan Berurutan Otomatis]
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                [Memuat database pasien...]
              </div>
            ) : patients.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-mono text-sm text-slate-500 mb-2">
                  Tidak ditemukan data pasien yang sesuai pencarian.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-mono font-bold"
                >
                  + Daftarkan Pasien Sekarang
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">No. Rekam Medis</th>
                      <th className="px-6 py-3.5">Nama Pasien</th>
                      <th className="px-6 py-3.5">NIK / KTP</th>
                      <th className="px-6 py-3.5">Gender / Usia</th>
                      <th className="px-6 py-3.5">No. WhatsApp/HP</th>
                      <th className="px-6 py-3.5">Alergi</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {patients.map((p) => {
                      const age = getAge(p.birthDate);
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/40 transition">
                          <td className="px-6 py-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                              {p.mrNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Gol. Darah: {p.bloodType || '-'}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {p.nik || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                p.gender === 'L'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {p.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono ml-2">
                              {age} th
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {p.phone || '-'}
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate text-xs font-mono">
                            {p.allergy ? (
                              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {p.allergy}
                              </span>
                            ) : (
                              <span className="text-slate-400">Tidak ada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                              <button
                                onClick={() => handleOpenDetail(p)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              >
                                [Detail]
                              </button>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                              >
                                [Edit]
                              </button>
                              <Link
                                href={`/kasir?patientId=${p.id}&patientName=${encodeURIComponent(
                                  p.name
                                )}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold transition"
                              >
                                [Kasir &rarr;]
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL 1: TAMBAH PASIEN BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pendaftaran Pasien Baru</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Nomor Rekam Medis (No. RM) akan dibuat secara otomatis dan berurutan
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-mono text-sm px-2 py-1 rounded bg-slate-100"
              >
                [X]
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                [ERROR] {formError}
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Nomor Rekam Medis (Auto Sistem)
                </label>
                <input
                  type="text"
                  disabled
                  value="[Auto Generated Format: RM-YYYYMM-XXXX]"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 font-mono text-blue-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Nama Lengkap Pasien *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    NIK / KTP (16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="Contoh: 3171012304900001"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="-">- (Tidak Tahu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Riwayat Alergi (Obat/Makanan)
                  </label>
                  <input
                    type="text"
                    value={formData.allergy}
                    onChange={(e) => setFormData({ ...formData, allergy: e.target.value })}
                    placeholder="Contoh: Alergi Penisilin, Asam Mefenamat"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nama jalan, RT/RW, Kelurahan, Kecamatan, Kota"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
                >
                  [Batal]
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold tracking-wide shadow transition"
                >
                  {submitting ? '[Menyimpan...]' : '[Simpan & Terbitkan No. RM]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PASIEN */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Data Pasien</h3>
                <p className="text-xs text-blue-700 font-mono mt-0.5 font-bold">
                  No. Rekam Medis: {selectedPatient.mrNumber}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-mono text-sm px-2 py-1 rounded bg-slate-100"
              >
                [X]
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                [ERROR] {formError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Nama Lengkap Pasien *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    NIK / KTP (16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="-">- (Tidak Tahu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Riwayat Alergi
                  </label>
                  <input
                    type="text"
                    value={formData.allergy}
                    onChange={(e) => setFormData({ ...formData, allergy: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
                >
                  [Batal]
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold tracking-wide shadow transition"
                >
                  {submitting ? '[Menyimpan...]' : '[Perbarui Data Pasien]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL PASIEN & RIWAYAT TRANSAKSI */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {selectedPatient.mrNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800">{selectedPatient.name}</h3>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Terdaftar sejak: {formatDateIndo(selectedPatient.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-700 font-mono text-sm px-2 py-1 rounded bg-slate-100"
              >
                [X]
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Jenis Kelamin</span>
                <span className="font-bold text-slate-800">
                  {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Tanggal Lahir</span>
                <span className="font-bold text-slate-800">
                  {formatDateIndo(selectedPatient.birthDate)} ({getAge(selectedPatient.birthDate)} th)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Golongan Darah</span>
                <span className="font-bold text-slate-800">{selectedPatient.bloodType || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">NIK</span>
                <span className="font-bold text-slate-800">{selectedPatient.nik || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">No. WhatsApp/HP</span>
                <span className="font-bold text-slate-800">{selectedPatient.phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Riwayat Alergi</span>
                <span className="font-bold text-rose-700">{selectedPatient.allergy || 'Tidak ada'}</span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-400 block text-[10px] uppercase">Alamat Pasien</span>
                <span className="font-bold text-slate-800">{selectedPatient.address || '-'}</span>
              </div>
            </div>

            {/* Riwayat Penjualan Obat */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
                  Riwayat Pembelian Obat Farmasi
                </h4>
                <Link
                  href={`/kasir?patientId=${selectedPatient.id}&patientName=${encodeURIComponent(
                    selectedPatient.name
                  )}`}
                  className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-100 transition"
                >
                  [+ Transaksi Obat Baru]
                </Link>
              </div>

              {patientSales.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  [Belum ada transaksi obat untuk pasien ini]
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {patientSales.map((sale) => (
                    <div key={sale.id} className="p-3 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">
                            {sale.invoiceNumber}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {formatDateIndo(sale.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {sale.items.map((i: any) => `${i.medicineName} (${i.quantity})`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">
                          {formatRupiah(sale.totalAmount)}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">
                          [LUNAS - {sale.paymentMethod}]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
              >
                [Tutup]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
