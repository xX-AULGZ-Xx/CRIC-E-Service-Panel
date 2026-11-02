'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MaintenanceScreen from '@/components/portal/MaintenanceScreen';
import { ServiceItem, UserSession, SystemSetting } from '@/types/service';
import { 
  Star, 
  ExternalLink, 
  Code, 
  Sparkles, 
  Layers, 
  Copy, 
  Check, 
  Settings,
  Globe,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';

export default function PortalDashboard() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, srvRes, setRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/v1/services'),
        fetch('/api/v1/settings'),
      ]);
      const sessData = await sessRes.json();
      const srvData = await srvRes.json();
      const setData = await setRes.json();

      if (sessData.success) setSession(sessData.data);
      if (srvData.success) setServices(srvData.data);
      if (setData.success) setSettings(setData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleFavorite = async (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/v1/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, action: 'toggle' }),
      });
      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, isFavorite: data.isFavorite } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyEmbed = () => {
    const scriptTag = `<script src="${window.location.origin}/widget/launcher.js" defer></script>`;
    navigator.clipboard.writeText(scriptTag);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  // If in maintenance mode and user is not an Admin, display Maintenance Screen
  if (!loading && settings?.maintenanceMode && session?.currentRole !== 'admin') {
    return <MaintenanceScreen settings={settings} />;
  }

  // Filter services
  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      srv.url.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'favorites'
        ? srv.isFavorite
        : srv.category?.name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Extract distinct category names
  const categories = Array.from(
    new Set(
      services
        .map((s) => s.category?.name)
        .filter((c): c is string => Boolean(c))
    )
  );

  const favorites = services.filter((s) => s.isFavorite);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0c] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar settings={settings} onSearchChange={(q) => setSearchQuery(q)} />

      {/* Admin Maintenance Mode Notice Banner */}
      {settings?.maintenanceMode && session?.currentRole === 'admin' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400" />
            <span>
              <strong>แจ้งเตือนผู้ดูแลระบบ:</strong> ขณะนี้กำลังเปิดโหมดปิดปรับปรุงระบบ (Maintenance Mode) ผู้ใช้ทั่วไปจะไม่สามารถเข้าใช้งานหน้า Portal ได้
            </span>
            <Link
              href="/admin/settings"
              className="ml-auto underline font-semibold text-amber-800 dark:text-white hover:text-amber-900 dark:hover:text-amber-200"
            >
              แก้ไขการตั้งค่า
            </Link>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/20 border border-blue-200/60 dark:border-neutral-800 p-6 sm:p-8 backdrop-blur-sm shadow-sm transition-colors duration-200">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings?.collegeNameTh || 'CRIC Digital College Ecosystem'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              ยินดีต้อนรับ, {session?.displayName || 'ผู้ใช้งานวิทยาลัย'}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {settings?.portalSubtitle ||
                'ศูนย์รวมบริการดิจิทัลวิทยาลัย CRIC เข้าสู่ระบบเพียงครั้งเดียว (Single Sign-On) เพื่อเข้าใช้งานระบบและบริการภายในทั้งหมดได้อย่างสะดวก รวดเร็ว และปลอดภัย'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {settings?.showEmbedWidgetSnippet !== false && (
                <button
                  onClick={() => setShowEmbedModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-neutral-900/90 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-medium shadow-sm transition-all"
                >
                  <Code className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>โค้ด 9-Dots Launcher สำหรับเว็บระบบลูก</span>
                </button>
              )}

              {session?.currentRole === 'admin' && (
                <Link
                  href="/admin/services"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-all"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>จัดการบริการ & ตั้งค่า (Admin Panel)</span>
                </Link>
              )}
            </div>
          </div>

          {/* Decorative Background Blob */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Quick Favorites Section */}
        {favorites.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-neutral-700 dark:text-neutral-300 uppercase flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>บริการโปรดของคุณ (Your Favorites)</span>
              </h2>
              <span className="text-xs text-neutral-500">
                สามารถเปิดจากปุ่ม 9 จุดที่มุมขวาบนได้เช่นกัน
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {favorites.map((srv) => (
                <a
                  key={srv.id}
                  href={srv.url}
                  target={srv.openInNewTab ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="group flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-850 hover:shadow-md transition-all duration-200 text-center select-none shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 p-2 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    {srv.iconUrl ? (
                      <img src={srv.iconUrl} alt={srv.title} className="w-8 h-8 object-contain" />
                    ) : (
                      <Globe className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white line-clamp-1">
                    {srv.title}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Filter Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200 dark:border-neutral-800/80">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-transparent'
            }`}
          >
            บริการทั้งหมด ({services.length})
          </button>

          <button
            onClick={() => setSelectedCategory('favorites')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'favorites'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-transparent'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>รายการโปรด ({favorites.length})</span>
          </button>

          {categories.map((catName) => (
            <button
              key={catName}
              onClick={() => setSelectedCategory(catName)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === catName
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-transparent'
              }`}
            >
              {catName}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {selectedCategory === 'all'
                ? 'รายการบริการที่พร้อมใช้งาน'
                : selectedCategory === 'favorites'
                ? 'รายการโปรดของคุณ'
                : `หมวดหมู่: ${selectedCategory}`}
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              พบ {filteredServices.length} บริการ
            </span>
          </div>

          {loading ? (
            <div className="py-24 text-center text-neutral-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">กำลังโหลดบริการดิจิทัล...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 shadow-sm">
              <Layers className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">ไม่พบบริการในหมวดหมู่นี้</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {session?.currentRole === 'admin'
                  ? 'คุณสามารถเพิ่มบริการใหม่ได้ที่หน้า Admin Management'
                  : 'ยังไม่มีบริการที่ตรงกับเงื่อนไขการค้นหาในบทบาทของคุณ'}
              </p>
              {session?.currentRole === 'admin' && (
                <Link
                  href="/admin/services"
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5" />
                  ไปที่หน้า Admin Setup
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 hover:border-blue-400 dark:hover:border-neutral-700/80 hover:shadow-lg transition-all duration-200 shadow-sm"
                >
                  <div>
                    {/* Header: Icon, Favorite Star, Category */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700/60 p-2.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {service.iconUrl ? (
                          <img
                            src={service.iconUrl}
                            alt={service.title}
                            className="w-9 h-9 object-contain"
                          />
                        ) : (
                          <Globe className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => toggleFavorite(service.id, e)}
                          title={service.isFavorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                          className="p-2 rounded-full text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              service.isFavorite ? 'text-amber-500 fill-amber-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {service.title}
                    </h3>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                      {service.description || 'บริการดิจิทัลภายในวิทยาลัย CRIC สำหรับบุคลากรและนักศึกษา'}
                    </p>
                  </div>

                  {/* Footer: Roles Badge & Launch Button */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {service.allowedRoles.slice(0, 2).map((role) => (
                        <span
                          key={role}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        >
                          {role}
                        </span>
                      ))}
                      {service.allowedRoles.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          +{service.allowedRoles.length - 2}
                        </span>
                      )}
                    </div>

                    <a
                      href={service.url}
                      target={service.openInNewTab ? '_blank' : '_self'}
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-500/30 text-xs font-semibold transition-all group-hover:scale-102"
                    >
                      <span>เข้าใช้งาน</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal: Embed Script Snippet */}
        {showEmbedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-[#1a1b1e] border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 space-y-4 shadow-2xl text-neutral-800 dark:text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <span>วิธีนำปุ่ม 9 จุดไปแปะบนเว็บระบบลูก</span>
                </h3>
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                คัดลอกโค้ดสคริปต์นี้ไปวางไว้ก่อนปิดแท็ก <code className="text-blue-600 dark:text-blue-400 font-mono">&lt;/body&gt;</code> ในเว็บแอปพลิเคชันระบบภายในใดๆ ของวิทยาลัย ปุ่ม 9 จุด (App Launcher) สไตล์ Google จะปรากฏที่มุมขวาบนของระบบนั้นโดยอัตโนมัติ
              </p>

              <div className="relative">
                <pre className="p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                  {`<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget/launcher.js" defer></script>`}
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                  title="คัดลอกโค้ด"
                >
                  {copiedEmbed ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-sm"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121314] py-6 px-4 sm:px-8 text-neutral-500 dark:text-neutral-400 text-xs mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p>{settings?.footerText || '© 2026 CRIC College. All rights reserved.'}</p>
            <p className="text-neutral-500 dark:text-neutral-500 text-[11px] mt-0.5">
              {settings?.collegeNameTh} ({settings?.collegeNameEn})
            </p>
          </div>

          <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400">
            {settings?.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <span>{settings.contactEmail}</span>
              </a>
            )}
            {settings?.contactPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <span>{settings.contactPhone}</span>
              </span>
            )}
            {settings?.helpdeskUrl && (
              <a
                href={settings.helpdeskUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Helpdesk</span>
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
