'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldAlert, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
  FlaskConical,
  X,
  CheckCircle2
} from 'lucide-react';
import ThemeToggleButton from '@/components/theme/ThemeToggleButton';
import { UserRole, SystemSetting } from '@/types/service';

interface DemoUserCard {
  role: UserRole;
  title: string;
  name: string;
  username: string;
  pass: string;
  description: string;
  color: string;
  border: string;
  btnColor: string;
  icon: React.ComponentType<{ className?: string }>;
  avatar: string;
}

const DEMO_USERS: DemoUserCard[] = [
  {
    role: 'admin',
    title: 'ผู้ดูแลระบบ (Admin)',
    name: 'ดร. นคร พัฒนกิจ',
    username: 'admin',
    pass: 'admin123',
    description: 'สิทธิ์สูงสุด จัดการบริการ นโยบายความปลอดภัย Google SSO และระบบลูกข่าย Keycloak',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
    icon: ShieldAlert,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    role: 'teacher',
    title: 'อาจารย์ / ผู้สอน (Teacher)',
    name: 'อ. ภัทรวดี วิทยากร',
    username: 'teacher',
    pass: 'teacher123',
    description: 'เข้าถึงระบบส่งเกรด ทะเบียนวัดผล บันทึกวิจัย และระบบวางแผนหลักสูตรวิทยาลัย',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon: GraduationCap,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    role: 'staff',
    title: 'เจ้าหน้าที่ / บุคลากร (Staff)',
    name: 'คุณ ชนินทร์ งานธุรการ',
    username: 'staff',
    pass: 'staff123',
    description: 'เข้าถึงระบบสารบรรณอิเล็กทรอนิกส์ การเงิน พัสดุ และเบิกจ่ายสวัสดิการ',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    icon: Briefcase,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    role: 'student',
    title: 'นักเรียน / นักศึกษา (Student)',
    name: 'นาย ภานุวัฒน์ ใฝ่เรียนดี',
    username: 'student',
    pass: 'student123',
    description: 'เข้าถึงระบบตารางเรียน ตารางสอน ผลการเรียน กิจกรรม และ E-Library',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: UserCheck,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  useEffect(() => {
    // Check installation status
    fetch('/api/v1/install/check')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && !data.data.isInstalled) {
          router.push('/install');
        }
      })
      .catch(() => {});

    fetch('/api/v1/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch((err) => console.error(err));
  }, [router]);

  // Handle escape key to close demo modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDemoModalOpen) {
        setIsDemoModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemoModalOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setDemoLoading(role);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoRole: role }),
      });
      const data = await res.json();

      if (data.success) {
        setIsDemoModalOpen(false);
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(data.error || 'เข้าสู่ระบบด้วยบัญชีทดสอบไม่สำเร็จ');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setDemoLoading(null);
    }
  };

  const isDemoEnabled = settings ? settings.demoModeEnabled !== false : true;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0c] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden transition-colors duration-200">
      {/* Dynamic Background Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-500/15 via-indigo-500/10 to-transparent dark:from-blue-600/20 dark:via-indigo-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[400px] bg-sky-500/10 dark:bg-sky-500/5 blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/60 bg-white/70 dark:bg-[#0e0f10]/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              C
            </div>
          )}
          <div>
            <div className="font-semibold text-neutral-900 dark:text-white tracking-tight text-sm flex items-center gap-1.5">
              <span>{settings?.portalTitle || 'CRIC E-Service'}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                SSO
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-0.5">
              {settings?.collegeNameTh || 'วิทยาลัยอาชีวศึกษา CRIC'}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>ระบบยืนยันตัวตนกลาง (Central Identity)</span>
          </div>
          <ThemeToggleButton />
        </div>
      </header>

      {/* Main 1-Page Minimalist Login Centerpiece */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Portal Greeting */}
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Single Sign-On Portal (เข้าใช้งานทุกระบบด้วยบัญชีเดียว)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            เข้าสู่ระบบบริการดิจิทัล
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            {settings?.collegeNameTh || 'วิทยาลัยอาชีวศึกษา CRIC'} — One Account for All Services
          </p>
        </div>

        {/* 1-Page Minimalist Glassmorphism Card */}
        <div className="bg-white/85 dark:bg-[#131417]/85 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/5 dark:shadow-black/60 space-y-6 transition-all duration-200">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">ลงชื่อเข้าใช้งาน</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">เข้าถึงแดชบอร์ดและระบบสารสนเทศวิทยาลัย</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Workspace SSO Primary Button */}
          {settings?.googleAuthEnabled && (
            <div className="space-y-4">
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => {
                  setGoogleLoading(true);
                  setError(null);
                  window.location.href = '/api/auth/google';
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-50 dark:bg-[#1c1d22] dark:hover:bg-[#25262c] border border-neutral-200/90 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-100 font-medium text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-60 group"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'กำลังพาคุณไปยัง Google Workspace...' : 'เข้าสู่ระบบด้วย Google Workspace'}</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
                <span className="bg-white/85 dark:bg-[#131417]/85 px-3 text-[11px] text-neutral-400 uppercase tracking-wider absolute">
                  หรือลงชื่อเข้าใช้ด้วยบัญชีวิทยาลัย
                </span>
              </div>
            </div>
          )}

          {/* Standard Username & Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                ชื่อผู้ใช้งานหรืออีเมล (Username / Email)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, teacher, student"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านเข้าใช้งาน"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Floating Pill Button for Demo Accounts (Only shown when Demo Mode is Enabled) */}
      {isDemoEnabled && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsDemoModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#1c1d22] hover:bg-neutral-50 dark:hover:bg-[#25262c] text-neutral-800 dark:text-neutral-100 font-medium text-xs sm:text-sm border border-neutral-200 dark:border-neutral-700 shadow-xl shadow-black/10 dark:shadow-black/40 transition-all hover:scale-105 active:scale-95 group"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <FlaskConical className="w-4 h-4 text-emerald-500 group-hover:rotate-12 transition-transform" />
            <span>ทดสอบด้วย Demo Accounts</span>
          </button>
        </div>
      )}

      {/* Demo Users Quick Drawer / Modal */}
      {isDemoEnabled && isDemoModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsDemoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                    สวมบทบาททดสอบระบบ (Demo Accounts)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    คลิกสวมบทบาทเพื่อทดสอบสิทธิ์การเข้าถึงบริการ (Role-Based Access Control) แต่ละกลุ่ม
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Demo User Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DEMO_USERS.map((demo) => {
                const IconComponent = demo.icon;
                const isLoadingThis = demoLoading === demo.role;

                return (
                  <div
                    key={demo.role}
                    className={`p-4 rounded-2xl bg-slate-50 dark:bg-[#1a1b1f] border ${demo.border} transition-all duration-200 flex flex-col justify-between space-y-3 group hover:shadow-md`}
                  >
                    <div>
                      {/* Role Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${demo.color}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{demo.title}</span>
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={demo.avatar}
                          alt={demo.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
                        />
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {demo.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                            user: <span className="text-neutral-800 dark:text-white font-bold">{demo.username}</span> | pass: <span className="text-neutral-600 dark:text-neutral-300">{demo.pass}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {demo.description}
                      </p>
                    </div>

                    {/* Instant Login Button */}
                    <button
                      type="button"
                      disabled={isLoadingThis}
                      onClick={() => handleDemoLogin(demo.role)}
                      className={`w-full py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm ${demo.btnColor} disabled:opacity-50`}
                    >
                      {isLoadingThis ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>คลิกเข้าสู่ระบบทันที</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                โหมดทดสอบเปิดใช้งานใน Settings
              </span>
              <span>กด Esc เพื่อปิด</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-200/80 dark:border-neutral-800/60 bg-white/70 dark:bg-[#0e0f10]/70 py-4 px-6 text-xs text-neutral-500 text-center sm:flex sm:items-center sm:justify-between transition-colors duration-200">
        <div>{settings?.footerText || '© 2026 CRIC College. All rights reserved.'}</div>
        <div className="flex items-center justify-center gap-4 mt-2 sm:mt-0">
          {settings?.contactEmail && <span>อีเมล: {settings.contactEmail}</span>}
          {settings?.helpdeskUrl && (
            <a
              href={settings.helpdeskUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>ศูนย์ช่วยเหลือ (Helpdesk)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0c] flex items-center justify-center text-neutral-500 text-xs">
          กำลังโหลดหน้าเข้าสู่ระบบ...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
