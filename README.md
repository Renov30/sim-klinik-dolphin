# Dolphin e-Clinic 🐬
**Sistem Informasi Manajemen Klinik & Apotek Terpadu (SIM Klinik)**

Aplikasi web modern untuk manajemen operasional klinik, pendaftaran pasien dengan Nomor Rekam Medis (No. RM) otomatis unik, master formularium obat, kasir penjualan obat (Point of Sales) dengan cetak struk kasir termal, serta kontrol stok otomatis yang mencegah saldo minus secara transaksional.

Dibangun dengan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL**, dan **Docker Compose**. Didesain dengan estetika **Vibe Coded** (tipografi bersih, tag kode, indikator status, tanpa icon SVG atau logo gambar).

---

## 🌟 Fitur Utama

1. **Pendaftaran Pasien:**
   - Input data pasien lengkap (Nama, NIK KTP, Tanggal Lahir, Jenis Kelamin, No. WhatsApp, Golongan Darah, Alergi Obat/Makanan, Alamat).
   - **Nomor Rekam Medis Otomatis & Unik** dengan format sequential (contoh: `RM-2610-0001`).
   - Pencarian instan berdasarkan No. RM, NIK, nama, atau nomor telepon.
   - Kartu detail pasien & riwayat pembelian obat.

2. **Master Obat & Inventaris:**
   - Kelola data obat, kategori terapi, satuan kemasan (Strip, Botol, Tablet, Tube, dll), harga beli/HPP, dan harga jual kasir.
   - Filter obat stok kritis/menipis di bawah batas minimum (`minStock`).
   - Penyesuaian stok masuk (Restock Supplier), stok keluar, dan audit fisik kartu stok.

3. **Kasir Penjualan Obat (POS):**
   - Keranjang belanja interaktif dengan validasi ketersediaan stok fisik real-time.
   - Dukungan pasien terdaftar (dengan peringatan alergi obat) atau pembeli umum bebas (walk-in).
   - Perhitungan otomatis Subtotal, Diskon, Total Bayar, dan Kembalian.
   - Metode bayar: Tunai (dengan preset nominal cepat), Transfer Bank, dan QRIS.
   - **Cetak Struk Pembayaran Termal:** Desain struk kasir resmi siap cetak (58mm/80mm thermal receipt) menggunakan dialog print bawaan browser.

4. **Stok Otomatis & Konsistensi Transaksi:**
   - Stok obat terpotong secara otomatis begitu transaksi kasir selesai.
   - Proteksi ketat anti-minus: transaksi ditolak jika kuantitas melebihi stok yang tersedia.
   - Terintegrasi dalam Prisma Database Transaction (`$transaction`) untuk menjamin konsistensi data.

5. **Login & Kontrol Hak Akses (RBAC):**
   - **Administrator (`admin`)**: Akses penuh ke seluruh fitur, master data, dan pengaturan klinik.
   - **Petugas Pendaftaran (`pendaftaran`)**: Akses khusus registrasi & data rekam medis pasien.
   - **Kasir Farmasi (`kasir`)**: Akses kasir penjualan POS, lookup stok obat, dan riwayat transaksi.

6. **Dashboard Operasional:**
   - Banner sambutan dinamis dengan metrik harian (Transaksi Hari Ini, Pasien Baru, Omzet Kasir, Indeks Kesehatan Stok).
   - Kartu ringkasan kumulatif, pintasan aksi cepat (*Quick Actions*), dan daftar peringatan stok obat kritis.

7. **Kustomisasi Nama Klinik Tanpa Ubah Source Code:**
   - Nama klinik, tagline, alamat, nomor telepon, dan teks kaki struk dapat diubah kapan saja melalui halaman **Pengaturan Klinik** di UI atau melalui file `.env`.

---

## 🔑 Akun Bawaan (Default Credentials)

Saat database diinisialisasi pertama kali, akun-akun berikut dibuat secara otomatis:

| Peran (Role) | Username | Password | Wewenang Akses |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Semua modul & Pengaturan Sistem |
| **Petugas Pendaftaran** | `pendaftaran` | `daftar123` | Registrasi & Data Pasien |
| **Kasir Farmasi** | `kasir` | `kasir123` | Kasir Penjualan Obat & Riwayat |

> *Tersedia tombol pintas 1-klik di halaman login untuk mempermudah pengujian.*

---

## 🚀 Panduan Instalasi & Menjalankan (Docker Compose)

