'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLauncher from '@/components/launcher/AppLauncher';
import { UserSession, UserRole, SystemSetting } from '@/types/service';
import { 
  ShieldAlert, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Settings, 
  Search,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  settings?: SystemSetting | null;
  onRoleChange?: (role: UserRole) => void;
  onSearchChange?: (query: string) => void;
}

export default function Navbar({ settings, onRoleChange, onSearchChange }: NavbarProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
      }
    } catch (e) {
      console.error('Failed to get session', e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleRoleSwitch = async (newRole: UserRole) => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
        setRoleDropdownOpen(false);
        onRoleChange?.(newRole);
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to switch role', e);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange?.(e.target.value);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: ShieldAlert };
      case 'teacher':
        return { label: 'Teacher', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: GraduationCap };
      case 'staff':
        return { label: 'Staff', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Briefcase };
      default:
        return { label: 'Student', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: UserCheck };
    }
  };

  const currentRoleBadge = getRoleBadge(session?.currentRole);
  const RoleIcon = currentRoleBadge.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-[#121314]/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-xl object-contain bg-neutral-900 border border-neutral-800 p-1 group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <span className="font-bold text-white text-lg tracking-wider">C</span>
              </div>
            )}
            <div>
              <div className="font-semibold text-white tracking-tight text-[15px] flex items-center gap-1.5">
                <span>{settings?.portalTitle || 'CRIC E-Service'}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Panel
                </span>
              </div>
              <p className="text-xs text-neutral-400 -mt-0.5 hidden sm:block">
                {settings?.collegeNameTh || 'ศูนย์บริการดิจิทัลวิทยาลัย CRIC'}
              </p>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="ค้นหาบริการภายในวิทยาลัย..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900/90 border border-neutral-700/60 rounded-full text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
            />
          </div>
        </div>

        {/* Right Action Icons: Role Switcher, Admin Button, 9-Dots Launcher, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher (Simulate Keycloak RBAC) */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all ${currentRoleBadge.color} hover:opacity-90`}
              title="สลับบทบาทผู้ใช้งาน (RBAC Simulation)"
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="capitalize hidden md:inline">{currentRoleBadge.label}</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#1e1f20] border border-neutral-700/80 shadow-2xl py-2 z-50 text-neutral-200 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  สลับบทบาท (Role View)
                </div>
                {(['student', 'teacher', 'staff', 'admin'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                      session?.currentRole === role ? 'text-blue-400 font-semibold bg-blue-500/10' : ''
                    }`}
                  >
                    <span className="capitalize">{role}</span>
                    {session?.currentRole === role && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Google Auth Status / Login Pill */}
          {settings?.googleAuthEnabled && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-neutral-800 text-xs font-semibold shadow-sm hover:bg-neutral-100 transition-all cursor-pointer select-none"
              title={`เข้าสู่ระบบด้วย Google Workspace (@${settings.googleHostedDomain || 'cric.ac.th'})`}
              onClick={() => alert(`ระบบเชื่อมต่อกับ Google OAuth 2.0 เรียบร้อย (Domain: @${settings.googleHostedDomain || 'cric.ac.th'})`)}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </div>
          )}

          {/* Admin Backoffice Button */}
          {session?.currentRole === 'admin' && (
            <Link
              href="/admin/services"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-medium transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* The Google 9-Dots App Launcher Icon */}
          <AppLauncher currentRole={session?.currentRole} />

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-1 border-l border-neutral-800">
            <img
              src={session?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={session?.displayName || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-700"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
