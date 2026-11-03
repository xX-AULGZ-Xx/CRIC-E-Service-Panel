import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { isSystemInstalled } from '@/lib/install';
import { getCurrentUserSession, isAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSystemInstalled()) {
    redirect('/install');
  }

  const isAuth = await isAuthenticatedUser();
  if (!isAuth) {
    redirect('/login');
  }

  const session = await getCurrentUserSession();
  if (session.currentRole !== 'admin') {
    redirect('/?unauthorized=1');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0e0f10] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8 selection:bg-blue-600 selection:text-white transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
