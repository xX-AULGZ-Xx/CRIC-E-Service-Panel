'use client';

import React from 'react';
import { SystemSetting } from '@/types/service';
import { Wrench, Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

interface MaintenanceScreenProps {
  settings: SystemSetting | null;
}

export default function MaintenanceScreen({ settings }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-[#0a0b0c] text-neutral-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full bg-[#141517]/80 border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-6">
        {/* Animated Badge & Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10 animate-bounce">
          <Wrench className="w-8 h-8" />
        </div>

        {/* College & System Branding */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <span>โหมดปิดปรับปรุงระบบชั่วคราว (Maintenance Mode)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white pt-2">
            {settings?.portalTitle || 'CRIC E-Service Panel'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            {settings?.collegeNameTh || 'วิทยาลัยอาชีวศึกษา CRIC'} ({settings?.collegeNameEn || 'CRIC College'})
          </p>
        </div>

        {/* Message */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs sm:text-sm leading-relaxed">
          {settings?.maintenanceMessage ||
            'ระบบกำลังอยู่ระหว่างการปรับปรุงและอัปเกรดประสิทธิภาพการบริการ ขออภัยในความไม่สะดวก'}
        </div>

        {/* Help & Contact Details */}
        <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400">
          {settings?.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-neutral-500" />
              <span>{settings.contactEmail}</span>
            </a>
          )}
          {settings?.contactPhone && (
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-neutral-500" />
              <span>{settings.contactPhone}</span>
            </span>
          )}
          {settings?.helpdeskUrl && (
            <a
              href={settings.helpdeskUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>ศูนย์ช่วยเหลือ (Helpdesk)</span>
            </a>
          )}
        </div>

        {/* Admin Login Note */}
        <div className="text-[11px] text-neutral-500 pt-2">
          ผู้ดูแลระบบ (Admin) สามารถเข้าสู่ระบบเพื่อจัดการตั้งค่าได้ตามปกติ
        </div>
      </div>
    </div>
  );
}
