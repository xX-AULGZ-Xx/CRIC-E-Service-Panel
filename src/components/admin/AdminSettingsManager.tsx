'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SystemSetting } from '@/types/service';
import { 
  Building2, 
  ShieldCheck, 
  Sliders, 
  Upload, 
  Save, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Wrench,
  Globe,
  Mail,
  Phone,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function AdminSettingsManager() {
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'behavior' | 'security'>('branding');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้', type: 'error' });
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
        setMessage({ text: 'อัปโหลดโลโก้สำเร็จ อย่าลืมกดบันทึกการตั้งค่า', type: 'success' });
      } else {
        setMessage({ text: data.error || 'อัปโหลดไม่สำเร็จ', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setUploadingLogo(false);
    }
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

      const result = await res.json();
      if (result.success) {
        setMessage({ text: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว', type: 'success' });
        setSettings(result.data);
      } else {
        setMessage({ text: result.error || 'บันทึกไม่สำเร็จ', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">กำลังโหลดการตั้งค่าระบบ...</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'branding'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>ข้อมูลวิทยาลัย & แบรนด์ดิ้ง</span>
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'behavior'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>พฤติกรรมหน้า Portal & โหมดปิดปรับปรุง</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'security'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ความปลอดภัย & SSO Keycloak</span>
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Branding & College Info */}
        {activeTab === 'branding' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>ข้อมูลชื่อและสถาบัน</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    ชื่อวิทยาลัย (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={settings.collegeNameTh}
                    onChange={(e) => handleChange('collegeNameTh', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    ชื่อวิทยาลัย (ภาษาอังกฤษ)
                  </label>
                  <input
                    type="text"
                    value={settings.collegeNameEn}
                    onChange={(e) => handleChange('collegeNameEn', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    ชื่อระบบ Portal (Header Title)
                  </label>
                  <input
                    type="text"
                    value={settings.portalTitle}
                    onChange={(e) => handleChange('portalTitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    คำอธิบายสโลแกน (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={settings.portalSubtitle}
                    onChange={(e) => handleChange('portalSubtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="pt-4 border-t border-neutral-800">
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  โลโก้วิทยาลัย / ตราสถาบัน (Logo)
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 p-2 flex items-center justify-center shrink-0">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="College Logo"
                        className="w-12 h-12 object-contain"
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
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 inline-flex items-center gap-1.5"
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
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <span>การติดต่อและศูนย์ช่วยเหลือ (Helpdesk & Contact)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    อีเมลติดต่อฝ่าย IT / สนับสนุน
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail || ''}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="support@cric.ac.th"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={settings.contactPhone || ''}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="02-123-4567"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    URL ศูนย์ช่วยเหลือ (Helpdesk URL)
                  </label>
                  <input
                    type="url"
                    value={settings.helpdeskUrl || ''}
                    onChange={(e) => handleChange('helpdeskUrl', e.target.value)}
                    placeholder="https://helpdesk.cric.ac.th"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  ข้อความ Footer ลิขสิทธิ์ท้ายหน้าเว็บ
                </label>
                <input
                  type="text"
                  value={settings.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                ? 'bg-amber-950/20 border-amber-500/50'
                : 'bg-neutral-900/60 border-neutral-800'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wrench className={`w-5 h-5 ${settings.maintenanceMode ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <h3 className="text-base font-semibold text-white">
                      โหมดปิดปรับปรุงระบบชั่วคราว (Maintenance Mode)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400">
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
                  <div className="w-12 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {settings.maintenanceMode && (
                <div className="mt-4 pt-4 border-t border-amber-500/30">
                  <label className="block text-xs font-medium text-amber-300 mb-1.5">
                    ข้อความชี้แจงผู้ใช้งาน (Maintenance Notice Message)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.maintenanceMessage}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-amber-500/40 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Feature Flags Box */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <span>การอนุญาตและพฤติกรรมหน้าต่าง Launcher</span>
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-sm font-medium text-white block">
                      อนุญาตให้ผู้ใช้ปรับแต่งรายการโปรดส่วนบุคคล (Personal Favorites)
                    </span>
                    <span className="text-xs text-neutral-400 block">
                      หากเปิดใช้งาน นักศึกษาและอาจารย์จะสามารถคลิกปุ่มดินสอในเมนู 9 จุด เพื่อจัดลำดับหรือปักหมุดบริการโปรดของตนเองได้
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowUserCustomFavorites}
                    onChange={(e) => handleChange('allowUserCustomFavorites', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-neutral-900 border-neutral-700"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-sm font-medium text-white block">
                      แสดงปุ่มคัดลอกโค้ดสคริปต์ 9-Dots Launcher (Embed Snippet Button)
                    </span>
                    <span className="text-xs text-neutral-400 block">
                      แสดงปุ่มสำหรับให้นักพัฒนาระบบภายในคัดลอกโค้ดสคริปต์ไปแปะบนเว็บระบบลูก
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showEmbedWidgetSnippet}
                    onChange={(e) => handleChange('showEmbedWidgetSnippet', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-neutral-900 border-neutral-700"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Keycloak SSO */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <span>การเชื่อมต่อ Keycloak Identity Provider (OIDC / OAuth2)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Keycloak Realm กลาง
                  </label>
                  <input
                    type="text"
                    value={settings.keycloakRealm}
                    onChange={(e) => handleChange('keycloakRealm', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Realm ที่ใช้จัดการกลุ่มผู้ใช้และสิทธิ์ OIDC เช่น <code>cric-college</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    ระยะเวลาหมดอายุของ Session (นาที)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value) || 120)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    เวลาที่ให้ Session คงอยู่ก่อนต้อง Refresh Token หรือ Re-authenticate
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  โดเมนอีเมลที่อนุญาตเข้าใช้งาน (Allowed Email Domains)
                </label>
                <input
                  type="text"
                  value={settings.allowedEmailDomains}
                  onChange={(e) => handleChange('allowedEmailDomains', e.target.value)}
                  placeholder="cric.ac.th, student.cric.ac.th"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  คั่นด้วยเครื่องหมายจุลภาค (Comma) เช่น <code>cric.ac.th, student.cric.ac.th</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={loadSettings}
            className="px-4 py-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-xs font-medium text-neutral-300 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>คืนค่าเดิม</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าระบบ'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
