'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggleButton from '@/components/theme/ThemeToggleButton';
import { PreflightCheckResult } from '@/lib/install';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  ShieldCheck,
  FolderLock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Lock,
  Building2,
  User,
  Mail,
  Key,
  Layers,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronRight,
  Upload,
} from 'lucide-react';

const DEFAULT_PRESET_SERVICES = [
  { title: 'ระบบแผนงานและงบประมาณ (CRIC Plan)', cat: 'งานวิจัยและแผนงาน', icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965313.png' },
  { title: 'ระบบบริหารงานวิจัยและวิทยาลัย (CRIC RCMS)', cat: 'งานวิจัยและแผนงาน', icon: 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png' },
  { title: 'ระบบสารสนเทศทะเบียนนักศึกษา (E-Registrar)', cat: 'การเรียนการสอนและวิชาการ', icon: 'https://cdn-icons-png.flaticon.com/512/3429/3429284.png' },
  { title: 'Google Classroom (CRIC Workspace)', cat: 'การเรียนการสอนและวิชาการ', icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965278.png' },
  { title: 'ระบบสารบรรณและเอกสาร (E-Document)', cat: 'งานบริหารและบุคคล', icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965280.png' },
  { title: 'CRIC Gemini AI Assistant', cat: 'เครื่องมือและไอที', icon: 'https://cdn-icons-png.flaticon.com/512/11865/11865326.png' },
  { title: 'ห้องสมุดดิจิทัล (CRIC E-Library)', cat: 'การเรียนการสอนและวิชาการ', icon: 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png' },
  { title: 'ศูนย์รับเรื่องร้องเรียนและ IT Helpdesk', cat: 'เครื่องมือและไอที', icon: 'https://cdn-icons-png.flaticon.com/512/4233/4233830.png' },
];

export default function InstallPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingCheck, setLoadingCheck] = useState<boolean>(true);
  const [preflight, setPreflight] = useState<PreflightCheckResult | null>(null);
  const [installing, setInstalling] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form States (Branding & Identity)
  const [collegeNameTh, setCollegeNameTh] = useState<string>('วิทยาลัยอาชีวศึกษา CRIC');
  const [collegeNameEn, setCollegeNameEn] = useState<string>('CRIC Vocational College');
  const [portalTitle, setPortalTitle] = useState<string>('CRIC E-Service Panel');
  const [portalSubtitle, setPortalSubtitle] = useState<string>('ศูนย์รวมบริการดิจิทัลสำหรับนักศึกษาและบุคลากร');
  const [logoUrl, setLogoUrl] = useState<string>('/uploads/1793600763812-tab-icon.png');

  // Form States (Super Admin)
  const [adminName, setAdminName] = useState<string>('ผู้ดูแลระบบสูงสุด (Super Admin)');
  const [adminEmail, setAdminEmail] = useState<string>('admin@cric.ac.th');
  const [adminPassword, setAdminPassword] = useState<string>('Admin@2026!');
  const [confirmPassword, setConfirmPassword] = useState<string>('Admin@2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [includeSampleData, setIncludeSampleData] = useState<boolean>(true);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setLogoUrl(data.url);
      } else {
        alert(data.error || 'อัปโหลดโลโก้ไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Fetch Pre-flight Checks
  const runPreflightCheck = async () => {
    setLoadingCheck(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/install/check');
      const data = await res.json();
      if (data.success) {
        setPreflight(data.data);
      } else {
        setErrorMessage(data.error || 'ไม่สามารถตรวจสอบสถานะระบบได้');
      }
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อตรวจสอบระบบ');
    } finally {
      setLoadingCheck(false);
    }
  };

  useEffect(() => {
    runPreflightCheck();
  }, []);

  // Submit Installation
  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== confirmPassword) {
      alert('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (adminPassword.length < 6) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setInstalling(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/install/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeNameTh,
          collegeNameEn,
          portalTitle,
          portalSubtitle,
          logoUrl,
          adminName,
          adminEmail,
          adminPassword,
          includeSampleData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInstallSuccess(true);
        setTimeout(() => {
          router.push(data.redirectUrl || '/admin/services');
        }, 2500);
      } else {
        setErrorMessage(data.error || 'การติดตั้งล้มเหลว');
      }
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการส่งข้อมูลติดตั้ง');
    } finally {
      setInstalling(false);
    }
  };

  // If already installed and locked
  if (preflight?.isInstalled) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0c] text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              ระบบได้รับการติดตั้งแล้ว
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              CRIC E-Service Panel ถูกติดตั้งและกำหนดค่าเริ่มต้นเรียบร้อยแล้ว หน้านี้ถูกล็อกถาวรเพื่อความปลอดภัย (หากต้องการติดตั้งใหม่ ให้ลบไฟล์ <code className="text-rose-500 bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">data/installed.lock</code> บนเซิร์ฟเวอร์)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/"
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold transition-colors block text-center"
            >
              หน้าแรก Portal
            </a>
            <a
              href="/admin/services"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors block text-center"
            >
              จัดการระบบ Admin
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Installation Success Celebration
  if (installSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0c] text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-4 animate-in fade-in">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-10 h-10" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Installation Completed
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-3">
              ติดตั้งระบบเสร็จสมบูรณ์!
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              สร้างตารางฐานข้อมูล, บริการเริ่มต้น 8 ระบบ, และบัญชี Super Admin เรียบร้อยแล้ว กำลังนำท่านเข้าสู่หน้าจัดการระบบ...
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0c] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="font-bold text-white text-lg tracking-wider">C</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                CRIC E-Service Setup Wizard
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                v1.0
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ติดตั้งและกำหนดค่าเริ่มต้นระบบศูนย์บริการดิจิทัลวิทยาลัย
            </p>
          </div>
        </div>

        <ThemeToggleButton />
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-4xl w-full mx-auto my-8 flex-1">
        {/* Stepper Progress Bar */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {[
              { num: 1, label: 'ตรวจความพร้อม', icon: Server },
              { num: 2, label: 'ฐานข้อมูล & บริการ', icon: Database },
              { num: 3, label: 'ข้อมูลสถาบัน', icon: Building2 },
              { num: 4, label: 'บัญชี Super Admin', icon: ShieldCheck },
            ].map((step) => {
              const StepIcon = step.icon;
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <div
                  key={step.num}
                  className={`flex flex-col sm:flex-row items-center gap-2 p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm'
                      : isPassed
                      ? 'bg-white dark:bg-neutral-900 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-white/60 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isPassed
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-xs font-semibold leading-tight line-clamp-1">{step.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wizard Step 1: Pre-flight Checks */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-500" />
                  ขั้นตอนที่ 1: ตรวจสอบความพร้อมของเซิร์ฟเวอร์ (Pre-flight Checks)
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  ระบบจะตรวจสอบสภาพแวดล้อม รันไทม์ และการเชื่อมต่อฐานข้อมูลก่อนเริ่มการติดตั้ง
                </p>
              </div>

              <button
                onClick={runPreflightCheck}
                disabled={loadingCheck}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCheck ? 'animate-spin' : ''}`} />
                <span>ตรวจใหม่อีกครั้ง</span>
              </button>
            </div>

            {loadingCheck ? (
              <div className="py-16 text-center text-neutral-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs">กำลังตรวจสอบสภาพแวดล้อม...</span>
              </div>
            ) : preflight ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Node.js */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 flex items-start gap-3">
                  {preflight.node.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>Node.js Runtime</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800">
                        {preflight.node.version}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {preflight.node.message}
                    </p>
                  </div>
                </div>

                {/* Database */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 flex items-start gap-3">
                  {preflight.database.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>ฐานข้อมูล PostgreSQL</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {preflight.database.urlHost}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {preflight.database.message}
                    </p>
                  </div>
                </div>

                {/* Storage Permission */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 flex items-start gap-3">
                  {preflight.storage.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-neutral-900 dark:text-white">
                      สิทธิ์การบันทึกไฟล์ (Storage)
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      {preflight.storage.message}
                    </p>
                    {!preflight.storage.ok && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-neutral-900 dark:bg-black border border-neutral-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between gap-2">
                        <span className="truncate">docker exec -u 0 -it cric-portal chmod -R 777 /app/data /app/public/uploads</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('docker exec -u 0 -it cric-portal chmod -R 777 /app/data /app/public/uploads');
                            alert('คัดลอกคำสั่งแก้ไขสิทธิ์เรียบร้อยแล้ว');
                          }}
                          className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] shrink-0 font-sans"
                        >
                          คัดลอกคำสั่ง
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Keycloak SSO Server */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 flex items-start gap-3">
                  {preflight.keycloak.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>Keycloak SSO Provider</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800">
                        {preflight.keycloak.ok ? 'Online' : 'Optional / Standby'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {preflight.keycloak.message}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Action Bar */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={loadingCheck || !preflight?.allPassed}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
              >
                <span>ดำเนินการต่อ (ขั้นตอนที่ 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Wizard Step 2: Database & Seed Services */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                ขั้นตอนที่ 2: ฐานข้อมูลและบริการเริ่มต้น (Database & Seed Services)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                เลือกว่าต้องการนำเข้าข้อมูลบริการตัวอย่างของวิทยาลัยหรือไม่ เพื่อความสะดวกในการเริ่มต้นระบบ
              </p>
            </div>

            {/* Toggle Options: Sample Data vs Clean Installation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Include Sample Data */}
              <button
                type="button"
                onClick={() => setIncludeSampleData(true)}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  includeSampleData
                    ? 'bg-blue-50/80 dark:bg-blue-500/10 border-blue-500 text-neutral-900 dark:text-white shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/50 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        includeSampleData
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                        <span>นำเข้าบริการตัวอย่าง</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          แนะนำ
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        ติดตั้ง 8 บริการเริ่มต้น และ 4 หมวดหมู่หลักของวิทยาลัย
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      includeSampleData
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    {includeSampleData && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Option 2: Clean Installation */}
              <button
                type="button"
                onClick={() => setIncludeSampleData(false)}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  !includeSampleData
                    ? 'bg-blue-50/80 dark:bg-blue-500/10 border-blue-500 text-neutral-900 dark:text-white shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/50 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        !includeSampleData
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                        <span>ติดตั้งระบบเปล่า (Clean)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          ว่างเปล่า
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        สร้างเฉพาะตารางเปล่าและหมวดหมู่ (กำหนดบริการเองภายหลัง)
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      !includeSampleData
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    {!includeSampleData && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>
            </div>

            {/* Content Preview based on selection */}
            {includeSampleData ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>ตัวอย่างบริการดิจิทัลที่จะถูกนำเข้าสู่ระบบ ({DEFAULT_PRESET_SERVICES.length} รายการ):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-black/30">
                  {DEFAULT_PRESET_SERVICES.map((srv, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3"
                    >
                      <img src={srv.icon} alt={srv.title} className="w-7 h-7 object-contain shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {srv.title}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          หมวด: {srv.cat}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700/80 text-center bg-slate-50/60 dark:bg-neutral-950/40 space-y-2">
                <Layers className="w-8 h-8 text-neutral-400 mx-auto" />
                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  คุณเลือกติดตั้งระบบแบบว่างเปล่า (No Sample Data)
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                  ระบบจะสร้างโครงสร้างตารางฐานข้อมูลและ 4 หมวดหมู่หลักไว้ให้พร้อม โดยยังไม่มีการเพิ่มรายการบริการใดๆ เข้าสู่ระบบ ผู้ดูแลระบบสามารถเข้าไปเพิ่มบริการใหม่ได้ตลอดเวลาในหน้าจัดการบริการ (Admin Services)
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
              >
                <span>ดำเนินการต่อ (ขั้นตอนที่ 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Wizard Step 3: College Branding & Identity */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                ขั้นตอนที่ 3: กำหนดชื่อวิทยาลัยและแบรนด์ดิ้ง (College Branding)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                กำหนดชื่อสถาบัน ข้อความหัวเว็บ และโลโก้ที่จะแสดงผลในหน้า Portal และ App Launcher
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    ชื่อวิทยาลัย (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={collegeNameTh}
                    onChange={(e) => setCollegeNameTh(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    ชื่อวิทยาลัย (ภาษาอังกฤษ)
                  </label>
                  <input
                    type="text"
                    value={collegeNameEn}
                    onChange={(e) => setCollegeNameEn(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    ชื่อระบบพอร์ทัล (Portal Title)
                  </label>
                  <input
                    type="text"
                    value={portalTitle}
                    onChange={(e) => setPortalTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    คำอธิบายสโลแกน (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={portalSubtitle}
                    onChange={(e) => setPortalSubtitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Logo Preview & Upload */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  โลโก้วิทยาลัย / ตราสถาบัน (College Logo)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950/50">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2 flex items-center justify-center shrink-0">
                    <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์โลโก้ใหม่'}</span>
                      </button>

                      {logoUrl !== '/uploads/1793600763812-tab-icon.png' && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('/uploads/1793600763812-tab-icon.png')}
                          className="px-3 py-1.5 rounded-xl text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                        >
                          ใช้ตรามาตรฐาน CRIC
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      รองรับไฟล์ภาพ PNG, JPG, WebP หรือ SVG แนะนำพื้นหลังโปร่งใส ขนาดไม่เกิน 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
              >
                <span>ดำเนินการต่อ (ขั้นตอนที่ 4)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Wizard Step 4: Super Admin Account Setup */}
        {currentStep === 4 && (
          <form
            onSubmit={handleInstall}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                ขั้นตอนที่ 4: สร้างบัญชีผู้ดูแลระบบสูงสุด (Super Admin Setup)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                กำหนดบัญชี Master Admin สำหรับบริหารจัดการระบบทั้งหมด และเข้าสู่หน้า Admin Backoffice ได้ตลอดเวลา
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  ชื่อ-นามสกุล ผู้ดูแลระบบ (Full Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  อีเมลผู้ดูแลระบบ (Admin Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      placeholder="กำหนดรหัสผ่าน..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    ยืนยันรหัสผ่าน (Confirm Password)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="ยืนยันรหัสผ่าน..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Security Lock Note */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>การล็อกความปลอดภัย:</strong> เมื่อกดปุ่มติดตั้ง ระบบจะสร้างไฟล์ <code className="bg-blue-200 dark:bg-blue-900/60 px-1 py-0.5 rounded font-mono">data/installed.lock</code> เพื่อปิดการเข้าถึงหน้าติดตั้งนี้ถาวรทันที
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={installing}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="submit"
                disabled={installing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                {installing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังติดตั้งระบบ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>ยืนยันและติดตั้งระบบทันที</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-400 py-4 border-t border-neutral-200 dark:border-neutral-800">
        CRIC E-Service Panel • Central Identity & Service Hub System
      </footer>
    </div>
  );
}
