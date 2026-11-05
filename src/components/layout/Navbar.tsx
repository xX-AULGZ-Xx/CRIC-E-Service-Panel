'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLauncher from '@/components/launcher/AppLauncher';
import ThemeToggleButton from '@/components/theme/ThemeToggleButton';
import { UserSession, UserRole, SystemSetting } from '@/types/service';
import { 
  ShieldAlert, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Settings, 
  Search,
  ChevronDown,
  LogOut,
  LogIn,
  Globe,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  settings?: SystemSetting | null;
  onRoleChange?: (role: UserRole) => void;
  onSearchChange?: (query: string) => void;
}

export default function Navbar({ settings, onRoleChange, onSearchChange }: NavbarProps) {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
        setIsLoggedIn(data.isLoggedIn !== false);
        if (data.demoModeEnabled !== undefined) {
          setDemoMode(data.demoModeEnabled);
        }
      }
    } catch (e) {
      console.error('Failed to get session', e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

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

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.logoutUrl) {
        window.location.href = data.logoutUrl;
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        router.push('/login?logout=1');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout error', e);
      window.location.href = '/login?logout=1';
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange?.(e.target.value);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/30', icon: ShieldAlert };
      case 'teacher':
        return { label: 'Teacher', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: GraduationCap };
      case 'staff':
        return { label: 'Staff', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: Briefcase };
      case 'guest':
        return { label: 'Guest', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30', icon: Globe };
      default:
        return { label: 'Student', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: UserCheck };
    }
  };

  const currentRoleBadge = getRoleBadge(session?.currentRole);
  const RoleIcon = currentRoleBadge.icon;
  const isDemoActive = isLoggedIn && !!session && demoMode && settings?.demoModeEnabled !== false && process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-[#121314]/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <span className="font-bold text-white text-base sm:text-lg tracking-wider">C</span>
              </div>
            )}
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white tracking-tight text-xs sm:text-[15px] flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <span>{settings?.portalTitle || 'CRIC E-Service'}</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Panel
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-0.5 hidden sm:block">
                {settings?.collegeNameTh || 'ศูนย์บริการดิจิทัลวิทยาลัย CRIC'}
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Search Bar (Hidden on Mobile) */}
        <div className="hidden sm:block flex-1 max-w-md mx-3 sm:mx-6">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="ค้นหาบริการภายในวิทยาลัย..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/60 rounded-full text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
            />
          </div>
        </div>

        {/* Right Action Icons: Role Switcher, Admin Button, Theme Toggle, 9-Dots Launcher, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher (Simulate Keycloak RBAC - Only in Demo/Test Mode) */}
          {isDemoActive && (
            <div className="relative hidden md:block">
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
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#1e1f20] border border-neutral-200 dark:border-neutral-700/80 shadow-2xl py-2 z-50 text-neutral-800 dark:text-neutral-200 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                    สลับบทบาท (Role View)
                  </div>
                  {(['guest', 'student', 'teacher', 'staff', 'admin'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                        session?.currentRole === role ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10' : ''
                      }`}
                    >
                      <span className="capitalize">{role}</span>
                      {session?.currentRole === role && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin Backoffice Button */}
          {session?.currentRole === 'admin' && (
            <Link
              href="/admin/services"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 text-xs font-medium transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* Theme Switcher Button (Single-Click Cycle: Light -> Dark -> System) */}
          <ThemeToggleButton />

          {/* The Google 9-Dots App Launcher Icon */}
          <AppLauncher currentRole={session?.currentRole} isLoggedIn={isLoggedIn} />

          {/* User Profile Avatar & Dropdown OR Guest Sign-In Button */}
          {isLoggedIn && session ? (
            <div className="relative pl-1 border-l border-neutral-200 dark:border-neutral-800" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                title="เมนูผู้ใช้งาน"
              >
                <img
                  src={session.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={session.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-300 dark:ring-neutral-700 hover:ring-blue-500 transition-all cursor-pointer"
                />
              </button>

              {/* Profile Menu Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white dark:bg-[#1e1f20] border border-neutral-200 dark:border-neutral-700/80 shadow-2xl py-3 z-50 text-neutral-800 dark:text-neutral-200 animate-in fade-in zoom-in-95">
                  {/* User Header */}
                  <div className="px-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1">
                      {session.displayName}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                      {session.email}
                    </div>
                    <div className="mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${currentRoleBadge.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        <span className="capitalize">{session.currentRole}</span>
                      </span>
                    </div>
                  </div>

                  {/* Mobile Role Switcher (Visible only on < md) */}
                  {isDemoActive && (
                    <div className="md:hidden py-2 px-3 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        สลับบทบาท (Role View)
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {(['guest', 'student', 'teacher', 'staff', 'admin'] as UserRole[]).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              handleRoleSwitch(role);
                              setProfileDropdownOpen(false);
                            }}
                            className={`px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between text-left transition-colors ${
                              session?.currentRole === role
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <span className="capitalize">{role}</span>
                            {session?.currentRole === role && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  <div className="py-2 px-2 space-y-1">
                    {session.currentRole === 'admin' && (
                      <Link
                        href="/admin/services"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full px-3 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <span>จัดการระบบ (Admin Panel)</span>
                      </Link>
                    )}

                    {isDemoActive && (
                      <Link
                        href="/login"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full px-3 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-neutral-400" />
                        <span>สลับบัญชี (Demo Users)</span>
                      </Link>
                    )}
                  </div>

                  {/* Sign Out */}
                  <div className="pt-2 px-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 text-xs rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 transition-colors font-medium text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ (Sign Out)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-1 border-l border-neutral-200 dark:border-neutral-800">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar Row (Visible ONLY on mobile < sm) */}
      <div className="block sm:hidden max-w-7xl mx-auto pt-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="ค้นหาบริการภายในวิทยาลัย..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/60 rounded-full text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all shadow-2xs"
          />
        </div>
      </div>
    </header>
  );
}
