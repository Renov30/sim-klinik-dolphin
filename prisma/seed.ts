import { PrismaClient, Role, Gender, MovementType, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Mulai Seeding Database Dolphin e-Clinic ---');

  // 1. Inisialisasi Pengaturan Klinik
  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || process.env.CLINIC_NAME || 'Dolphin e-Clinic';
  await prisma.clinicSetting.upsert({
    where: { id: 'clinic-settings' },
    update: {
      name: clinicName,
    },
    create: {
      id: 'clinic-settings',
      name: clinicName,
      tagline: 'Sistem Informasi Manajemen Klinik Terpadu',
      address: 'Jl. Kesehatan Raya No. 12, Jakarta',
      phone: '021-555-1234',
      email: 'kontak@dolphineclinic.id',
      receiptFooter: 'Semoga Lekas Sembuh & Terima Kasih Atas Kunjungan Anda',
    },
  });
  console.log(`Pengaturan klinik berhasil diinisialisasi: ${clinicName}`);

  // 2. Buat Pengguna Default (Admin, Pendaftaran, Kasir)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const pendaftaranPassword = await bcrypt.hash('daftar123', salt);
  const kasirPassword = await bcrypt.hash('kasir123', salt);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword, role: Role.ADMIN, isActive: true },
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Administrator Klinik',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const pendaftaran = await prisma.user.upsert({
    where: { username: 'pendaftaran' },
    update: { password: pendaftaranPassword, role: Role.PENDAFTARAN, isActive: true },
    create: {
      username: 'pendaftaran',
      password: pendaftaranPassword,
      name: 'Staf Pendaftaran',
      role: Role.PENDAFTARAN,
      isActive: true,
    },
  });

  const kasir = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: { password: kasirPassword, role: Role.KASIR, isActive: true },
    create: {
      username: 'kasir',
      password: kasirPassword,
      name: 'Kasir Farmasi',
      role: Role.KASIR,
      isActive: true,
    },
  });
  console.log('User default berhasil dibuat (admin, pendaftaran, kasir).');

  // 3. Kategori Obat
  const categoriesData = [
    { name: 'Analgesik & Antipiretik', description: 'Pereda nyeri dan penurun demam' },
    { name: 'Antibiotik', description: 'Anti infeksi bakteri' },
    { name: 'Antihistamin & Alergi', description: 'Pereda alergi dan gatal' },
    { name: 'Vitamin & Suplemen', description: 'Peningkat daya tahan tubuh' },
    { name: 'Obat Batuk & Flu', description: 'Pereda batuk, pilek, dan flu' },
    { name: 'Salep & Obat Luar', description: 'Pengobatan topikal kulit' },
    { name: 'Antasida & Pencernaan', description: 'Penurun asam lambung dan maag' },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
    categoryMap.set(cat.name, created.id);
  }
  console.log(`${categoryMap.size} Kategori obat berhasil dibuat.`);

  // 4. Data Obat Awal
  const medicinesData = [
    {
      code: 'OBT-001',
      name: 'Paracetamol 500mg',
      categoryName: 'Analgesik & Antipiretik',
      unit: 'Strip',
      buyPrice: 6000,
      sellPrice: 10000,
      stock: 120,
      minStock: 15,
      location: 'Rak A-01',
    },
    {
      code: 'OBT-002',
      name: 'Amoxicillin 500mg',
      categoryName: 'Antibiotik',
      unit: 'Strip',
      buyPrice: 10000,
      sellPrice: 16000,
      stock: 75,
      minStock: 10,
      location: 'Rak B-01',
    },
    {
      code: 'OBT-003',
      name: 'Cetirizine 10mg',
      categoryName: 'Antihistamin & Alergi',
      unit: 'Strip',
      buyPrice: 7000,
      sellPrice: 12000,
      stock: 60,
      minStock: 10,
      location: 'Rak A-03',
    },
    {
      code: 'OBT-004',
      name: 'Vitamin C 500mg IPI',
      categoryName: 'Vitamin & Suplemen',
      unit: 'Botol',
      buyPrice: 8000,
      sellPrice: 14000,
      stock: 90,
      minStock: 12,
      location: 'Rak C-02',
    },
    {
      code: 'OBT-005',
      name: 'OBH Combi Batuk & Flu 100ml',
      categoryName: 'Obat Batuk & Flu',
      unit: 'Botol',
      buyPrice: 18000,
      sellPrice: 26000,
      stock: 35,
      minStock: 8,
      location: 'Rak D-01',
    },
    {
      code: 'OBT-006',
      name: 'Antasida DOEN Kunyah',
      categoryName: 'Antasida & Pencernaan',
      unit: 'Strip',
      buyPrice: 4000,
      sellPrice: 8000,
      stock: 85,
      minStock: 15,
      location: 'Rak A-02',
    },
    {
      code: 'OBT-007',
      name: 'Betadine Salep Antiseptik 10g',
      categoryName: 'Salep & Obat Luar',
      unit: 'Tube',
      buyPrice: 13000,
      sellPrice: 20000,
      stock: 40,
      minStock: 5,
      location: 'Rak E-01',
    },
    {
      code: 'OBT-008',
      name: 'Ibuprofen 400mg',
      categoryName: 'Analgesik & Antipiretik',
      unit: 'Strip',
      buyPrice: 7500,
      sellPrice: 13000,
      stock: 50,
      minStock: 10,
      location: 'Rak A-04',
    },
    {
      code: 'OBT-009',
      name: 'Dexamethasone 0.5mg',
      categoryName: 'Antihistamin & Alergi',
      unit: 'Strip',
      buyPrice: 3500,
      sellPrice: 7000,
      stock: 4, // Di bawah minStock (kritis) untuk demo alert
      minStock: 10,
      location: 'Rak B-02',
    },
  ];

  for (const med of medicinesData) {
    const categoryId = categoryMap.get(med.categoryName);
    if (!categoryId) continue;

    const existing = await prisma.medicine.findUnique({ where: { code: med.code } });
    if (!existing) {
      const createdMed = await prisma.medicine.create({
        data: {
          code: med.code,
          name: med.name,
          categoryId: categoryId,
          unit: med.unit,
          buyPrice: med.buyPrice,
          sellPrice: med.sellPrice,
          stock: med.stock,
          minStock: med.minStock,
          location: med.location,
        },
      });

      // Catat saldo awal di riwayat pergerakan stok
      await prisma.stockMovement.create({
        data: {
          medicineId: createdMed.id,
          type: MovementType.IN,
          quantity: med.stock,
          balanceBefore: 0,
          balanceAfter: med.stock,
          referenceNo: 'INIT-STOCK',
          notes: 'Stok awal sistem',
          createdById: admin.id,
        },
      });
    }
  }
  console.log('Master obat awal berhasil dibuat.');

  // 5. Data Pasien Awal
  const patientsData = [
    {
      mrNumber: 'RM-2610-0001',
      nik: '3171012304900001',
      name: 'Budi Santoso',
      gender: Gender.L,
      birthDate: new Date('1990-04-23'),
      phone: '081234567890',
      address: 'Jl. Melati Indah No. 4, RT 02/05, Kebayoran Baru, Jakarta Selatan',
      bloodType: 'O',
      allergy: 'Tidak ada alergi',
    },
    {
      mrNumber: 'RM-2610-0002',
      nik: '3171025508880002',
      name: 'Siti Aminah',
      gender: Gender.P,
      birthDate: new Date('1988-08-15'),
      phone: '081987654321',
      address: 'Jl. Mawar Asri No. 12, Cilandak, Jakarta Selatan',
      bloodType: 'A',
      allergy: 'Alergi Penisilin (Amoxicillin)',
    },
    {
      mrNumber: 'RM-2610-0003',
      nik: '3201031002950003',
      name: 'Ahmad Fauzi',
      gender: Gender.L,
      birthDate: new Date('1995-02-10'),
      phone: '085712345678',
      address: 'Jl. Anggrek No. 8, Pancoran, Jakarta Selatan',
      bloodType: 'B',
      allergy: 'Tidak ada alergi',
    },
    {
      mrNumber: 'RM-2610-0004',
      nik: '3201046811920004',
      name: 'Dewi Lestari',
      gender: Gender.P,
      birthDate: new Date('1992-11-28'),
      phone: '082133445566',
      address: 'Jl. Kenanga Lestari No. 15, Tebet, Jakarta Selatan',
      bloodType: 'AB',
      allergy: 'Alergi Seafood',
    },
  ];

  for (const patient of patientsData) {
    await prisma.patient.upsert({
      where: { mrNumber: patient.mrNumber },
      update: patient,
      create: patient,
    });
  }
  console.log('Data pasien awal berhasil dibuat.');

  // 6. Buat 1 Transaksi Contoh Kasir
  const firstPatient = await prisma.patient.findFirst({ where: { mrNumber: 'RM-2610-0001' } });
  const sampleMed1 = await prisma.medicine.findUnique({ where: { code: 'OBT-001' } });
  const sampleMed2 = await prisma.medicine.findUnique({ where: { code: 'OBT-004' } });

  const existingSale = await prisma.sale.findUnique({ where: { invoiceNumber: 'INV-20261014-0001' } });
  if (!existingSale && firstPatient && sampleMed1 && sampleMed2) {
    const qty1 = 2;
    const qty2 = 1;
    const subtotal1 = sampleMed1.sellPrice * qty1;
    const subtotal2 = sampleMed2.sellPrice * qty2;
    const totalAmount = subtotal1 + subtotal2;
    const payAmount = 50000;
    const changeAmount = payAmount - totalAmount;

    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: 'INV-20261014-0001',
        patientId: firstPatient.id,
        customerName: firstPatient.name,
        subtotal: totalAmount,
        discount: 0,
        totalAmount: totalAmount,
        payAmount: payAmount,
        changeAmount: changeAmount,
        paymentMethod: PaymentMethod.TUNAI,
        notes: 'Penjualan obat flu & vitamin',
        cashierId: kasir.id,
        items: {
          create: [
            {
              medicineId: sampleMed1.id,
              medicineName: sampleMed1.name,
              unit: sampleMed1.unit,
              unitPrice: sampleMed1.sellPrice,
              quantity: qty1,
              subtotal: subtotal1,
            },
            {
              medicineId: sampleMed2.id,
              medicineName: sampleMed2.name,
              unit: sampleMed2.unit,
              unitPrice: sampleMed2.sellPrice,
              quantity: qty2,
              subtotal: subtotal2,
            },
          ],
        },
      },
    });

    console.log(`Transaksi demo kasir dibuat: ${sale.invoiceNumber}`);
  }

  console.log('--- Seeding Selesai! Aplikasi Siap Digunakan ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

