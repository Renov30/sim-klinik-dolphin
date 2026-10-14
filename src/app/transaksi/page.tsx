'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { formatRupiah, formatDateTimeIndo } from '@/lib/format';

interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  payAmount: number;
  changeAmount: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  cashier: { name: string; username: string };
  patient?: { name: string; mrNumber: string } | null;
  items: Array<{
    id: string;
    medicineName: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
}

export default function TransaksiPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [clinicName, setClinicName] = useState('Dolphin e-Clinic');
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const loadSales = useCallback(async (query: string = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sales?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setSales(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

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
    loadSales();
  }, [loadSales]);

  const handleOpenReceipt = async (id: string) => {
    try {
      const res = await fetch(`/api/sales/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedSale(data.data);
        setShowReceiptModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalOmzet = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar clinicName={clinicName} userRole={userRole} userName={userName} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          clinicName={clinicName}
          userName={userName}
          userRole={userRole}
          title="Riwayat Transaksi Penjualan"
          subtitle="Arsip data penjualan kasir farmasi dan pencetakan ulang struk belanja"
        />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Stat metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">
                Total Transaksi
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1">{sales.length} Faktur</p>
              <span className="text-xs font-mono text-blue-600 mt-1 block">
                Tercatat di Database PostgreSQL
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">
                Total Penerimaan Kas
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1 truncate">
                {formatRupiah(totalOmzet)}
              </p>
              <span className="text-xs font-mono text-emerald-600 mt-1 block">
                Total Nilai Penjualan
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">
                Rata-rata Transaksi
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1 truncate">
                {formatRupiah(sales.length > 0 ? totalOmzet / sales.length : 0)}
              </p>
              <span className="text-xs font-mono text-purple-600 mt-1 block">
                Per Pasien / Pelanggan
              </span>
            </div>
          </div>

          {/* Search Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadSales(e.target.value);
                }}
                placeholder="Cari Nomor Faktur (contoh: INV-20261014) atau Nama Pasien..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-sm bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSearch('');
                  loadSales('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
              >
                [Segarkan Data]
              </button>
            </div>
          </div>

          {/* Table Riwayat Transaksi */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm font-mono uppercase tracking-wider">
                Log Transaksi Penjualan Farmasi
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                [Semua Data Tercatat Permanen di Volume Docker]
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                [Memuat riwayat transaksi...]
              </div>
            ) : sales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                [Belum ada data transaksi yang ditemukan]
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">No. Faktur</th>
                      <th className="px-6 py-3.5">Waktu Transaksi</th>
                      <th className="px-6 py-3.5">Pelanggan / Pasien</th>
                      <th className="px-6 py-3.5">Metode Bayar</th>
                      <th className="px-6 py-3.5">Total Belanja</th>
                      <th className="px-6 py-3.5">Kasir</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-blue-50/40 transition">
                        <td className="px-6 py-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                            {sale.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {formatDateTimeIndo(sale.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{sale.customerName}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {sale.items.length} macam obat
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(sale.totalAmount)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {sale.cashier.name}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(sale.id)}
                            className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-mono font-bold transition"
                          >
                            [Cetak Struk]
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL CETAK STRUK */}
      {showReceiptModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800 font-mono">
                [STRUK PENJUALAN FARMASI]
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-700 font-mono text-sm px-2 py-1 rounded bg-slate-100"
              >
                [X]
              </button>
            </div>

            {/* PRINTABLE AREA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 printable-area">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-base font-black tracking-tight">{selectedSale.clinic.name}</h2>
                <p className="text-[10px] text-slate-600">{selectedSale.clinic.address}</p>
                <p className="text-[10px] text-slate-600">Telp: {selectedSale.clinic.phone}</p>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>No. Faktur:</span>
                  <span className="font-bold">{selectedSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{formatDateTimeIndo(selectedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{selectedSale.cashier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{selectedSale.customerName}</span>
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300">
                <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-slate-200 uppercase">
                  <span className="col-span-6">Nama Obat</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Subtotal</span>
                </div>

                <div className="divide-y divide-slate-100 pt-1 text-[11px]">
                  {selectedSale.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-1.5 grid grid-cols-12 items-center">
                      <div className="col-span-6 leading-tight">
                        <span className="font-bold block">{item.medicineName}</span>
                        <span className="text-[10px] text-slate-500">
                          @{formatRupiah(item.unitPrice)}
                        </span>
                      </div>
                      <span className="col-span-2 text-center font-bold">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="col-span-4 text-right font-bold">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span className="text-blue-900">{formatRupiah(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({selectedSale.paymentMethod}):</span>
                  <span>{formatRupiah(selectedSale.payAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(selectedSale.changeAmount)}</span>
                </div>
              </div>

              <div className="pt-3 text-center text-[10px] text-slate-500 leading-tight">
                <p>{selectedSale.clinic.receiptFooter}</p>
                <p className="mt-1 font-mono text-[9px]">=== SALINAN STRUK PEMBELIAN ===</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
              >
                [Tutup]
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold tracking-wide shadow transition"
              >
                [🖨 Cetak Ulang Struk]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