### Prasyarat
- [Docker Desktop](https://www.docker.com/) atau Docker Engine + Docker Compose sudah terinstal dan aktif.

### 1. Salin Konfigurasi Lingkungan
Pastikan file `.env` sudah tersedia dari template `.env.example`:
```bash
cp .env.example .env
```

### 2. Jalankan Aplikasi dengan Docker Compose
Cukup jalankan satu perintah berikut di direktori proyek:
```bash
docker compose up -d
```

Perintah di atas akan secara otomatis:
1. Menjalankan container PostgreSQL (`dolphin_clinic_db`) dengan Docker volume `dolphin_clinic_pgdata` agar data tersimpan permanen.
2. Membangun dan menjalankan image Next.js (`dolphin_clinic_app`).
3. Menerapkan skema database PostgreSQL dan menjalankan *database seeding* awal.

### 3. Buka Aplikasi di Browser
Buka browser dan akses:
```
http://localhost:3002
```
*(Atau `http://localhost:3001` jika menjalankan via `npm run dev` secara langsung di host).*

---

## 🌐 Mengakses Aplikasi Melalui Jaringan Lokal (LAN / WiFi)

Aplikasi telah dikonfigurasi untuk mendengarkan antarmuka `0.0.0.0`, sehingga dapat diakses oleh komputer kasir, tablet dokter, atau komputer pendaftaran lain dalam satu jaringan WiFi/LAN yang sama:

1. Periksa alamat IP lokal komputer server:
   - **Mac/Linux:** `ipconfig getifaddr en0` atau `hostname -I`
   - **Windows:** `ipconfig` (lihat IPv4 Address)
   - *Contoh IP:* `192.168.1.11`

2. Buka browser pada komputer lain di jaringan yang sama dan akses:
   ```
   http://192.168.1.11:3002
   ```

---

## ⚙️ Mengganti Nama Klinik / Instansi

Anda dapat mengganti nama klinik sewaktu-waktu melalui 2 cara:

### Cara 1: Melalui Halaman Pengaturan (Rekomendasi)
1. Masuk sebagai **Administrator** (`admin` / `admin123`).
2. Masuk ke menu **Pengaturan Klinik**.
3. Ubah **Nama Klinik**, **Tagline**, **Alamat**, **No. Telepon**, atau **Pesan Struk**.
4. Klik **[Simpan Pengaturan Klinik]**. Perubahan langsung tersimpan di PostgreSQL dan tampil seketika di seluruh halaman web dan cetak struk tanpa perlu *restart* aplikasi.

### Cara 2: Melalui File `.env`
Buka file `.env` dan sesuaikan variabel:
```env
NEXT_PUBLIC_CLINIC_NAME="Klinik Pratama Sehat Mandiri"
NEXT_PUBLIC_CLINIC_TAGLINE="Melayani Kesehatan Anda Sepenuh Hati"
```

---

## 💾 Backup dan Restore Database

### Melakukan Backup Database:
Jalankan script backup bawaan:
```bash
./scripts/backup-db.sh
```
File backup terkompresi akan disimpan di folder `./backups/backup_dolphin_clinic_YYYYMMDD_HHMMSS.sql.gz`.

### Memulihkan Database (Restore):
Jalankan script restore dengan menyertakan nama file backup:
```bash
./scripts/restore-db.sh ./backups/backup_dolphin_clinic_20261014_232340.sql.gz
```

---

## 🛠 Perintah Pengembangan Lokal (Non-Docker)

Jika ingin menjalankan aplikasi secara langsung di mesin host tanpa container Node:
```bash
# 1. Pastikan PostgreSQL lokal atau container postgres aktif
docker compose up -d postgres

# 2. Sinkronisasi skema database & seed
npm run db:push
npm run db:seed

# 3. Jalankan server development
npm run dev

# 4. Membuka Prisma Studio (GUI Database)
npm run db:studio
```

---

## 📁 Struktur Direktori Utama

```
├── docker-compose.yml       # Definisi service PostgreSQL dan Web Next.js
├── Dockerfile               # Multi-stage production build Next.js
├── docker-entrypoint.sh     # Auto migration & auto seed saat container start
├── prisma/
│   ├── schema.prisma        # Definisi model database (User, Patient, Medicine, Sale, dll)
│   ├── seed.ts              # Data awal klinik, akun default, kategori, obat, & pasien
│   └── migrations/          # Riwayat migrasi database SQL
├── scripts/
│   ├── backup-db.sh         # Script otomatisasi backup PostgreSQL
│   └── restore-db.sh        # Script pemulihan database dari file sql.gz
├── src/
│   ├── app/
│   │   ├── api/             # API routes (Auth, Patients, Medicines, Sales, Settings)
│   │   ├── dashboard/       # Halaman dashboard metrik utama
│   │   ├── pasien/          # Halaman pendaftaran & data rekam medis pasien
│   │   ├── obat/            # Halaman master formularium obat & stok
│   │   ├── kasir/           # Halaman POS kasir, keranjang, & cetak struk termal
│   │   ├── transaksi/       # Halaman riwayat transaksi penjualan & re-print
│   │   ├── pengaturan/      # Halaman ganti nama klinik & profil instansi
│   │   └── login/           # Halaman otentikasi petugas
│   ├── components/
│   │   ├── Sidebar.tsx      # Sidebar biru berorientasi vibe-coded (sesuai referensi UI)
│   │   ├── TopNavbar.tsx    # Header atas dengan info tanggal & status LAN
│   │   └── DashboardLayout.tsx
│   └── lib/
│       ├── prisma.ts        # Prisma client singleton
│       ├── auth.ts          # Utilitas session JWT & hashing password
│       ├── clinic.ts        # Pengambilan & penyimpanan pengaturan dinamis klinik
│       └── format.ts        # Generator No. RM unik, nomor faktur, & format Rupiah
└── .env.example             # Contoh konfigurasi environment
```

---

*Dolphin e-Clinic - Solusi Digital Sistem Informasi Manajemen Klinik Terpadu.*
