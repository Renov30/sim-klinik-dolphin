import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getClinicSettings } from '@/lib/clinic';
import { formatRupiah } from '@/lib/format';
import {
  Users,
  Pill,
  Receipt,
  Wallet,
  Printer,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ShoppingCart,
  PackagePlus,
  ArrowUpRight,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();
  const clinic = await getClinicSettings();

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
  ]);

  const todayRevenue = todaySales._sum.totalAmount || 0;
  const totalRevenue = allSales._sum.totalAmount || 0;
  const totalSaleCount = allSales._count.id || 0;
  const avgPerSale = totalSaleCount > 0 ? Math.round(totalRevenue / totalSaleCount) : 0;

  // Invoice badge colors matching Pelio dashboard
  const badgeColors = [
    { bg: 'bg-blue-600', text: 'text-white' },
    { bg: 'bg-amber-400', text: 'text-amber-950' },
    { bg: 'bg-emerald-500', text: 'text-white' },
    { bg: 'bg-rose-500', text: 'text-white' },
    { bg: 'bg-indigo-600', text: 'text-white' },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Ringkasan eksekutif transaksi, rekam medis pasien, dan pergerakan stok farmasi"
    >
      <div className="space-y-6 pb-6">
        {/* ROW 1: 4 VIBRANT METRIC CARDS (Exact match to reference design) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Emerald Green */}
          <div className="relative overflow-hidden rounded-2xl bg-[#00c982] text-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight leading-none">
                  {totalPatients.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-emerald-100 font-medium mt-1">
                  Total Pasien
                </p>
              </div>
            </div>
            {/* Watermark decorative circle */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/15 pointer-events-none" />
          </div>

          {/* Card 2: Sky Blue */}
          <div className="relative overflow-hidden rounded-2xl bg-[#00a8ff] text-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight leading-none">
                  {totalMedicines.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-sky-100 font-medium mt-1">
                  Master Obat
                </p>
              </div>
            </div>
            {/* Watermark decorative circle */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/15 pointer-events-none" />
          </div>

          {/* Card 3: Amber Yellow */}
          <div className="relative overflow-hidden rounded-2xl bg-[#ffb703] text-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight leading-none">
                  {totalSaleCount.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-amber-100 font-medium mt-1">
                  Transaksi Selesai
                </p>
              </div>
            </div>
            {/* Watermark decorative circle */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/15 pointer-events-none" />
          </div>

          {/* Card 4: Coral Red */}
          <div className="relative overflow-hidden rounded-2xl bg-[#ff5d55] text-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight leading-none truncate max-w-[150px]" title={formatRupiah(totalRevenue)}>
                  {formatRupiah(totalRevenue)}
                </p>
                <p className="text-xs text-rose-100 font-medium mt-1">
                  Penerimaan Kasir
                </p>
              </div>
            </div>
            {/* Watermark decorative circle */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/15 pointer-events-none" />
          </div>
        </div>

        {/* QUICK SHORTCUT BAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Akses Cepat Pelayanan:</span>
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              href="/pasien"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Pasien Baru</span>
            </Link>
            <Link
              href="/kasir"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir Penjualan</span>
            </Link>
            <Link
              href="/obat"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Kelola Stok Obat</span>
            </Link>
          </div>
        </div>

        {/* ROW 2: LATEST TRANSACTIONS & STATISTICS CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Latest Transactions (8 cols out of 12 = ~67%) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">
                  Latest Transactions
                </h2>
                <Link
                  href="/transaksi"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Transactions List */}
              <div className="space-y-4">
                {recentSales.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Belum ada riwayat transaksi penjualan kasir.
                  </div>
                ) : (
                  recentSales.map((sale, idx) => {
                    const badge = badgeColors[idx % badgeColors.length];
                    const timeDiffMins = Math.max(
                      1,
                      Math.round(
                        (new Date().getTime() - new Date(sale.createdAt).getTime()) / 60000
                      )
                    );
                    const timeString =
                      timeDiffMins < 60
                        ? `${timeDiffMins} min ago`
                        : `${Math.round(timeDiffMins / 60)} hours ago`;

                    return (
                      <div
                        key={sale.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                      >
                        {/* Invoice & Patient */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shrink-0 ${badge.bg} ${badge.text}`}
                          >
                            #{sale.invoiceNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {sale.patient?.name || sale.customerName || 'Pelanggan Umum'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {sale.items.length} item obat dibeli
                            </p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold leading-none">
                              Amount
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 leading-tight">
                              {formatRupiah(sale.totalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="text-xs text-slate-400 font-medium">
                          {timeString}
                        </div>

                        {/* Actions (Printer & Menu) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href={`/transaksi?invoice=${sale.invoiceNumber}`}
                            title="Cetak Struk Transaksi"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition border border-slate-200/60"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition border border-slate-200/60"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 mt-4 border-t border-slate-100 text-xs text-slate-500">
              <p>
                Showing 1-{Math.min(5, recentSales.length)} from {totalSaleCount} Data
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs"
                >
                  1
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
                >
                  2
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
                >
                  3
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Statistics Chart (4 cols out of 12 = ~33%) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800">Statistics</h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> Over
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span> Under
                  </span>
                </div>
              </div>

              {/* Graphical Multi-color Dual Vertical Bar Visual */}
              <div className="h-52 w-full pt-4 pb-2 flex items-center justify-between px-2">
                {/* Bar 1: Green */}
                <div className="flex flex-col items-center h-full justify-center">
                  <div className="w-2.5 h-16 bg-emerald-500 rounded-full mb-1"></div>
                  <div className="w-2.5 h-6 bg-slate-200 rounded-full"></div>
                </div>

                {/* Bar 2: Coral Red High */}
                <div className="flex flex-col items-center h-full justify-center">
                  <div className="w-2.5 h-28 bg-rose-500 rounded-full mb-1"></div>
                  <div className="w-2.5 h-8 bg-blue-600 rounded-full"></div>
                </div>

                {/* Bar 3: Blue Tall */}
                <div className="flex flex-col items-center h-full justify-center">
                  <div className="w-2.5 h-20 bg-amber-400 rounded-full mb-1"></div>
                  <div className="w-2.5 h-12 bg-blue-600 rounded-full"></div>
                </div>

                {/* Bar 4: Cyan Mid */}
                <div className="flex flex-col items-center h-full justify-center">
                  <div className="w-2.5 h-24 bg-sky-500 rounded-full mb-1"></div>
                  <div className="w-2.5 h-10 bg-slate-200 rounded-full"></div>
                </div>

                {/* Bar 5: Amber */}
                <div className="flex flex-col items-center h-full justify-center">
                  <div className="w-2.5 h-32 bg-rose-500 rounded-full mb-1"></div>
                  <div className="w-2.5 h-14 bg-blue-600 rounded-full"></div>
                </div>

                {/* Bar 6: Blue */}
                <div className="flex flex-col items-center h-full justify-center">
                  <div className="w-2.5 h-14 bg-sky-500 rounded-full mb-1"></div>
                  <div className="w-2.5 h-8 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Bottom 4 Color Legend Dots matching Pelio design */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium text-[11px]">Pasien</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-slate-600 font-medium text-[11px]">Penjualan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-slate-600 font-medium text-[11px]">Stok Masuk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 font-medium text-[11px]">Resep</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: VIRTUAL CARD & SPARKLINE | BALANCE DETAILS | ACTIVITY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Col 1: Digital Clinic Virtual Card + Trend Sparkline */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
            {/* Visual Credit Card */}
            <div className="w-full rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white p-5 shadow-md shadow-blue-500/20 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-xs text-blue-100 block font-medium">Balance</span>
                  <span className="text-2xl font-black tracking-tight">
                    {formatRupiah(todayRevenue || totalRevenue)}
                  </span>
                </div>
                <div className="text-xs text-blue-100 font-mono tracking-widest">
                  •••• •••• 3456
                </div>
              </div>

              <div className="flex justify-between items-end text-xs">
                <div>
                  <p className="text-[10px] text-blue-200">Valid Thru</p>
                  <p className="font-semibold">12/28</p>
                  <p className="text-[10px] text-blue-200 mt-1">Nama Klinik</p>
                  <p className="font-bold tracking-wide uppercase truncate max-w-[140px]">
                    {clinic.name}
                  </p>
                </div>
                {/* Mastercard Overlapping Circles */}
                <div className="flex items-center -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/40"></div>
                  <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-xs"></div>
                </div>
              </div>
            </div>

            {/* Bottom: Transaction Count & Red Sparkline Wave */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Transactions</span>
                <span className="text-xl font-black text-slate-800">
                  {totalSaleCount.toLocaleString('id-ID')}
                </span>
              </div>
              {/* Red/Coral Wave Trend Sparkline matching Pelio */}
              <div className="w-32 h-10">
                <svg viewBox="0 0 120 40" fill="none" className="w-full h-full">
                  <path
                    d="M5 25 C25 20, 35 35, 55 25 C75 15, 85 30, 115 15"
                    stroke="#ff5d55"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Col 2: Balance Details with 2x2 Metric Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-1">
                Balance Details
              </h2>
              <span className="text-xs text-slate-400 block">Total Balance</span>
              <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 mb-5">
                {formatRupiah(totalRevenue)}
              </p>

              {/* 2x2 Metric Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Box 1: Blue Active Pill */}
                <div className="bg-blue-600 text-white rounded-xl p-3.5 shadow-xs">
                  <span className="text-[11px] text-blue-100 block font-medium">
                    Hari Ini
                  </span>
                  <p className="text-sm font-extrabold mt-0.5 truncate" title={formatRupiah(todayRevenue)}>
                    {formatRupiah(todayRevenue)}
                  </p>
                </div>

                {/* Box 2: Light Gray */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Rata-rata Transaksi
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate" title={formatRupiah(avgPerSale)}>
                    {formatRupiah(avgPerSale)}
                  </p>
                </div>

                {/* Box 3: Light Gray */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Obat Kritis
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {lowStockMedicines.length} Item
                  </p>
                </div>

                {/* Box 4: Light Gray */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Pasien Baru
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {newPatientsToday} Pasien
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Activity with 3 Rounded Vertical Pill Meters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Activity</span>
              <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 mb-5">
                {(totalPatients + totalSaleCount).toLocaleString('id-ID')} Pelayanan
              </p>

              {/* 3 Pill Meters + Shift Legend */}
              <div className="flex items-center justify-between gap-4 pt-2">
                {/* Meter 1: Emerald (Sunday) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-700 mb-2">287</span>
                  <div className="w-7 h-28 rounded-full bg-emerald-100 flex flex-col justify-end overflow-hidden p-1">
                    <div className="w-full h-20 bg-emerald-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 font-medium">Min</span>
                </div>

                {/* Meter 2: Coral Red (Monday) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-700 mb-2">312</span>
                  <div className="w-7 h-28 rounded-full bg-rose-100 flex flex-col justify-end overflow-hidden p-1">
                    <div className="w-full h-24 bg-rose-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 font-medium">Sen</span>
                </div>

                {/* Meter 3: Sky Blue (Tuesday) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-700 mb-2">176</span>
                  <div className="w-7 h-28 rounded-full bg-sky-100 flex flex-col justify-end overflow-hidden p-1">
                    <div className="w-full h-14 bg-sky-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 font-medium">Sel</span>
                </div>

                {/* Shift Labels Right */}
                <div className="space-y-3 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-semibold text-slate-600">Pagi / Shift 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1.5 rounded-full bg-rose-500"></span>
                    <span className="text-[11px] font-semibold text-slate-600">Siang / Shift 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1.5 rounded-full bg-sky-500"></span>
                    <span className="text-[11px] font-semibold text-slate-600">Malam / Shift 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
