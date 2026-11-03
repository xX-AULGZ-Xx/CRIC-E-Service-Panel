'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SystemSetting } from '@/types/service';
import { 
  Building2, 
  Wrench, 
  Sliders, 
  Key, 
  ShieldCheck, 
  Save, 
  Check, 
  AlertCircle,
  Upload,
  RefreshCw,
  Lock,
  Globe,
  HelpCircle,
  Copy,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';

export default function AdminSettingsManager() {
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'behavior' | 'google' | 'security'>('branding');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Google OAuth helpers
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch {
      setMessage({ text: 'ไม่สามารถโหลดข้อมูลการตั้งค่าได้', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (field: keyof SystemSetting, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

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
        handleChange('logoUrl', data.url);
        // Auto-save immediately to database and settings storage
        if (settings) {
          const updatedSettings = { ...settings, logoUrl: data.url };
          fetch('/api/v1/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSettings),
          }).catch(console.error);
        }
        setMessage({ text: 'อัปโหลดและบันทึกโลโก้สถาบันเรียบร้อยแล้ว', type: 'success' });
      } else {
        alert(data.error || 'อัปโหลดโลโก้ไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setMessage({ text: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว', type: 'success' });
      } else {
        setMessage({ text: data.error || 'บันทึกไม่สำเร็จ', type: 'error' });
      }
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-sm">กำลังโหลดการตั้งค่าระบบ...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-rose-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณารีเฟรชหน้าเว็บอีกครั้ง
      </div>
    );
  }

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const portalRedirectUri = `${originUrl}/api/auth/callback/google`;
  const keycloakRedirectUri = 'https://sso.cric.ac.th/realms/cric-college/broker/google/endpoint';

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'branding'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>ข้อมูลวิทยาลัย & แบรนด์ดิ้ง</span>
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'behavior'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>พฤติกรรมหน้า Portal & โหมดปิดปรับปรุง</span>
        </button>

        <button
          onClick={() => setActiveTab('google')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'google'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850'
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>ตั้งค่า Google Auth Key (OAuth 2.0)</span>
          {settings.googleAuthEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ความปลอดภัย & SSO Keycloak</span>
        </button>
      </div>

      {/* Status Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab: Google Auth Key (OAuth 2.0) */}
        {activeTab === 'google' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Google OAuth Switch Box */}
            <div className={`p-6 rounded-3xl border transition-all ${
              settings.googleAuthEnabled
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/50 shadow-sm'
                : 'bg-white dark:bg-[#141517] border-neutral-200 dark:border-neutral-800 shadow-sm'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm border border-neutral-200/60">
                      <svg viewBox="0 0 24 24" className="w-full h-full">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      การเข้าสู่ระบบด้วย Google (Sign in with Google)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    เปิดใช้งาน Google OAuth 2.0 สำหรับให้นักศึกษา, อาจารย์ และบุคลากรล็อกอินด้วยอีเมล Google Workspace ของวิทยาลัย (@cric.ac.th)
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.googleAuthEnabled}
                    onChange={(e) => handleChange('googleAuthEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-neutral-300 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Google Credentials Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 space-y-5 shadow-sm">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>Google OAuth 2.0 Credentials (Client ID & Client Secret)</span>
              </h3>

              <div className="space-y-4">
                {/* Google Client ID */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Google Client ID *
                  </label>
                  <input
                    type="text"
                    value={settings.googleClientId || ''}
                    onChange={(e) => handleChange('googleClientId', e.target.value)}
                    placeholder="เช่น 123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Client ID ที่สร้างจาก Google Cloud Console (OAuth 2.0 Client IDs &gt; Web application)
                  </p>
                </div>

                {/* Google Client Secret */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Google Client Secret *
                  </label>
                  <div className="relative">
                    <input
                      type={showClientSecret ? 'text' : 'password'}
                      value={settings.googleClientSecret || ''}
                      onChange={(e) => handleChange('googleClientSecret', e.target.value)}
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-3.5 pr-11 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClientSecret(!showClientSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      title={showClientSecret ? 'ซ่อนรหัส' : 'แสดงรหัส'}
                    >
                      {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Client Secret สำหรับยืนยันตัวตนกับเซิร์ฟเวอร์ Google OAuth (เก็บเป็นความลับ)
                  </p>
                </div>

                {/* Google Hosted Domain (HD) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Hosted Domain Restriction (HD Domain)
                  </label>
                  <input
                    type="text"
                    value={settings.googleHostedDomain || ''}
                    onChange={(e) => handleChange('googleHostedDomain', e.target.value)}
                    placeholder="cric.ac.th"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400/90 mt-1">
                    🔒 แนะนำระบุ <code>cric.ac.th</code> เพื่อบล็อกไม่ให้อีเมล <code>@gmail.com</code> ทั่วไปล็อกอินเข้าสู่ระบบได้
                  </p>
                </div>
              </div>
            </div>

            {/* Callback / Redirect URIs Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span>Authorized Redirect URIs (สำหรับกรอกใน Google Cloud Console)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    คัดลอก URI ด้านล่างไปวางในช่อง <strong>Authorized redirect URIs</strong> บน Google Cloud Console
                  </p>
                </div>

                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3 pt-2">
                {/* Portal URI */}
                <div>
                  <div className="text-xs text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                    <span>1. CRIC E-Service Portal Callback URI:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(portalRedirectUri, 'portalUri')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'portalUri' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'portalUri' ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                    {portalRedirectUri}
                  </pre>
                </div>

                {/* Keycloak URI */}
                <div>
                  <div className="text-xs text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                    <span>2. Keycloak Central IdP Identity Broker Endpoint:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(keycloakRedirectUri, 'keycloakUri')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'keycloakUri' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'keycloakUri' ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                    {keycloakRedirectUri}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Branding & College Info */}
        {activeTab === 'branding' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 space-y-5 shadow-sm">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <span>ข้อมูลชื่อและสถาบัน</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    ชื่อวิทยาลัย (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={settings.collegeNameTh}
                    onChange={(e) => handleChange('collegeNameTh', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    ชื่อวิทยาลัย (ภาษาอังกฤษ)
                  </label>
                  <input
                    type="text"
                    value={settings.collegeNameEn}
                    onChange={(e) => handleChange('collegeNameEn', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    ชื่อระบบ Portal (Header Title)
                  </label>
                  <input
                    type="text"
                    value={settings.portalTitle}
                    onChange={(e) => handleChange('portalTitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    คำอธิบายสโลแกน (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={settings.portalSubtitle}
                    onChange={(e) => handleChange('portalSubtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  โลโก้วิทยาลัย / ตราสถาบัน (Logo)
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 flex items-center justify-center shrink-0">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="College Logo"
                        className="w-14 h-14 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                        C
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์โลโก้'}</span>
                    </button>
                    <p className="text-[11px] text-neutral-500">
                      แนะนำภาพ PNG หรือ SVG ขนาดโปร่งใส (Transparent) ไม่เกิน 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Footer Section */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <span>การติดต่อและศูนย์ช่วยเหลือ (Helpdesk & Contact)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    อีเมลติดต่อฝ่าย IT / สนับสนุน
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail || ''}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="support@cric.ac.th"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={settings.contactPhone || ''}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="02-123-4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    URL ศูนย์ช่วยเหลือ (Helpdesk URL)
                  </label>
                  <input
                    type="url"
                    value={settings.helpdeskUrl || ''}
                    onChange={(e) => handleChange('helpdeskUrl', e.target.value)}
                    placeholder="https://helpdesk.cric.ac.th"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  ข้อความ Footer ลิขสิทธิ์ท้ายหน้าเว็บ
                </label>
                <input
                  type="text"
                  value={settings.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Portal Behavior & Maintenance Mode */}
        {activeTab === 'behavior' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Maintenance Mode Box */}
            <div className={`p-6 rounded-3xl border transition-all ${
              settings.maintenanceMode
                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/50 shadow-sm'
                : 'bg-white dark:bg-[#141517] border-neutral-200 dark:border-neutral-800 shadow-sm'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wrench className={`w-5 h-5 ${settings.maintenanceMode ? 'text-amber-500' : 'text-neutral-400'}`} />
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      โหมดปิดปรับปรุงระบบชั่วคราว (Maintenance Mode)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    เมื่อเปิดใช้งาน ผู้ใช้ทั่วไป (นักศึกษา, อาจารย์, บุคลากร) จะเห็นหน้าแจ้งเตือนปิดปรับปรุงระบบ
                    โดยผู้ดูแลระบบ (Admin) จะยังสามารถเข้าใช้งานและตั้งค่าได้ตามปกติ
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-neutral-300 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {settings.maintenanceMode && (
                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-500/30">
                  <label className="block text-xs font-medium text-amber-800 dark:text-amber-300 mb-1.5">
                    ข้อความชี้แจงผู้ใช้งาน (Maintenance Notice Message)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.maintenanceMessage}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-950 border border-amber-300 dark:border-amber-500/40 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Feature Flags Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-500" />
                <span>การอนุญาตและพฤติกรรมหน้าต่าง Launcher</span>
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                        เปิดใช้งานโหมดทดสอบ / บัญชีตัวอย่าง (Test & Demo Mode)
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        settings.demoModeEnabled
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                      }`}>
                        {settings.demoModeEnabled ? 'เปิด (Testing)' : 'ปิด (Production)'}
                      </span>
                      {process.env.NEXT_PUBLIC_DEMO_MODE === 'false' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                          ล็อกปิดถาวรโดย ENV
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                      เมื่อเปิด: จะแสดงกล่องบัญชีทดสอบ (Demo Users) บนหน้า Login และปุ่มสลับบทบาท (Role Switcher) บน Navbar | เมื่อปิด: จะซ่อนบัญชีทดสอบทั้งหมดและเข้าสู่โหมดใช้งานจริง (Production) พร้อมบล็อกรหัสผ่าน Demo ในระดับ API
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={process.env.NEXT_PUBLIC_DEMO_MODE === 'false'}
                    checked={settings.demoModeEnabled}
                    onChange={(e) => handleChange('demoModeEnabled', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 disabled:opacity-50"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                      อนุญาตให้ผู้ใช้ปรับแต่งรายการโปรดส่วนบุคคล (Personal Favorites)
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                      หากเปิดใช้งาน นักศึกษาและอาจารย์จะสามารถคลิกปุ่มดินสอในเมนู 9 จุด เพื่อจัดลำดับหรือปักหมุดบริการโปรดของตนเองได้
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowUserCustomFavorites}
                    onChange={(e) => handleChange('allowUserCustomFavorites', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                      แสดงปุ่มคัดลอกโค้ดสคริปต์ 9-Dots Launcher (Embed Snippet Button)
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                      แสดงปุ่มสำหรับให้นักพัฒนาระบบภายในคัดลอกโค้ดสคริปต์ไปแปะบนเว็บระบบลูก
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showEmbedWidgetSnippet}
                    onChange={(e) => handleChange('showEmbedWidgetSnippet', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Keycloak SSO */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                <span>การเชื่อมต่อ Keycloak Identity Provider (OIDC / OAuth2)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Keycloak Realm กลาง
                  </label>
                  <input
                    type="text"
                    value={settings.keycloakRealm}
                    onChange={(e) => handleChange('keycloakRealm', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Realm ที่ใช้จัดการกลุ่มผู้ใช้และสิทธิ์ OIDC เช่น <code>cric-college</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    ระยะเวลาหมดอายุของ Session (นาที)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value) || 120)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    เวลาที่ให้ Session คงอยู่ก่อนต้อง Refresh Token หรือ Re-authenticate
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  โดเมนอีเมลที่อนุญาตเข้าใช้งาน (Allowed Email Domains)
                </label>
                <input
                  type="text"
                  value={settings.allowedEmailDomains}
                  onChange={(e) => handleChange('allowedEmailDomains', e.target.value)}
                  placeholder="cric.ac.th, student.cric.ac.th"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  คั่นด้วยเครื่องหมายจุลภาค (Comma) เช่น <code>cric.ac.th, student.cric.ac.th</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={loadSettings}
            className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>คืนค่าเดิม</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าระบบ'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
