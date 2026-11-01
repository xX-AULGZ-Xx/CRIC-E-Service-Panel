'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Layers, Sliders, ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { UserSession } from '@/types/service';

export default function AdminHeader() {
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSession(data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const isServicesActive = pathname.startsWith('/admin/services') || pathname === '/admin';
  const isSettingsActive = pathname.startsWith('/admin/settings');

  const isNonAdmin = session && session.currentRole !== 'admin';

  return (
    <div className="space-y-6">
      {/* Non-Admin Warning Banner (If Logged in as Student / Teacher / Staff) */}
      {isNonAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>แจ้งเตือน:</strong> คุณกำลังเปิดหน้านี้ในบทบาท <span className="capitalize font-bold text-white">{session.currentRole}</span> (เฉพาะผู้ดูแลระบบ Admin เท่านั้นที่จะสามารถบันทึกข้อมูลได้)
            </span>
          </div>
          <Link
            href="/login?callbackUrl=/admin/services"
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shrink-0 flex items-center gap-1 transition-colors"
          >
            <span>สลับเป็นบัญชี Admin (Demo)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

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
    </div>
  );
}
