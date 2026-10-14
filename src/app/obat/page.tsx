'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { formatRupiah, formatDateTimeIndo } from '@/lib/format';

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: { medicines: number };
}

interface Medicine {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category: Category;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceNo: string | null;
  notes: string | null;
  createdAt: string;
  createdBy?: { name: string } | null;
}

export default function ObatPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  const [clinicName, setClinicName] = useState('Dolphin e-Clinic');
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);

  // Forms
  const [addForm, setAddForm] = useState({
    code: '',
    name: '',
    categoryId: '',
    unit: 'Tablet',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 10,
    location: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    categoryId: '',
    unit: 'Tablet',
    buyPrice: 0,
    sellPrice: 0,
    minStock: 10,
    location: '',
  });

  const [stockForm, setStockForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 10,
    referenceNo: '',
    notes: 'Penerimaan stok dari supplier / restock',
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (lowStockFilter) params.set('lowStock', 'true');

      const res = await fetch(`/api/medicines?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, lowStockFilter]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setUserRole(d.user.role);
          setUserName(d.user.name);
        }
      });

    setClinicName(process.env.NEXT_PUBLIC_CLINIC_NAME || 'Dolphin e-Clinic');
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  // Open Handlers
  const handleOpenAdd = () => {
    setAddForm({
      code: `OBT-${String(medicines.length + 1).padStart(3, '0')}`,
      name: '',
      categoryId: categories[0]?.id || '',
      unit: 'Strip',
      buyPrice: 5000,
      sellPrice: 10000,
      stock: 50,
      minStock: 10,
      location: 'Rak A-01',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: Medicine) => {
    setSelectedMed(m);
    setEditForm({
      name: m.name,
      categoryId: m.categoryId,
      unit: m.unit,
      buyPrice: m.buyPrice,
      sellPrice: m.sellPrice,
      minStock: m.minStock,
      location: m.location || '',
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleOpenStock = (m: Medicine) => {
    setSelectedMed(m);
    setStockForm({
      type: 'IN',
      quantity: 10,
      referenceNo: `RESTOCK-${Date.now().toString().slice(-4)}`,
      notes: 'Penerimaan stok dari distributor/faktur',
    });
    setFormError('');
    setShowStockModal(true);
  };

  const handleOpenHistory = async (m: Medicine) => {
    setSelectedMed(m);
    setShowHistoryModal(true);
    setStockHistory([]);
    try {
      const res = await fetch(`/api/medicines/${m.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStockHistory(data.data.stockMovements || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Handlers
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal menambah obat');
        setSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setToast(data.message);
      setTimeout(() => setToast(''), 4000);
      loadMedicines();
      loadCategories();
    } catch {
      setFormError('Kesalahan jaringan saat menyimpan obat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/medicines/${selectedMed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal mengubah obat');
        setSubmitting(false);
        return;
      }

      setShowEditModal(false);
      setToast('Data obat berhasil diperbarui');
      setTimeout(() => setToast(''), 4000);
      loadMedicines();
    } catch {
      setFormError('Kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/medicines/${selectedMed.id}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal mengubah stok');
        setSubmitting(false);
        return;
      }

      setShowStockModal(false);
      setToast(data.message);
      setTimeout(() => setToast(''), 4000);
      loadMedicines();
    } catch {
      setFormError('Kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal membuat kategori');
        return;
      }

      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setToast('Kategori baru berhasil ditambahkan');
      setTimeout(() => setToast(''), 4000);
      loadCategories();
    } catch {
      setFormError('Kesalahan jaringan');
    }
  };

  // Metrik ringkas
  const totalStockUnits = medicines.reduce((acc, m) => acc + m.stock, 0);
  const totalValuation = medicines.reduce((acc, m) => acc + m.stock * m.buyPrice, 0);
  const criticalCount = medicines.filter((m) => m.stock <= m.minStock).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar clinicName={clinicName} userRole={userRole} userName={userName} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          clinicName={clinicName}
          userName={userName}
          userRole={userRole}
          title="Master Obat & Inventaris Stok"
          subtitle="Katalog obat, kategori terapi, harga jual, dan kontrol stok otomatis anti-minus"
        />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Toast Notification */}
          {toast && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-mono flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold">[BERHASIL]</span>
                <span>{toast}</span>
              </div>
              <button
                onClick={() => setToast('')}
                className="text-xs text-emerald-600 hover:text-emerald-900 font-bold"
              >
                [X]
              </button>
            </div>
          )}

          {/* Stat summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">
                Total Item Produk
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1">{medicines.length} Obat</p>
              <span className="text-xs font-mono text-blue-600 mt-1 block">
                {totalStockUnits} Total Unit Fisik Tersedia
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">
                Estimasi Nilai Aset Stok (HPP)
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1 truncate">
                {formatRupiah(totalValuation)}
              </p>
              <span className="text-xs font-mono text-emerald-600 mt-1 block">
                Total Modal Terikat di Apotek
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">
                Kondisi Stok Kritis
              </span>
              <p className="text-2xl font-black text-rose-600 mt-1">{criticalCount} Item</p>
              <span className="text-xs font-mono text-rose-600 mt-1 block">
                {criticalCount > 0 ? 'Perlu Segera Restock / Order' : 'Semua Stok di Atas Batas Minimum'}
              </span>
            </div>
          </div>

          {/* Action Header Card & Filter */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama obat atau kode (contoh: OBT-001, Paracetamol)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-sm bg-slate-50 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  onClick={() => setLowStockFilter(!lowStockFilter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition border ${
                    lowStockFilter
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {lowStockFilter ? '[✓ FILTER: STOK KRITIS]' : '[! Tampilkan Stok Kritis]'}
                </button>

                {userRole === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setFormError('');
                      setShowCategoryModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold border border-slate-200 transition"
                  >
                    + Kategori
                  </button>
                )}

                {userRole === 'ADMIN' && (
                  <button
                    onClick={handleOpenAdd}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-sm font-mono cursor-pointer transition"
                  >
                    + Tambah Obat Baru
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === ''
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({medicines.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                    selectedCategory === c.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Table Master Obat */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm font-mono uppercase tracking-wider">
                Daftar Obat Farmasi Klinik
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                [Stok Berkurang Otomatis Saat Penjualan Kasir]
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                [Memuat data obat & stok...]
              </div>
            ) : medicines.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-mono text-sm text-slate-500 mb-2">
                  Tidak ditemukan obat yang cocok dengan filter.
                </p>
                {userRole === 'ADMIN' && (
                  <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-mono font-bold"
                  >
                    + Tambah Obat Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Kode Obat</th>
                      <th className="px-6 py-3.5">Nama Obat / Kategori</th>
                      <th className="px-6 py-3.5">Satuan</th>
                      <th className="px-6 py-3.5">Harga Beli</th>
                      <th className="px-6 py-3.5">Harga Jual</th>
                      <th className="px-6 py-3.5">Sisa Stok</th>
                      <th className="px-6 py-3.5">Lokasi Rak</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {medicines.map((m) => {
                      const isLow = m.stock <= m.minStock;
                      const isOut = m.stock === 0;
                      return (
                        <tr key={m.id} className="hover:bg-blue-50/40 transition">
                          <td className="px-6 py-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                              {m.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-bold text-slate-800">{m.name}</p>
                            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5">
                              {m.category?.name || 'Tanpa Kategori'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {m.unit}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                            {formatRupiah(m.buyPrice)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {formatRupiah(m.sellPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {m.stock} {m.unit}
                              </span>
                              {isLow && (
                                <span className="text-[10px] font-mono text-rose-600 font-semibold">
                                  [Min: {m.minStock}]
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {m.location || '-'}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                              <button
                                onClick={() => handleOpenStock(m)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold transition"
                                title="Tambah Stok / Restock"
                              >
                                [+ Stok]
                              </button>
                              <button
                                onClick={() => handleOpenHistory(m)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Kartu Riwayat Stok"
                              >
                                [Kartu Stok]
                              </button>
                              {userRole === 'ADMIN' && (
                                <button
                                  onClick={() => handleOpenEdit(m)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                                >
                                  [Edit]
                                </button>
                              )}
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

      {/* MODAL 1: TAMBAH OBAT BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Tambah Obat Baru</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Input data master obat beserta harga dan saldo awal
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Kode Obat *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.code}
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: OBT-010"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Kategori Obat *
                  </label>
                  <select
                    required
                    value={addForm.categoryId}
                    onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Nama Lengkap Obat & Dosis *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Contoh: Paracetamol 500mg, Amoxicillin 500mg"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Satuan Kemasan *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    placeholder="Strip / Botol / Tablet / Tube"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Harga Beli / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.buyPrice}
                    onChange={(e) => setAddForm({ ...addForm, buyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Harga Jual Kasir (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addForm.sellPrice}
                    onChange={(e) => setAddForm({ ...addForm, sellPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.stock}
                    onChange={(e) => setAddForm({ ...addForm, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Stok Minimum (Alert)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.minStock}
                    onChange={(e) => setAddForm({ ...addForm, minStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    placeholder="Contoh: Rak A-01"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
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
                  {submitting ? '[Menyimpan...]' : '[Simpan Master Obat]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT OBAT */}
      {showEditModal && selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Data Obat</h3>
                <p className="text-xs text-blue-700 font-mono mt-0.5 font-bold">
                  Kode: {selectedMed.code} | Stok Saat Ini: {selectedMed.stock} {selectedMed.unit}
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
                    Nama Obat *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Kategori Obat *
                  </label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Satuan Kemasan *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Harga Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.buyPrice}
                    onChange={(e) => setEditForm({ ...editForm, buyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Harga Jual Kasir (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.sellPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Stok Minimum (Alert)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.minStock}
                    onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
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
                  {submitting ? '[Menyimpan...]' : '[Perbarui Data Obat]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PENYESUAIAN / RESTOCK STOK */}
      {showStockModal && selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Kelola Saldo Stok Fisik</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedMed.name} ({selectedMed.code})
                </p>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-slate-400 hover:text-slate-700 font-mono text-sm px-2 py-1 rounded bg-slate-100"
              >
                [X]
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono flex justify-between">
              <span>Sisa Stok Sekarang:</span>
              <strong className="text-blue-800">
                {selectedMed.stock} {selectedMed.unit}
              </strong>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                [ERROR] {formError}
              </div>
            )}

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Jenis Pergerakan Stok
                </label>
                <select
                  value={stockForm.type}
                  onChange={(e) => setStockForm({ ...stockForm, type: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                >
                  <option value="IN">+ Stok Masuk (Restock / Penerimaan Supplier)</option>
                  <option value="OUT">- Stok Keluar (Kadaluarsa / Rusak / Return)</option>
                  <option value="ADJUSTMENT">= Penyesuaian Audit Fisik (Set Saldo Baru)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  {stockForm.type === 'ADJUSTMENT' ? 'Saldo Akhir Hasil Audit Fisik *' : 'Jumlah Perubahan Unit *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  No. Referensi / Faktur
                </label>
                <input
                  type="text"
                  value={stockForm.referenceNo}
                  onChange={(e) => setStockForm({ ...stockForm, referenceNo: e.target.value })}
                  placeholder="Contoh: INV-SUPP-9921 / OPNAME-2026"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Alasan / Keterangan *
                </label>
                <textarea
                  rows={2}
                  required
                  value={stockForm.notes}
                  onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                  placeholder="Catatan alasan perubahan stok"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
                >
                  [Batal]
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold tracking-wide shadow transition"
                >
                  {submitting ? '[Memproses...]' : '[Konfirmasi Update Stok]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: KARTU RIWAYAT STOK (STOCK MOVEMENTS) */}
      {showHistoryModal && selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Kartu Riwayat Stok</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Audit mutasi masuk, keluar, dan transaksi kasir untuk {selectedMed.name}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 font-mono text-sm px-2 py-1 rounded bg-slate-100"
              >
                [X]
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <span>Sisa Stok Fisik Sekarang:</span>
              <strong className="text-base text-blue-700">
                {selectedMed.stock} {selectedMed.unit}
              </strong>
            </div>

            {stockHistory.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded-xl">
                [Belum ada rekaman pergerakan stok]
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Waktu</th>
                      <th className="px-4 py-2.5">Jenis</th>
                      <th className="px-4 py-2.5">Qty</th>
                      <th className="px-4 py-2.5">Saldo</th>
                      <th className="px-4 py-2.5">Ref / Catatan</th>
                      <th className="px-4 py-2.5">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                          {formatDateTimeIndo(h.createdAt)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              h.type === 'IN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : h.type === 'SALE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {h.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-bold">
                          {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-800">
                          {h.balanceBefore} &rarr; <strong className="text-blue-700">{h.balanceAfter}</strong>
                        </td>
                        <td className="px-4 py-2.5 max-w-xs truncate text-slate-600">
                          {h.referenceNo ? `[${h.referenceNo}] ` : ''}
                          {h.notes || '-'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                          {h.createdBy?.name || 'Sistem'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
              >
                [Tutup]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: TAMBAH KATEGORI */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Tambah Kategori Obat</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
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

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Nama Kategori Terapi *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Contoh: Analgesik, Antipiretik, Salep Mata"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 uppercase">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Keterangan singkat golongan obat"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
                >
                  [Batal]
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold tracking-wide shadow transition"
                >
                  [Simpan Kategori]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
