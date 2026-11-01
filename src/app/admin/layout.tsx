'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Layers, Sliders, ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isServicesActive = pathname.startsWith('/admin/services') || pathname === '/admin';
  const isSettingsActive = pathname.startsWith('/admin/settings');

  return (
    <div className="min-h-screen bg-[#0e0f10] text-neutral-100 p-4 sm:p-8 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="กลับหน้า Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  ผู้ดูแลระบบ CRIC E-Service
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Admin Backoffice
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                ศูนย์ควบคุมและกำหนดค่านโยบายบริการภายในวิทยาลัย CRIC
              </p>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <Link
            href="/admin/services"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isServicesActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>จัดการบริการ (Services Management)</span>
          </Link>

          <Link
            href="/admin/settings"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isSettingsActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>การตั้งค่าระบบ (System Settings)</span>
          </Link>
        </div>

        {/* Content View */}
        <main>{children}</main>
      </div>
    </div>
  );
}
