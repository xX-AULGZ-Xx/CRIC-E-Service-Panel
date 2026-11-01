'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ServiceItem, CategoryItem, UserRole } from '@/types/service';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Globe, 
  Upload, 
  Star, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  ExternalLink,
  Search,
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

const PRESET_ICONS = [
  { label: 'Google Gmail', url: 'https://cdn-icons-png.flaticon.com/512/732/732200.png' },
  { label: 'Google Drive', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965300.png' },
  { label: 'Google Classroom', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965278.png' },
  { label: 'Google Docs', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965280.png' },
  { label: 'Google Sheets', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965313.png' },
  { label: 'Google Slides', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965316.png' },
  { label: 'Google Calendar', url: 'https://cdn-icons-png.flaticon.com/512/5968/5968499.png' },
  { label: 'Google Meet', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965306.png' },
  { label: 'Gemini AI', url: 'https://cdn-icons-png.flaticon.com/512/11865/11865326.png' },
  { label: 'Library Books', url: 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png' },
  { label: 'Student Portal', url: 'https://cdn-icons-png.flaticon.com/512/3429/3429284.png' },
  { label: 'IT Helpdesk', url: 'https://cdn-icons-png.flaticon.com/512/4233/4233830.png' },
];

export default function AdminServicesManager() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [allowedRoles, setAllowedRoles] = useState<UserRole[]>(['student', 'teacher', 'staff', 'admin']);
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isDefaultFavorite, setIsDefaultFavorite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        fetch('/api/v1/services?all=true'),
        fetch('/api/v1/categories'),
      ]);
      const srvData = await srvRes.json();
      const catData = await catRes.json();

      if (srvData.success) setServices(srvData.data);
      if (catData.success) setCategories(catData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setUrl('');
    setIconUrl(PRESET_ICONS[0].url);
    setCategoryId(categories[0]?.id || '');
    setAllowedRoles(['student', 'teacher', 'staff', 'admin']);
    setOpenInNewTab(true);
    setIsActive(true);
    setIsDefaultFavorite(false);
    setModalOpen(true);
    setMessage(null);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingId(service.id);
    setTitle(service.title);
    setDescription(service.description || '');
    setUrl(service.url);
    setIconUrl(service.iconUrl);
    setCategoryId(service.categoryId || '');
    setAllowedRoles(service.allowedRoles as UserRole[]);
    setOpenInNewTab(service.openInNewTab);
    setIsActive(service.isActive);
    setIsDefaultFavorite(service.isDefaultFavorite);
    setModalOpen(true);
    setMessage(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setIconUrl(data.url);
        setMessage({ text: 'อัปโหลดไอคอนสำเร็จ', type: 'success' });
      } else {
        setMessage({ text: data.error || 'อัปโหลดไม่สำเร็จ', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !iconUrl) {
      setMessage({ text: 'กรุณากรอกชื่อบริการ, URL และเลือกไอคอนให้ครบถ้วน', type: 'error' });
      return;
    }

    try {
      const payload = {
        title,
        description,
        url,
        iconUrl,
        categoryId: categoryId || null,
        allowedRoles,
        openInNewTab,
        isActive,
        isDefaultFavorite,
      };

      const res = await fetch(
        editingId ? `/api/v1/services/${editingId}` : '/api/v1/services',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();
      if (result.success) {
        setMessage({ text: editingId ? 'อัปเดตบริการสำเร็จ' : 'เพิ่มบริการใหม่สำเร็จ', type: 'success' });
        setTimeout(() => {
          setModalOpen(false);
          loadData();
        }, 600);
      } else {
        setMessage({ text: result.error || 'เกิดข้อผิดพลาด', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ยืนยันการลบบริการ "${name}" ออกจากระบบ?`)) return;

    try {
      const res = await fetch(`/api/v1/services/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(result.error || 'ลบไม่สำเร็จ');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleRole = (role: UserRole) => {
    if (allowedRoles.includes(role)) {
      setAllowedRoles(allowedRoles.filter((r) => r !== role));
    } else {
      setAllowedRoles([...allowedRoles, role]);
    }
  };

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
    s.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            รายการบริการทั้งหมดในระบบ
          </h2>
          <p className="text-xs text-neutral-400">
            กำหนดค่าบริการ, ไอคอน, สิทธิ์การเข้าถึง (RBAC), และรายการโปรดเริ่มต้น
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มบริการใหม่</span>
        </button>
      </div>

        {/* Search Bar & Summary Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาตามชื่อบริการ, URL..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="text-xs text-neutral-400 self-end sm:self-auto">
            ทั้งหมด <span className="font-semibold text-white">{filteredServices.length}</span> บริการ
          </div>
        </div>

        {/* Service Table / Cards */}
        {loading ? (
          <div className="py-20 text-center text-neutral-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-sm">กำลังโหลดข้อมูลบริการ...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <Layers className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-neutral-300">ยังไม่มีบริการในระบบ</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              กดปุ่ม &quot;เพิ่มบริการใหม่&quot; ด้านบนเพื่อเริ่มต้นสร้างบริการเข้าใช้งานภายในวิทยาลัย
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มบริการแรก
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3.5">บริการ (Service)</th>
                  <th className="px-4 py-3.5">URL เป้าหมาย</th>
                  <th className="px-4 py-3.5">สิทธิ์การเข้าถึง (RBAC)</th>
                  <th className="px-4 py-3.5 text-center">สถานะ</th>
                  <th className="px-4 py-3.5 text-center">Favorites เริ่มต้น</th>
                  <th className="px-4 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredServices.map((srv) => (
                  <tr key={srv.id} className="hover:bg-neutral-800/40 transition-colors">
                    {/* Service Name & Icon */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/60 p-1 flex items-center justify-center shrink-0">
                          {srv.iconUrl ? (
                            <img src={srv.iconUrl} alt={srv.title} className="w-8 h-8 object-contain" />
                          ) : (
                            <Globe className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-1.5">
                            {srv.title}
                          </div>
                          {srv.description && (
                            <div className="text-xs text-neutral-400 line-clamp-1">{srv.description}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target URL */}
                    <td className="px-4 py-3 text-neutral-300 font-mono text-xs">
                      <a
                        href={srv.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-400 hover:underline flex items-center gap-1 max-w-[200px] truncate"
                      >
                        {srv.url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>

                    {/* RBAC Roles */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {srv.allowedRoles.length === 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            ทุกคน (Public)
                          </span>
                        ) : (
                          srv.allowedRoles.map((role) => (
                            <span
                              key={role}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                role === 'admin'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : role === 'teacher'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : role === 'staff'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          srv.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            srv.isActive ? 'bg-emerald-400' : 'bg-neutral-500'
                          }`}
                        />
                        {srv.isActive ? 'เปิดใช้งาน' : 'ปิด'}
                      </span>
                    </td>

                    {/* Default Favorite */}
                    <td className="px-4 py-3 text-center">
                      {srv.isDefaultFavorite ? (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 mx-auto" />
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(srv)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="แก้ไขบริการ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id, srv.title)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                          title="ลบบริการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Add / Edit Service */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-[#1a1b1e] border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? 'แก้ไขข้อมูลบริการ' : 'เพิ่มบริการใหม่ในระบบ'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
                {message && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      message.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Service Title */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    ชื่อบริการ (Service Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น ระบบสารสนเทศทะเบียนนักศึกษา (E-Registrar)"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    คำอธิบายสั้นๆ (Description)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="เช่น ลงทะเบียนเรียน ตรวจสอบผลการเรียน ตารางสอน"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    URL ปลายทาง (Target URL / SSO Endpoint) *
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://reg.cric.ac.th"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Icon Selection & Upload */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    ไอคอนบริการ (Service Icon) *
                  </label>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-700 p-2 flex items-center justify-center shrink-0">
                      {iconUrl ? (
                        <img src={iconUrl} alt="Preview" className="w-10 h-10 object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ / SVG'}</span>
                      </button>
                      <p className="text-[11px] text-neutral-500">
                        หรือเลือกจากชุดไอคอนมาตรฐานด้านล่าง:
                      </p>
                    </div>
                  </div>

                  {/* Preset Icons Carousel / Grid */}
                  <div className="grid grid-cols-6 gap-2 p-2 bg-neutral-900/80 rounded-2xl border border-neutral-800 max-h-36 overflow-y-auto">
                    {PRESET_ICONS.map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setIconUrl(preset.url)}
                        className={`p-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                          iconUrl === preset.url
                            ? 'bg-blue-600/30 border border-blue-500 scale-105'
                            : 'hover:bg-neutral-800 border border-transparent'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-6 h-6 object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Permissions (RBAC) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    กลุ่มผู้ใช้ที่มีสิทธิ์เข้าถึง (RBAC Allowed Roles)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['student', 'teacher', 'staff', 'admin'] as UserRole[]).map((role) => (
                      <label
                        key={role}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          allowedRoles.includes(role)
                            ? 'bg-blue-600/20 border-blue-500/60 text-white font-medium'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={allowedRoles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 bg-neutral-800 border-neutral-700"
                        />
                        <span className="capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Options: Active, Default Favorite, New Tab */}
                <div className="pt-2 border-t border-neutral-800 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-neutral-900 border-neutral-700"
                    />
                    <span>เปิดใช้งานบริการนี้ทันที (Active)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefaultFavorite}
                      onChange={(e) => setIsDefaultFavorite(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-neutral-900 border-neutral-700"
                    />
                    <span>ปักหมุดในรายการโปรดเริ่มต้น (&quot;Your favorites&quot; default)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-neutral-900 border-neutral-700"
                    />
                    <span>เปิดบริการในแท็บใหม่ (Open in new window / tab)</span>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30"
                  >
                    {editingId ? 'บันทึกการแก้ไข' : 'สร้างบริการ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
