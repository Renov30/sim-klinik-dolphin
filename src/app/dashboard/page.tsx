import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatRupiah, formatDateTimeIndo } from '@/lib/format';

export default async function DashboardPage() {
  const session = await getSession();

  // Hitung metrik hari ini
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    newPatientsToday,
    totalMedicines,
    lowStockMedicines,
    todaySales,
    allSales,
    recentSales,
    categories,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({
      where: {
        createdAt: { gte: todayStart },
      },
    }),
    prisma.medicine.count(),
    prisma.medicine.findMany({
      where: {
        stock: { lte: prisma.medicine.fields.minStock },
        isActive: true,
      },
      include: { category: true },
      take: 5,
      orderBy: { stock: 'asc' },
    }),
    prisma.sale.aggregate({
      where: {
        createdAt: { gte: todayStart },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.sale.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        cashier: true,
        items: true,
      },
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { medicines: true } },
      },
      take: 6,
    }),
  ]);

  const todayRevenue = todaySales._sum.totalAmount || 0;
  const todayCount = todaySales._count.id || 0;
  const totalRevenue = allSales._sum.totalAmount || 0;
  const totalSaleCount = allSales._count.id || 0;

  // Hitung persentase ketersediaan stok
  const safeStockCount = totalMedicines - lowStockMedicines.length;
  const stockSafetyRate = totalMedicines > 0 ? Math.round((safeStockCount / totalMedicines) * 100) : 100;

  return (
    <DashboardLayout
      title="Dashboard Utama"
      subtitle="Monitoring operasional klinik, pasien, stok farmasi, dan kasir"
    >
      <div className="space-y-6">
        {/* 1. HERO BANNER (Persis referensi visual Afghan Product Dashboard) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 p-6 md:p-8 text-white shadow-lg border border-blue-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-1.5 font-mono text-xs px-2.5 py-1 rounded bg-blue-500/40 border border-blue-400/40 text-blue-100 font-semibold">
                <span>SIM-KLINIK SYSTEM</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>STATUS: STABIL</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Selamat Datang, {session?.name || 'Petugas'}
              </h2>
              <p className="text-blue-100/90 text-sm mt-1 max-w-xl">
                Pantau performa layanan klinik, arus kasir farmasi, dan inventaris obat secara real-time.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Link
                href="/kasir"
                className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs uppercase tracking-wide hover:bg-blue-50 transition shadow-sm font-mono"
              >
                [+ Buka Kasir POS]
              </Link>
            </div>
          </div>

          {/* Sub-cards inside Hero Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
              <span className="text-[11px] font-mono text-blue-200 block uppercase">
                Transaksi Hari Ini
              </span>
              <p className="text-2xl font-black mt-1">{todayCount}</p>
              <span className="text-[10px] font-mono text-emerald-300 mt-1 block">
                [+ Penjualan Obat]
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
              <span className="text-[11px] font-mono text-blue-200 block uppercase">
                Pasien Baru Hari Ini
              </span>
              <p className="text-2xl font-black mt-1">{newPatientsToday}</p>
              <span className="text-[10px] font-mono text-sky-200 mt-1 block">
                [+ Terdaftar di RM]
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
              <span className="text-[11px] font-mono text-blue-200 block uppercase">
                Omzet Hari Ini
              </span>
              <p className="text-xl md:text-2xl font-black mt-1 truncate">
                {formatRupiah(todayRevenue)}
              </p>
              <span className="text-[10px] font-mono text-emerald-300 mt-1 block">
                [Penerimaan Tunai/QRIS]
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
              <span className="text-[11px] font-mono text-blue-200 block uppercase">
                Kesehatan Stok Obat
              </span>
              <p className="text-2xl font-black mt-1">{stockSafetyRate}%</p>
              <span className="text-[10px] font-mono text-amber-200 mt-1 block">
                {lowStockMedicines.length > 0 ? `[${lowStockMedicines.length} Item Kritis]` : '[Semua Aman]'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. STAT CARDS ROW (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pasien */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                [RM-PASIEN]
              </span>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                +100% Aktif
              </span>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{totalPatients}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Pasien Terdaftar</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          {/* Card 2: Master Obat */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                [OBAT-FARMASI]
              </span>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                {totalMedicines} Item
              </span>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{totalMedicines}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Produk Obat</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stockSafetyRate}%` }}></div>
            </div>
          </div>

          {/* Card 3: Total Transaksi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                [TRANSAKSI]
              </span>
              <span className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                Kumulatif
              </span>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{totalSaleCount}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Transaksi Kasir</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>

          {/* Card 4: Total Omzet */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                [PENDAPATAN]
              </span>
              <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-semibold">
                IDR
              </span>
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight truncate">
              {formatRupiah(totalRevenue)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Omzet Penjualan</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        {/* 3. QUICK ACTIONS ROW (Aesthetic Gradient Cards from Afghan Product UI) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              Aksi Cepat Petugas
            </h3>
            <span className="text-xs font-mono text-slate-400">PINTASAN OPERASIONAL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/pasien"
              className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm hover:shadow-md transition hover:-translate-y-0.5 group"
            >
              <div className="font-mono text-xs font-bold text-blue-200 mb-1">
                [+ FORM PASIEN]
              </div>
              <h4 className="text-base font-bold">Daftar Pasien Baru</h4>
              <p className="text-xs text-blue-100/80 mt-1">
                Input data pasien & auto No. Rekam Medis
              </p>
            </Link>

            <Link
              href="/kasir"
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm hover:shadow-md transition hover:-translate-y-0.5 group"
            >
              <div className="font-mono text-xs font-bold text-emerald-200 mb-1">
                [+ POS KASIR]
              </div>
              <h4 className="text-base font-bold">Kasir Penjualan Obat</h4>
              <p className="text-xs text-emerald-100/80 mt-1">
                Keranjang obat, hitung total & cetak struk
              </p>
            </Link>

            <Link
              href="/obat"
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-sm hover:shadow-md transition hover:-translate-y-0.5 group"
            >
              <div className="font-mono text-xs font-bold text-amber-200 mb-1">
                [+ MASTER OBAT]
              </div>
              <h4 className="text-base font-bold">Kelola Stok & Obat</h4>
              <p className="text-xs text-amber-100/80 mt-1">
                Tambah obat, cek saldo, dan satuan
              </p>
            </Link>

            <Link
              href="/transaksi"
              className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-sm hover:shadow-md transition hover:-translate-y-0.5 group"
            >
              <div className="font-mono text-xs font-bold text-purple-200 mb-1">
                [= RIWAYAT]
              </div>
              <h4 className="text-base font-bold">Riwayat Transaksi</h4>
              <p className="text-xs text-purple-100/80 mt-1">
                Arsip penjualan dan cetak ulang faktur
              </p>
            </Link>
          </div>
        </div>

        {/* 4. MAIN DETAILS: 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions List (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-base">Aktivitas Transaksi Kasir Terbaru</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Penjualan obat yang baru selesai diproses</p>
              </div>
              <Link
                href="/transaksi"
                className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                [Lihat Semua]
              </Link>
            </div>

            {recentSales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-mono text-xs">
                [Belum ada transaksi hari ini]
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {sale.invoiceNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                        {sale.customerName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {sale.items.length} item • Kasir: {sale.cashier.name} • {formatDateTimeIndo(sale.createdAt)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-slate-900 font-mono">
                        {formatRupiah(sale.totalAmount)}
                      </p>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        LUNAS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Low Stock Warnings */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Peringatan Stok Obat</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Item mencapai batas minimum</p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {lowStockMedicines.length} Item
                </span>
              </div>

              {lowStockMedicines.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                  [OK] Semua stok obat dalam kondisi aman di atas batas minimum.
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockMedicines.map((med) => (
                    <div
                      key={med.id}
                      className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-mono font-bold text-rose-800">{med.code}</p>
                        <p className="text-sm font-bold text-slate-800">{med.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Kategori: {med.category.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm font-black text-rose-600 block">
                          Sisa: {med.stock} {med.unit}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Min: {med.minStock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href="/obat"
                className="block w-full py-2.5 px-4 text-center rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-mono font-bold transition"
              >
                [Kelola Stok di Master Obat &rarr;]
              </Link>
            </div>
          </div>
        </div>

        {/* 5. CATEGORIES OVERVIEW */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Kategori Formularium Obat</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Klasifikasi dan ketersediaan jenis obat</p>
            </div>
            <Link
              href="/obat"
              className="text-xs font-mono font-bold text-blue-600 hover:underline"
            >
              [Lihat Formularium]
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center hover:bg-blue-50/50 hover:border-blue-200 transition"
              >
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold block mb-1">
                  KAT
                </span>
                <p className="text-xs font-bold text-slate-800 truncate" title={cat.name}>
                  {cat.name}
                </p>
                <p className="text-[11px] font-mono text-blue-600 font-bold mt-1">
                  {cat._count.medicines} Produk
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
