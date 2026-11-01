'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Layers, Sliders, ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { UserSession } from '@/types/service';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSession(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const isServicesActive = pathname.startsWith('/admin/services') || pathname === '/admin';
  const isSettingsActive = pathname.startsWith('/admin/settings');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0f10] text-neutral-400 flex items-center justify-center text-xs">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</span>
      </div>
    );
  }

  // Check if current user is an Admin
  if (session && session.currentRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0b0c] text-neutral-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#141517] border border-rose-500/30 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">ต้องการสิทธิ์ผู้ดูแลระบบ (Admin Required)</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              คุณกำลังเข้าสู่ระบบในฐานะ <span className="font-semibold text-amber-400 capitalize">{session.currentRole}</span> ซึ่งไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login?callbackUrl=/admin/services"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
            >
              <span>เข้าสู่ระบบด้วยบัญชี Admin (Demo)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 transition-colors"
            >
              กลับหน้าหลัก Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
