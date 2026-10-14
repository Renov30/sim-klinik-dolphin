'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { formatRupiah, formatDateTimeIndo } from '@/lib/format';
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  Wallet,
  TrendingUp,
  CreditCard,
  X,
} from 'lucide-react';

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
    <div className="flex h-screen overflow-hidden bg-[#f1f4f9] font-sans text-slate-800 antialiased">
      <Sidebar clinicName={clinicName} userRole={userRole} userName={userName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <TopNavbar
          clinicName={clinicName}
          userName={userName}
          userRole={userRole}
          title="Riwayat Transaksi Penjualan"
          subtitle="Arsip data penjualan kasir farmasi dan pencetakan ulang struk belanja"
        />

        <main className="flex-1 px-8 pb-8 pt-0 space-y-6">
          {/* Stat metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  Total Transaksi
                </span>
                <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{sales.length} Faktur</p>
                <span className="text-xs text-blue-600 font-semibold">
                  Tercatat di PostgreSQL
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  Total Penerimaan Kas
                </span>
                <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 truncate" title={formatRupiah(totalOmzet)}>
                  {formatRupiah(totalOmzet)}
                </p>
                <span className="text-xs text-emerald-600 font-semibold">
                  Pemasukan Kasir
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  Rata-rata Transaksi
                </span>
                <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 truncate" title={formatRupiah(sales.length > 0 ? totalOmzet / sales.length : 0)}>
                  {formatRupiah(sales.length > 0 ? totalOmzet / sales.length : 0)}
                </p>
                <span className="text-xs text-purple-600 font-semibold">
                  Per Pasien / Transaksi
                </span>
              </div>
            </div>
          </div>

          {/* Search Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadSales(e.target.value);
                }}
                placeholder="Cari Nomor Faktur (contoh: INV-20261014) atau Nama Pasien..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm bg-slate-50 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSearch('');
                  loadSales('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Segarkan Data</span>
              </button>
            </div>
          </div>

          {/* Table Riwayat Transaksi */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                Log Transaksi Penjualan Farmasi
              </h3>
              <span className="text-xs text-slate-400">
                Semua Data Tersimpan di PostgreSQL
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Memuat riwayat transaksi...
              </div>
            ) : sales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Belum ada data transaksi yang ditemukan
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-100 font-semibold">
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
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-bold text-blue-700 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-semibold">
                            {sale.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                          {formatDateTimeIndo(sale.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{sale.customerName}</p>
                          <p className="text-xs text-slate-400">
                            {sale.items.length} macam obat
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(sale.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                          {sale.cashier.name}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(sale.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span>Cetak Struk</span>
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
              <h3 className="text-base font-bold text-slate-800">
                Struk Penjualan Farmasi
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            {/* PRINTABLE AREA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 printable-area">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-base font-bold tracking-tight">{selectedSale.clinic.name}</h2>
                <p className="text-xs text-slate-600">{selectedSale.clinic.address}</p>
                <p className="text-xs text-slate-600">Telp: {selectedSale.clinic.phone}</p>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">No. Faktur:</span>
                  <span className="font-semibold">{selectedSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Waktu:</span>
                  <span>{formatDateTimeIndo(selectedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Kasir:</span>
                  <span>{selectedSale.cashier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pelanggan:</span>
                  <span className="font-semibold">{selectedSale.customerName}</span>
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300">
                <div className="grid grid-cols-12 font-semibold text-[11px] pb-1 border-b border-slate-200 uppercase text-slate-600">
                  <span className="col-span-6">Nama Obat</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Subtotal</span>
                </div>

                <div className="divide-y divide-slate-100 pt-1 text-xs">
                  {selectedSale.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-1.5 grid grid-cols-12 items-center">
                      <div className="col-span-6 leading-tight">
                        <span className="font-semibold block">{item.medicineName}</span>
                        <span className="text-[11px] text-slate-500">
                          @{formatRupiah(item.unitPrice)}
                        </span>
                      </div>
                      <span className="col-span-2 text-center font-medium">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="col-span-4 text-right font-semibold">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
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
                  <span className="text-emerald-800">{formatRupiah(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bayar ({selectedSale.paymentMethod}):</span>
                  <span>{formatRupiah(selectedSale.payAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(selectedSale.changeAmount)}</span>
                </div>
              </div>

              <div className="pt-3 text-center text-xs text-slate-500 leading-tight">
                <p>{selectedSale.clinic.receiptFooter}</p>
                <p className="mt-1 text-[11px] text-slate-400">SALINAN STRUK PEMBELIAN</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

