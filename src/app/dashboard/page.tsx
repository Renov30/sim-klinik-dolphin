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
    topMedicines,
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
    prisma.medicine.findMany({
      where: { isActive: true },
      orderBy: { sellPrice: 'desc' },
      take: 3,
      include: { category: true },
    }),
  ]);

  const todayRevenue = todaySales._sum.totalAmount || 0;
  const todayCount = todaySales._count.id || 0;
  const totalRevenue = allSales._sum.totalAmount || 0;
  const totalSaleCount = allSales._count.id || 0;
  const avgPerSale = totalSaleCount > 0 ? Math.round(totalRevenue / totalSaleCount) : 0;

  // Tanggal terformat Indonesia
  const todayDateString = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Hitung persentase ketersediaan stok
  const safeStockCount = totalMedicines - lowStockMedicines.length;
  const stockSafetyRate = totalMedicines > 0 ? Math.round((safeStockCount / totalMedicines) * 100) : 100;

  return (
    <DashboardLayout
      title="Dashboard Utama"
      subtitle="Monitoring operasional klinik, pasien, stok farmasi, dan kasir"
    >
      <div className="space-y-6">
        {/* 1. HERO BANNER (Rich Emerald Green matching Reference UI) */}
        <div className="relative overflow-hidden rounded-2xl bg-emerald-800 p-6 md:p-8 text-white shadow-sm border border-emerald-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-900 text-emerald-200 border border-emerald-700 font-semibold uppercase tracking-wider">
                  SIM-KLINIK OPERASIONAL
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-emerald-100 font-medium">
                  {todayDateString}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Selamat Datang, {session?.name || 'Administrator'}
              </h2>
              <p className="text-emerald-100 text-sm mt-1 max-w-xl font-normal leading-relaxed">
                Pantau performa layanan klinik, arus transaksi kasir farmasi, dan ketersediaan obat secara langsung.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Link
                href="/pasien"
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs tracking-wide transition border border-emerald-600/70 shadow-xs"
              >
                + Daftar Pasien
              </Link>
              <Link
                href="/kasir"
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs tracking-wide hover:bg-emerald-50 transition shadow-sm"
              >
                + Kasir Penjualan
              </Link>
            </div>
          </div>

          {/* Sub-cards inside Hero Banner (Matching Reference Translucent Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-xs text-emerald-200 block uppercase font-medium">
                Transaksi Hari Ini
              </span>
              <p className="text-2xl font-bold mt-1 tracking-tight">{todayCount}</p>
              <span className="text-xs text-emerald-300 mt-1 block font-medium">
                Penjualan Kasir
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-xs text-emerald-200 block uppercase font-medium">
                Pasien Baru Hari Ini
              </span>
              <p className="text-2xl font-bold mt-1 tracking-tight">{newPatientsToday}</p>
              <span className="text-xs text-emerald-300 mt-1 block font-medium">
                Terdaftar di Rekam Medis
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-xs text-emerald-200 block uppercase font-medium">
                Pendapatan Hari Ini
              </span>
              <p className="text-xl md:text-2xl font-bold mt-1 truncate tracking-tight">
                {formatRupiah(todayRevenue)}
              </p>
              <span className="text-xs text-emerald-300 mt-1 block font-medium">
                Kas Masuk Hari Ini
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-xs text-emerald-200 block uppercase font-medium">
                Kesehatan Stok Obat
              </span>
              <p className="text-2xl font-bold mt-1 tracking-tight">{stockSafetyRate}%</p>
              <span className="text-xs text-emerald-300 mt-1 block font-medium">
                {lowStockMedicines.length > 0 ? `${lowStockMedicines.length} Perlu Restock` : 'Katalog Stok Aman'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. STAT CARDS ROW (4 Cards with Progress Bars matching Reference UI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pasien */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 uppercase tracking-wide">
                Rekam Medis
              </span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                Aktif
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{totalPatients}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Pasien Terdaftar</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* Card 2: Master Obat */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs px-2.5 py-1 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200 uppercase tracking-wide">
                Farmasi
              </span>
              <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200">
                {totalMedicines} Item
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{totalMedicines}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Produk Obat</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full" style={{ width: `${stockSafetyRate}%` }}></div>
            </div>
          </div>

          {/* Card 3: Total Transaksi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200 uppercase tracking-wide">
                Transaksi
              </span>
              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                Selesai
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{totalSaleCount}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Transaksi Kasir</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>

          {/* Card 4: Total Omzet */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 uppercase tracking-wide">
                Pendapatan
              </span>
              <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                IDR
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight truncate">
              {formatRupiah(totalRevenue)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Omzet Penjualan</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-700 h-full rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
        </div>

        {/* 3. MIDDLE SECTION: 2 COLUMNS (Analisis Performa + Aktivitas Terkini) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Revenue & Operations Analytics (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Analisis Arus Kas & Penjualan Farmasi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ringkasan performa keuangan dan pelayanan obat</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <span className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold shadow-xs">
                  Semua Data
                </span>
                <span className="px-3 py-1 rounded-lg text-slate-600 text-xs font-medium">
                  Tahun Ini
                </span>
              </div>
            </div>

            {/* Horizontal progress indicators */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Total Akumulasi Penjualan Obat</span>
                  <span className="font-bold text-slate-900">{formatRupiah(totalRevenue)}</span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden p-0.5">
                  <div className="bg-emerald-700 h-full rounded-md flex items-center justify-end pr-2 text-[10px] font-bold text-white" style={{ width: '85%' }}>
                    85%
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Tingkat Ketersediaan Stok Farmasi</span>
                  <span className="font-bold text-emerald-700">{stockSafetyRate}% Kategori Aman</span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden p-0.5">
                  <div className="bg-teal-600 h-full rounded-md flex items-center justify-end pr-2 text-[10px] font-bold text-white" style={{ width: `${stockSafetyRate}%` }}>
                    {stockSafetyRate}%
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Penerimaan Kas Masuk Hari Ini</span>
                  <span className="font-bold text-slate-900">{formatRupiah(todayRevenue)}</span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden p-0.5">
                  <div className="bg-emerald-600 h-full rounded-md flex items-center justify-end pr-2 text-[10px] font-bold text-white" style={{ width: todayRevenue > 0 ? '70%' : '5%' }}>
                    {todayRevenue > 0 ? 'Aktif' : '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Metrics Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] text-slate-500 font-medium block">Total Omzet</span>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">{formatRupiah(totalRevenue)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] text-slate-500 font-medium block">Rata-rata/Faktur</span>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">{formatRupiah(avgPerSale)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] text-slate-500 font-medium block">Hari Ini</span>
                <p className="text-sm font-bold text-emerald-700 mt-1 truncate">{formatRupiah(todayRevenue)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] text-slate-500 font-medium block">Faktur Selesai</span>
                <p className="text-sm font-bold text-slate-800 mt-1">{totalSaleCount} Transaksi</p>
              </div>
            </div>
          </div>

          {/* Live Activity (4 Cols, matching reference UI) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Aktivitas Terkini</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Pembaruan transaksi real-time</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Terkini</span>
                </span>
              </div>

              {recentSales.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  Belum ada transaksi tercatat
                </div>
              ) : (
                <div className="space-y-3.5">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="truncate max-w-[130px]">{sale.customerName}</span>
                        <span className="text-emerald-700">{formatRupiah(sale.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1">
                        <span>Faktur: {sale.invoiceNumber}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">{sale.paymentMethod}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Kasir: {sale.cashier.name} • {formatDateTimeIndo(sale.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                href="/transaksi"
                className="block w-full py-2 text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Lihat Semua Riwayat Transaksi &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* 4. QUICK ACTIONS & TOP MEDICINES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Quick Actions (8 Cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Aksi Cepat Petugas</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pintasan menuju modul pelayanan utama klinik</p>
              </div>
              <span className="text-xs text-slate-500 font-medium">4 Modul Aktif</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Link
                href="/kasir"
                className="p-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition group"
              >
                <div className="text-xs font-semibold text-emerald-200 mb-1 uppercase tracking-wide">
                  Kasir Apotek
                </div>
                <h4 className="text-base font-bold">Kasir Penjualan Obat</h4>
                <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                  Keranjang belanja, hitung total & kembalian, cetak struk pembayaran
                </p>
              </Link>

              <Link
                href="/pasien"
                className="p-5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition group"
              >
                <div className="text-xs font-semibold text-teal-200 mb-1 uppercase tracking-wide">
                  Pendaftaran
                </div>
                <h4 className="text-base font-bold">Pendaftaran Pasien Baru</h4>
                <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
                  Input data identitas pasien & pembuatan otomatis No. Rekam Medis
                </p>
              </Link>

              <Link
                href="/obat"
                className="p-5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition group"
              >
                <div className="text-xs font-semibold text-emerald-200 mb-1 uppercase tracking-wide">
                  Master Farmasi
                </div>
                <h4 className="text-base font-bold">Katalog Obat & Stok</h4>
                <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                  Kelola obat, satuan, harga jual, dan penyesuaian stok opname
                </p>
              </Link>

              <Link
                href="/pengaturan"
                className="p-5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition group"
              >
                <div className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Konfigurasi
                </div>
                <h4 className="text-base font-bold">Pengaturan Identitas Klinik</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Ganti nama klinik, alamat, telepon, dan teks footer struk kasir
                </p>
              </Link>
            </div>
          </div>

          {/* Top Medicines (4 Cols, matching Top Sellers in reference UI) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Obat Teratas</h3>
                <p className="text-xs text-slate-500 mt-0.5">Produk formularium unggulan</p>
              </div>
              <Link href="/obat" className="text-xs font-bold text-emerald-700 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-3">
              {topMedicines.map((m, idx) => {
                const rankColors = [
                  'bg-amber-500 text-white',
                  'bg-slate-500 text-white',
                  'bg-amber-700 text-white',
                ];
                return (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${rankColors[idx] || 'bg-slate-400 text-white'}`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {m.category?.name || 'Umum'} • Stok: {m.stock} {m.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-slate-900 block">
                        {formatRupiah(m.sellPrice)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Tersedia</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. PENDING ACTIONS / PERHATIAN SISTEM (Matching reference UI bottom alert cards) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Perhatian & Tindakan Sistem</h3>
              <p className="text-xs text-slate-500 mt-0.5">Item penting yang memerlukan pemeriksaan berkala</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {lowStockMedicines.length > 0 ? `${lowStockMedicines.length} Peringatan Stok` : 'Semua Normal'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alert 1: Stok Obat Menipis */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase">Stok Menipis</span>
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {lowStockMedicines.length}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-800">Peringatan Batas Minimum</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {lowStockMedicines.length > 0
                    ? `${lowStockMedicines.length} jenis obat telah mencapai atau berada di bawah batas minimum.`
                    : 'Semua obat dalam status stok aman di atas batas minimum.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200/60">
                <Link
                  href="/obat"
                  className="block w-full py-2 text-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                >
                  Periksa & Restock Obat
                </Link>
              </div>
            </div>

            {/* Alert 2: Pasien Terdaftar Baru */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Pasien Hari Ini</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {newPatientsToday}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-800">Kunjungan Pasien Baru</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {newPatientsToday > 0
                    ? `${newPatientsToday} pasien baru terdaftar dengan nomor rekam medis otomatis hari ini.`
                    : 'Belum ada pendaftaran pasien baru untuk hari ini.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200/60">
                <Link
                  href="/pasien"
                  className="block w-full py-2 text-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                >
                  Buka Pendaftaran Pasien
                </Link>
              </div>
            </div>

            {/* Alert 3: Database & Backup */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Volume Database</span>
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center">
                    OK
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-800">Penyimpanan Docker PostgreSQL</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Database berjalan normal dan data disimpan persisten di Docker volume.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <Link
                  href="/pengaturan"
                  className="block w-full py-2 text-center rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold transition"
                >
                  Kelola Pengaturan Sistem
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
