import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0e0f10] text-neutral-100 p-4 sm:p-8 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
