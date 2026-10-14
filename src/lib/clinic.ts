import prisma from '@/lib/prisma';

export interface ClinicConfig {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  receiptFooter: string;
}

const DEFAULT_SETTINGS: ClinicConfig = {
  name: process.env.NEXT_PUBLIC_CLINIC_NAME || process.env.CLINIC_NAME || 'Dolphin e-Clinic',
  tagline: process.env.NEXT_PUBLIC_CLINIC_TAGLINE || 'Sistem Informasi Manajemen Klinik Terpadu',
  address: 'Jl. Kesehatan Raya No. 12, Jakarta',
  phone: '021-555-1234',
  email: 'kontak@dolphineclinic.id',
  receiptFooter: 'Semoga Lekas Sembuh & Terima Kasih Atas Kunjungan Anda',
};

export async function getClinicSettings(): Promise<ClinicConfig> {
  try {
    const setting = await prisma.clinicSetting.findUnique({
      where: { id: 'clinic-settings' },
    });

    if (setting) {
      return {
        name: setting.name || DEFAULT_SETTINGS.name,
        tagline: setting.tagline || DEFAULT_SETTINGS.tagline,
        address: setting.address || DEFAULT_SETTINGS.address,
        phone: setting.phone || DEFAULT_SETTINGS.phone,
        email: setting.email || DEFAULT_SETTINGS.email,
        receiptFooter: setting.receiptFooter || DEFAULT_SETTINGS.receiptFooter,
      };
    }
  } catch (error) {
    console.error('Gagal mengambil pengaturan klinik dari database:', error);
  }

  return DEFAULT_SETTINGS;
}

export async function updateClinicSettings(data: Partial<ClinicConfig>): Promise<ClinicConfig> {
  const current = await getClinicSettings();
  const updated = await prisma.clinicSetting.upsert({
    where: { id: 'clinic-settings' },
    update: {
      name: data.name ?? current.name,
      tagline: data.tagline ?? current.tagline,
      address: data.address ?? current.address,
      phone: data.phone ?? current.phone,
      email: data.email ?? current.email,
      receiptFooter: data.receiptFooter ?? current.receiptFooter,
    },
    create: {
      id: 'clinic-settings',
      name: data.name ?? DEFAULT_SETTINGS.name,
      tagline: data.tagline ?? DEFAULT_SETTINGS.tagline,
      address: data.address ?? DEFAULT_SETTINGS.address,
      phone: data.phone ?? DEFAULT_SETTINGS.phone,
      email: data.email ?? DEFAULT_SETTINGS.email,
      receiptFooter: data.receiptFooter ?? DEFAULT_SETTINGS.receiptFooter,
    },
  });

  return {
    name: updated.name,
    tagline: updated.tagline,
    address: updated.address,
    phone: updated.phone,
    email: updated.email,
    receiptFooter: updated.receiptFooter,
  };
}

