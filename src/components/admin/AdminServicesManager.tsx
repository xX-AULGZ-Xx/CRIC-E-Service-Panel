'use client';

import React, { useState, useEffect, useRef } from 'react';
import ServiceIcon from '@/components/portal/ServiceIcon';
import { ServiceItem, CategoryItem, UserRole } from '@/types/service';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Globe, 
  Upload, 
  Star, 
  Check, 
  AlertCircle,
  ExternalLink,
  Search,
  Layers,
  Image as ImageIcon,
  X,
  Link2,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface PresetIcon {
  label: string;
  category: 'cric' | 'google' | 'tools';
  url: string;
  badge?: string;
}

const PRESET_ICONS: PresetIcon[] = [
  // 🏛️ ระบบวิทยาลัย CRIC
  { label: 'ตราสัญลักษณ์ วก.เชียงราย (CRIC)', category: 'cric', url: '/uploads/cric-logo-borderless.png', badge: 'Official' },
  { label: 'ระบบแผนงานและโครงการ (CRIC Plan)', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/8899/8899687.png', badge: 'Plan' },
  { label: 'ระบบลงทะเบียนและเกียรติบัตร (RCMS)', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/3135/3135763.png', badge: 'RCMS' },
  { label: 'ระบบงานทะเบียนวัดผล (E-Registrar)', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/3429/3429284.png', badge: 'Reg' },
  { label: 'ระบบห้องสมุดดิจิทัล (E-Library)', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png' },
  { label: 'ระบบแจ้งซ่อมบำรุง (IT Helpdesk)', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/4233/4233830.png' },
  { label: 'ระบบประกันคุณภาพ (SAR / QA)', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png' },
  { label: 'งานการเงินและบัญชีสถานศึกษา', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png' },
  { label: 'งานกิจการนักเรียนนักศึกษา', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/3135/3135810.png' },
  { label: 'ระบบยืนยันตัวตนกลาง (CRIC Central SSO)', category: 'cric', url: 'https://cdn-icons-png.flaticon.com/512/9446/9446864.png', badge: 'SSO' },

  // 🌐 Google Workspace
  { label: 'Google Gmail', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/732/732200.png' },
  { label: 'Google Drive', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965300.png' },
  { label: 'Google Classroom', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965278.png' },
  { label: 'Google Docs', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965280.png' },
  { label: 'Google Sheets', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965313.png' },
  { label: 'Google Slides', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965316.png' },
  { label: 'Google Forms', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965293.png' },
  { label: 'Google Calendar', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/5968/5968499.png' },
  { label: 'Google Meet', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965306.png' },
  { label: 'Google Chat', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965275.png' },
  { label: 'Google Keep', category: 'google', url: 'https://cdn-icons-png.flaticon.com/512/2965/2965304.png' },

  // ⚡ เครื่องมือยอดนิยม & AI
  { label: 'Gemini AI', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/11865/11865326.png', badge: 'AI' },
  { label: 'ChatGPT AI', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/12222/12222560.png', badge: 'AI' },
  { label: 'Canva Design', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/5968/5968770.png' },
  { label: 'Microsoft 365 / Office', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/732/732221.png' },
  { label: 'Zoom Video Conferencing', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/4401/4401470.png' },
  { label: 'YouTube Learning', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
  { label: 'GitHub Repository', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/733/733553.png' },
  { label: 'อินเทอร์เน็ต / Wi-Fi วิทยาลัย', category: 'tools', url: 'https://cdn-icons-png.flaticon.com/512/93/93158.png' },
];

const AVAILABLE_ROLES: { role: UserRole; label: string; icon: string; short: string }[] = [
  { role: 'guest', label: 'บุคคลทั่วไป / สาธารณะ', icon: '🌐', short: 'guest' },
  { role: 'student', label: 'นักศึกษา', icon: '🎓', short: 'student' },
  { role: 'teacher', label: 'ครู / ผู้สอน', icon: '👨‍🏫', short: 'teacher' },
  { role: 'head_dept', label: 'หัวหน้าแผนก/งาน', icon: '📋', short: 'head_dept' },
  { role: 'planning_officer', label: 'เจ้าหน้าที่งานวางแผนฯ', icon: '📊', short: 'planning_officer' },
  { role: 'deputy_director', label: 'รองผู้อำนวยการ', icon: '🏛️', short: 'deputy_director' },
  { role: 'director', label: 'ผู้อำนวยการ', icon: '🎖️', short: 'director' },
  { role: 'staff', label: 'บุคลากร / จนท.', icon: '💼', short: 'staff' },
  { role: 'admin', label: 'ผู้ดูแลระบบ', icon: '🛡️', short: 'admin' },
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

  // Logo Selector Enhancements
  const [logoMode, setLogoMode] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [iconCategory, setIconCategory] = useState<'all' | 'cric' | 'google' | 'tools'>('all');
  const [iconSearch, setIconSearch] = useState('');
  const [imgError, setImgError] = useState(false);

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
    setIconUrl('');
    setCategoryId('');
    setAllowedRoles(['student', 'teacher', 'staff', 'admin']);
    setOpenInNewTab(true);
    setIsActive(true);
    setIsDefaultFavorite(false);
    setMessage(null);
    setLogoMode('upload');
    setImgError(false);
    setIconSearch('');
    setIconCategory('all');
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingId(service.id);
    setTitle(service.title);
    setDescription(service.description || '');
    setUrl(service.url);
    setIconUrl(service.iconUrl || '');
    setCategoryId(service.categoryId || '');
    setAllowedRoles(service.allowedRoles as UserRole[]);
    setOpenInNewTab(service.openInNewTab);
    setIsActive(service.isActive);
    setIsDefaultFavorite(service.isDefaultFavorite);
    setMessage(null);
    setLogoMode(service.iconUrl?.startsWith('http') && !service.iconUrl.includes('flaticon') ? 'url' : 'presets');
    setImgError(false);
    setIconSearch('');
    setIconCategory('all');
    setModalOpen(true);
  };

  const processFileUpload = async (file: File) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/svg+xml',
      'image/webp',
      'image/gif',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ];
    if (!allowed.includes(file.type.toLowerCase())) {
      alert('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ PNG, JPG, WebP, SVG, GIF และ ICO');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์เกินกำหนด (สูงสุดไม่เกิน 5MB)');
      return;
    }

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
        setImgError(false);
      } else {
        alert(data.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่ออัปโหลดไฟล์');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileUpload(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim() || !url.trim()) {
      setMessage({ text: 'กรุณากรอกชื่อบริการและ URL ปลายทาง', type: 'error' });
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setMessage({ text: msg, type: 'error' });
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      alert(msg);
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
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            รายการบริการทั้งหมดในระบบ
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            กำหนดค่าบริการ, ไอคอน, สิทธิ์การเข้าถึง (RBAC), และรายการโปรดเริ่มต้น
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มบริการใหม่</span>
        </button>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อบริการ, URL..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
          />
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400 self-end sm:self-auto">
          ทั้งหมด <span className="font-semibold text-neutral-800 dark:text-white">{filteredServices.length}</span> บริการ
        </div>
      </div>

      {/* Service Table / Cards */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm">กำลังโหลดข้อมูลบริการ...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <Layers className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-neutral-700 dark:text-neutral-300">ยังไม่มีบริการในระบบ</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            กดปุ่ม &quot;เพิ่มบริการใหม่&quot; ด้านบนเพื่อเริ่มต้นสร้างบริการเข้าใช้งานภายในวิทยาลัย
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มบริการแรก
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3.5">บริการ (Service)</th>
                <th className="px-4 py-3.5">URL เป้าหมาย</th>
                <th className="px-4 py-3.5">สิทธิ์การเข้าถึง (RBAC)</th>
                <th className="px-4 py-3.5 text-center">สถานะ</th>
                <th className="px-4 py-3.5 text-center">Favorites เริ่มต้น</th>
                <th className="px-4 py-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredServices.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                  {/* Service Name & Icon */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/60 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        <ServiceIcon src={srv.iconUrl} className="w-8 h-8 object-contain" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                          {srv.title}
                        </div>
                        {srv.description && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{srv.description}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Target URL */}
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300 font-mono text-xs">
                    <a
                      href={srv.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1 max-w-[200px] truncate"
                    >
                      {srv.url}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>

                  {/* RBAC Roles */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {srv.allowedRoles.length === 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          ทุกคน (Public)
                        </span>
                      ) : (
                        srv.allowedRoles.map((role) => (
                          <span
                            key={role}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                              role === 'guest'
                                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                                : role === 'admin'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                                : role === 'teacher'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                : role === 'staff'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {role === 'guest' ? '🌐 บุคคลทั่วไป' : role}
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
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          srv.isActive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-neutral-400'
                        }`}
                      />
                      {srv.isActive ? 'เปิดใช้งาน' : 'ปิด'}
                    </span>
                  </td>

                  {/* Default Favorite */}
                  <td className="px-4 py-3 text-center">
                    {srv.isDefaultFavorite ? (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto" />
                    ) : (
                      <span className="text-neutral-400 dark:text-neutral-600">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(srv)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="แก้ไขบริการ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(srv.id, srv.title)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-[#1a1b1e] border border-neutral-200 dark:border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {editingId ? 'แก้ไขข้อมูลบริการ' : 'เพิ่มบริการใหม่ในระบบ'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Service Title */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  ชื่อบริการ (Service Title) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ระบบสารสนเทศทะเบียนนักศึกษา (E-Registrar)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  คำอธิบายสั้นๆ (Description)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น ลงทะเบียนเรียน ตรวจสอบผลการเรียน ตารางสอน"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  URL ปลายทาง (Target URL / SSO Endpoint) *
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://reg.cric.ac.th"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
                />
              </div>

              {/* Icon Selection & Upload Section */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    โลโก้และไอคอนบริการ (Service Icon & Logo) *
                  </label>
                  {iconUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setIconUrl('');
                        setImgError(false);
                      }}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ลบรูป / รีเซ็ต</span>
                    </button>
                  )}
                </div>

                {/* Live Card Simulation Preview */}
                <div className="p-3 bg-slate-50/90 dark:bg-neutral-900/90 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 p-2.5 flex items-center justify-center shrink-0 shadow-xs relative group overflow-hidden">
                      {iconUrl && !imgError ? (
                        <img
                          src={iconUrl}
                          alt="Icon Preview"
                          className="w-9 h-9 object-contain transition-transform group-hover:scale-110"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-400">
                          {imgError ? (
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                          ) : (
                            <ImageIcon className="w-6 h-6" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-800 dark:text-white truncate">
                        {title || 'ชื่อบริการตัวอย่าง'}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {categories.find((c) => c.id === categoryId)?.name || 'หมวดหมู่บริการ'}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ตัวอย่างแสดงผลจริงบนหน้าระบบ (Live Preview)</span>
                      </div>
                    </div>
                  </div>

                  {imgError && (
                    <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-medium shrink-0">
                      ⚠️ โหลดรูปไม่สำเร็จ
                    </span>
                  )}
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setLogoMode('upload')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                      logoMode === 'upload'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดไฟล์รูปภาพ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoMode('presets')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                      logoMode === 'presets'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ไอคอนมาตรฐาน ({PRESET_ICONS.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoMode('url')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                      logoMode === 'url'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>ระบุ URL ตรง</span>
                  </button>
                </div>

                {/* Tab 1: Drag & Drop File Upload */}
                {logoMode === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/x-icon"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full p-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[0.99]'
                          : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-neutral-900/50'
                      }`}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            กำลังอัปโหลดและประมวลผลรูปภาพ...
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            ลากและวางไฟล์รูปภาพที่นี่ หรือคลิกเพื่อเลือกไฟล์
                          </span>
                          <span className="text-[11px] text-neutral-400 mt-1">
                            รองรับไฟล์ PNG, SVG, WebP, JPG, ICO (แนะนำ 1:1 พื้นหลังโปร่งใส ไม่เกิน 5MB)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Categorized Preset Icons Catalog */}
                {logoMode === 'presets' && (
                  <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-neutral-900/70 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      {/* Search in presets */}
                      <div className="relative w-full sm:flex-1">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={iconSearch}
                          onChange={(e) => setIconSearch(e.target.value)}
                          placeholder="ค้นหาไอคอน (เช่น Google, Plan, RCMS, AI)..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {iconSearch && (
                          <button
                            type="button"
                            onClick={() => setIconSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {[
                          { id: 'all', label: 'ทั้งหมด' },
                          { id: 'cric', label: 'วิทยาลัย' },
                          { id: 'google', label: 'Google' },
                          { id: 'tools', label: 'AI & เครื่องมือ' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setIconCategory(cat.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                              iconCategory === cat.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto pr-1">
                      {PRESET_ICONS.filter((item) => {
                        const matchCat = iconCategory === 'all' || item.category === iconCategory;
                        const matchSearch =
                          !iconSearch ||
                          item.label.toLowerCase().includes(iconSearch.toLowerCase());
                        return matchCat && matchSearch;
                      }).map((preset) => {
                        const isSelected = iconUrl === preset.url;
                        return (
                          <button
                            type="button"
                            key={preset.label}
                            onClick={() => {
                              setIconUrl(preset.url);
                              setImgError(false);
                            }}
                            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 scale-[1.03] shadow-xs'
                                : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 hover:border-neutral-400 dark:hover:border-neutral-500 hover:scale-[1.02]'
                            }`}
                            title={preset.label}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-7 h-7 object-contain drop-shadow-xs"
                            />
                            <span className="text-[10px] text-neutral-700 dark:text-neutral-300 font-medium truncate w-full px-0.5">
                              {preset.label}
                            </span>
                            {preset.badge && (
                              <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                {preset.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Direct URL Input */}
                {logoMode === 'url' && (
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-neutral-900/70 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      กรอกหรือวางลิงก์ URL ของรูปภาพโดยตรง:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link2 className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={iconUrl}
                          onChange={(e) => {
                            setIconUrl(e.target.value);
                            setImgError(false);
                          }}
                          placeholder="https://... หรือ /uploads/..."
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      {iconUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setIconUrl('');
                            setImgError(false);
                          }}
                          className="px-2.5 py-2 rounded-xl text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 transition"
                        >
                          ล้างค่า
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      💡 แนะนำ: ใช้ลิงก์ภาพที่มี HTTPS และพื้นหลังโปร่งใส (Transparent PNG หรือ SVG) เพื่อความสวยงามทั้งในธีมสว่างและมืด
                    </p>
                  </div>
                )}
              </div>

              {/* Role Permissions (RBAC) */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  กลุ่มผู้ใช้ที่มีสิทธิ์เข้าถึง (RBAC Allowed Roles)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {AVAILABLE_ROLES.map(({ role, label, icon }) => (
                    <label
                      key={role}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        allowedRoles.includes(role)
                          ? role === 'guest'
                            ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-800 dark:text-teal-200 font-medium shadow-sm'
                            : 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-white font-medium shadow-sm'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                      title={label}
                    >
                      <input
                        type="checkbox"
                        checked={allowedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                      />
                      <span>{icon}</span>
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options: Active, Default Favorite, New Tab */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                  <span>เปิดใช้งานบริการนี้ทันที (Active)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultFavorite}
                    onChange={(e) => setIsDefaultFavorite(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                  <span>ปักหมุดในรายการโปรดเริ่มต้น (&quot;Your favorites&quot; default)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                  <span>เปิดบริการในแท็บใหม่ (Open in new window / tab)</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all active:scale-[0.98]"
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
