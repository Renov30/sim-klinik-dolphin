import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { getClinicSettings } from '@/lib/clinic';
import { getSession } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default async function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const settings = await getClinicSettings();
  const session = await getSession();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Vibe Coded Deep Blue Sidebar */}
      <Sidebar
        clinicName={settings.name}
        userRole={session?.role}
        userName={session?.name}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          clinicName={settings.name}
          userName={session?.name}
          userRole={session?.role}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

