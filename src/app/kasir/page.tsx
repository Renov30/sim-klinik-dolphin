'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { formatRupiah, formatDateTimeIndo } from '@/lib/format';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  RotateCcw,
  Receipt,
  User,
  DollarSign,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  QrCode,
} from 'lucide-react';

interface Medicine {
  id: string;
  code: string;
  name: string;
  unit: string;
  sellPrice: number;
  stock: number;
  minStock: number;
  category?: { name: string };
}

interface Patient {
  id: string;
  mrNumber: string;
  name: string;
  allergy: string | null;
  phone: string | null;
}

interface CartItem {
  medicineId: string;
  code: string;
  name: string;
  unit: string;
  sellPrice: number;
  quantity: number;
  maxStock: number;
}

interface SaleSuccessData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  payAmount: number;
  changeAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    medicineName: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  cashier: { name: string };
  clinic: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    receiptFooter: string;
  };
}

function KasirContent() {
  const searchParams = useSearchParams();
  const initPatientId = searchParams.get('patientId');
  const initPatientName = searchParams.get('patientName');

  const [clinicName, setClinicName] = useState('Dolphin e-Clinic');
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Medicines Catalog
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchMed, setSearchMed] = useState('');
  const [loadingMed, setLoadingMed] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer / Patient Selection
  const [isRegisteredPatient, setIsRegisteredPatient] = useState(false);
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [customerName, setCustomerName] = useState('Pasien Umum');
  const [searchPatient, setSearchPatient] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Payment State
  const [discount, setDiscount] = useState<number>(0);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER' | 'QRIS'>('TUNAI');
  const [notes, setNotes] = useState('');

  // Processing & Receipt Modal
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [receiptData, setReceiptData] = useState<SaleSuccessData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const loadMedicines = useCallback(async (query: string = '') => {
    try {
      setLoadingMed(true);
      const res = await fetch(`/api/medicines?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMed(false);
    }
  }, []);

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPatientList([]);
      return;
    }
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setPatientList(data.data);
      }
    } catch (e) {
      console.error(e);
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
    loadMedicines();

    if (initPatientId && initPatientName) {
      setIsRegisteredPatient(true);
      setCustomerName(decodeURIComponent(initPatientName));
      fetch(`/api/patients/${initPatientId}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.data) {
            setSelectedPatient(d.data);
          }
        });
    }
  }, [initPatientId, initPatientName, loadMedicines]);

  // Cart operations
  const addToCart = (med: Medicine) => {
    setErrorMessage('');
    if (med.stock <= 0) {
      setErrorMessage(`Stok obat '${med.name}' habis! Tidak dapat menambahkan ke keranjang.`);
      return;
    }

    const existingIndex = cart.findIndex((i) => i.medicineId === med.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > med.stock) {
        setErrorMessage(`Maksimal stok tersedia untuk '${med.name}' hanya ${med.stock} ${med.unit}.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          medicineId: med.id,
          code: med.code,
          name: med.name,
          unit: med.unit,
          sellPrice: med.sellPrice,
          quantity: 1,
          maxStock: med.stock,
        },
      ]);
    }
  };

  const updateQuantity = (medicineId: string, qty: number) => {
    setErrorMessage('');
    const target = cart.find((i) => i.medicineId === medicineId);
    if (!target) return;

    if (qty <= 0) {
      removeFromCart(medicineId);
      return;
    }

    if (qty > target.maxStock) {
      setErrorMessage(`Stok maksimal '${target.name}' hanya ${target.maxStock} ${target.unit}.`);
      return;
    }

    setCart(cart.map((i) => (i.medicineId === medicineId ? { ...i, quantity: qty } : i)));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter((i) => i.medicineId !== medicineId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPayAmount(0);
    setNotes('');
    setErrorMessage('');
  };

  // Perhitungan Keuangan
  const subtotal = cart.reduce((acc, i) => acc + i.sellPrice * i.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const changeAmount = Math.max(0, payAmount - totalAmount);

  // Quick Preset Bayar
  const handlePresetPay = (preset: number | 'PAS') => {
    if (preset === 'PAS') {
      setPayAmount(totalAmount);
    } else {
      setPayAmount(preset);
    }
  };

  // Pilih Pasien Terdaftar
  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setCustomerName(`${p.name} (${p.mrNumber})`);
    setShowPatientDropdown(false);
  };

  // Submit Transaksi
  const handleCheckout = async () => {
    setErrorMessage('');
    if (cart.length === 0) {
      setErrorMessage('Keranjang belanja masih kosong.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Nama pelanggan / pasien wajib diisi.');
      return;
    }

    if (paymentMethod === 'TUNAI' && payAmount < totalAmount) {
      setErrorMessage(
        `Pembayaran tunai kurang! Total tagihan: ${formatRupiah(totalAmount)}, dimasukkan: ${formatRupiah(payAmount)}.`
      );
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        patientId: isRegisteredPatient && selectedPatient ? selectedPatient.id : null,
        customerName: customerName.trim(),
        discount: Number(discount) || 0,
        payAmount: paymentMethod === 'TUNAI' ? Number(payAmount) : totalAmount,
        paymentMethod,
        notes: notes.trim(),
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Gagal memproses transaksi');
        setProcessing(false);
        return;
      }

      // Berhasil
      setReceiptData(data.data);
      setShowReceiptModal(true);
      clearCart();
      loadMedicines(); // Muat ulang stok terkini
    } catch {
      setErrorMessage('Terjadi gangguan jaringan saat memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f4f9] font-sans text-slate-800 antialiased">
      <Sidebar clinicName={clinicName} userRole={userRole} userName={userName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <TopNavbar
          clinicName={clinicName}
          userName={userName}
          userRole={userRole}
          title="Kasir Penjualan Obat"
          subtitle="Point of Sales Farmasi - Pengurangan stok instan dan cetak struk pembayaran"
        />

        <main className="flex-1 px-8 pb-8 pt-0 space-y-6">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-bold">Peringatan:</span>
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-xs text-rose-600 hover:text-rose-900 font-bold p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: KATALOG OBAT (7 COLS) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex-1 relative">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Cari Obat untuk Ditambahkan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchMed}
                        onChange={(e) => {
                          setSearchMed(e.target.value);
                          loadMedicines(e.target.value);
                        }}
                        placeholder="Ketik nama obat atau kode (contoh: Paracetamol, OBT-001)..."
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm bg-slate-50 focus:bg-white transition"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSearchMed('');
                      loadMedicines('');
                    }}
                    className="mt-5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Daftar Obat Siap Jual</span>
                  <span>Klik tombol <strong>+ Keranjang</strong> untuk memilih</span>
                </div>
              </div>

              {/* Medicine Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {loadingMed ? (
                  <div className="col-span-2 p-12 text-center text-slate-400 text-sm">
                    Memuat katalog obat...
                  </div>
                ) : medicines.length === 0 ? (
                  <div className="col-span-2 p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100 shadow-xs">
                    Tidak ada obat yang cocok dengan pencarian
                  </div>
                ) : (
                  medicines.map((m) => {
                    const isOutOfStock = m.stock <= 0;
                    const inCart = cart.find((i) => i.medicineId === m.id);
                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                          isOutOfStock
                            ? 'bg-slate-100/70 border-slate-200 opacity-60'
                            : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {m.code}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : m.stock <= m.minStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              Stok: {m.stock} {m.unit}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm">{m.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {m.category?.name || 'Umum'} • Satuan: {m.unit}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {formatRupiah(m.sellPrice)}
                          </span>
                          <button
                            disabled={isOutOfStock}
                            onClick={() => addToCart(m)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : inCart
                                ? 'bg-blue-700 text-white shadow-xs'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>{inCart ? `(${inCart.quantity})` : 'Keranjang'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: KERANJANG & CHECKOUT POS (5 COLS) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
              {/* Header Keranjang */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Keranjang Belanja</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cart.length} Jenis Item Terpilih
                  </p>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Data Pelanggan / Pasien */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase">
                    Data Pasien / Pembeli
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRegisteredPatient}
                        onChange={(e) => {
                          setIsRegisteredPatient(e.target.checked);
                          if (!e.target.checked) {
                            setSelectedPatient(null);
                            setCustomerName('Pasien Umum');
                          }
                        }}
                        className="rounded text-emerald-700 focus:ring-emerald-500"
                      />
                      <span>Pasien Terdaftar RM</span>
                    </label>
                  </div>
                </div>

                {isRegisteredPatient ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={searchPatient}
                      onChange={(e) => {
                        setSearchPatient(e.target.value);
                        searchPatients(e.target.value);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Cari No. RM atau nama pasien..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />

                    {showPatientDropdown && patientList.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {patientList.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectPatient(p)}
                            className="p-2.5 text-xs hover:bg-emerald-50 cursor-pointer"
                          >
                            <p className="font-bold text-slate-800">
                              {p.name} <span className="text-emerald-800 font-semibold">({p.mrNumber})</span>
                            </p>
                            {p.allergy && (
                              <p className="text-xs text-rose-600 mt-0.5">
                                Alergi: {p.allergy}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedPatient && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950">{selectedPatient.name}</span>
                          <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded font-semibold">
                            {selectedPatient.mrNumber}
                          </span>
                        </div>
                        {selectedPatient.allergy && (
                          <div className="mt-1 p-1.5 rounded bg-rose-100 border border-rose-300 text-xs text-rose-800 font-semibold">
                            Peringatan Alergi: {selectedPatient.allergy}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama Pasien / Pembeli Bebas"
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Daftar Item Cart */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Keranjang masih kosong. Pilih obat dari katalog di sebelah kiri.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.medicineId}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-emerald-800 font-semibold">
                            {item.code}
                          </span>
                          <h5 className="font-bold text-slate-800 text-xs truncate">
                            {item.name}
                          </h5>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatRupiah(item.sellPrice)} / {item.unit}
                        </p>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.medicineId, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-12 h-7 text-center rounded-lg border border-slate-300 font-semibold text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-16">
                        <p className="font-bold text-slate-900 text-xs">
                          {formatRupiah(item.sellPrice * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.medicineId)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rincian Total & Pembayaran */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Diskon Potongan (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2 py-1 text-right rounded-lg border border-slate-300 font-semibold text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                  <span className="font-bold text-sm uppercase">Total Tagihan:</span>
                  <span className="font-black text-2xl text-blue-600">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>

                {/* Metode Bayar */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['TUNAI', 'TRANSFER', 'QRIS'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          if (method !== 'TUNAI') setPayAmount(totalAmount);
                        }}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition border cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nominal Bayar (Khusus Tunai) */}
                {paymentMethod === 'TUNAI' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">
                        Uang Diterima (Rp)
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePresetPay('PAS')}
                        className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Uang Pas
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={payAmount || ''}
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Masukkan nominal bayar..."
                      className="w-full px-3.5 py-2 text-base font-bold rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />

                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[20000, 50000, 100000, 200000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handlePresetPay(preset)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          {preset / 1000}k
                        </button>
                      ))}
                    </div>

                    {/* Kembalian */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <span>Kembalian:</span>
                      <strong className="text-sm font-bold text-emerald-700">
                        {formatRupiah(changeAmount)}
                      </strong>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Catatan Kasir
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Pembelian obat bebas tanpa resep"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Checkout Button */}
              <button
                type="button"
                disabled={processing || cart.length === 0}
                onClick={handleCheckout}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{processing ? 'Memproses Transaksi...' : 'Proses Pembayaran & Cetak Struk'}</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL CETAK STRUK THERMAL / RECEIPT */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Struk Pembayaran Kasir
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            {/* AREA CETAK STRUK / PRINTABLE AREA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 printable-area">
              {/* Header Struk */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-base font-bold tracking-tight">{receiptData.clinic.name}</h2>
                <p className="text-xs text-slate-600">{receiptData.clinic.address}</p>
                <p className="text-xs text-slate-600">Telp: {receiptData.clinic.phone}</p>
              </div>

              {/* Info Faktur */}
              <div className="py-2.5 border-b border-dashed border-slate-300 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">No. Faktur:</span>
                  <span className="font-semibold">{receiptData.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Waktu:</span>
                  <span>{formatDateTimeIndo(receiptData.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Kasir:</span>
                  <span>{receiptData.cashier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pasien / Pelanggan:</span>
                  <span className="font-semibold">{receiptData.customerName}</span>
                </div>
              </div>

              {/* Rincian Item Obat */}
              <div className="py-2.5 border-b border-dashed border-slate-300">
                <div className="grid grid-cols-12 font-semibold text-[11px] pb-1 border-b border-slate-200 uppercase text-slate-600">
                  <span className="col-span-6">Nama Obat</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Subtotal</span>
                </div>

                <div className="divide-y divide-slate-100 pt-1 text-xs">
                  {receiptData.items.map((item, idx) => (
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

              {/* Total & Kembalian */}
              <div className="py-2.5 border-b border-dashed border-slate-300 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span>{formatRupiah(receiptData.subtotal)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(receiptData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span className="text-emerald-800">{formatRupiah(receiptData.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bayar ({receiptData.paymentMethod}):</span>
                  <span>{formatRupiah(receiptData.payAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(receiptData.changeAmount)}</span>
                </div>
              </div>

              {/* Footer Catatan Struk */}
              <div className="pt-3 text-center text-xs text-slate-500 leading-tight">
                <p>{receiptData.clinic.receiptFooter}</p>
                <p className="mt-1 text-[11px] text-slate-400">SIM KLINIK DOLPHIN E-CLINIC</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Selesai & Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KasirPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Memuat Kasir...</div>}>
      <KasirContent />
    </Suspense>
  );
}

