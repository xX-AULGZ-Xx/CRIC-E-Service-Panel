'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Key, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ShieldAlert, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  RefreshCw,
  X,
  Lock,
  Building,
  Mail,
  User as UserIcon,
  Check,
  Globe
} from 'lucide-react';
import { UserAccount, UserRole, DivisionItem } from '@/types/service';
import { Crown, Server, Building2 } from 'lucide-react';
import PlanUserFormModal from './PlanUserFormModal';
import PlanImportModal from './PlanImportModal';

export default function AdminUsersManager() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | UserRole>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    department: '',
    role: 'student' as UserRole,
  });

  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    department: '',
    role: 'student' as UserRole,
    isActive: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        setMessage({ text: data.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้', type: 'error' });
      }
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [divisions, setDivisions] = useState<DivisionItem[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchDivisions = async () => {
    try {
      const res = await fetch('/api/v1/divisions');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDivisions(data.data);
      }
    } catch {
      // Ignore if divisions not ready
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDivisions();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (selectedRole !== 'all' && u.role !== selectedRole) return false;
      // Division filter
      if (selectedDivisionId !== 'all') {
        const hasDiv = (u.departments || []).some((d) => d.department?.divisionId === selectedDivisionId);
        if (!hasDiv) return false;
      }
      // Department filter
      if (selectedDepartmentId !== 'all') {
        const hasDept = (u.departments || []).some((d) => d.departmentId === selectedDepartmentId);
        if (!hasDept) return false;
      }
      // Status filter
      if (selectedStatus === 'active' && !u.isActive) return false;
      if (selectedStatus === 'suspended' && u.isActive) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = u.displayName.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const userMatch = u.username.toLowerCase().includes(q);
        const posMatch = u.position?.toLowerCase().includes(q) || false;
        const deptMatch = u.department?.toLowerCase().includes(q) || false;
        const assignedDeptMatch = (u.departments || []).some(
          (d) =>
            (d.department?.name || '').toLowerCase().includes(q) ||
            (d.department?.division?.name || '').toLowerCase().includes(q)
        );
        if (!nameMatch && !emailMatch && !userMatch && !posMatch && !deptMatch && !assignedDeptMatch) {
          return false;
        }
      }
      return true;
    });
  }, [users, selectedRole, selectedDivisionId, selectedDepartmentId, selectedStatus, searchQuery]);

  // Available departments based on selected division filter
  const filterDepartments = useMemo(() => {
    if (selectedDivisionId === 'all') {
      return divisions.flatMap((d) => d.departments || []);
    }
    const found = divisions.find((d) => d.id === selectedDivisionId);
    return found?.departments || [];
  }, [divisions, selectedDivisionId]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      management: users.filter((u) =>
        ['director', 'deputy_director', 'planning_officer', 'head_dept'].includes(u.role)
      ).length,
      teacher: users.filter((u) => u.role === 'teacher').length,
      staff: users.filter((u) => u.role === 'staff').length,
      student: users.filter((u) => u.role === 'student').length,
      active: users.filter((u) => u.isActive).length,
    };
  }, [users]);

  // Quick Toggle Active
  const handleToggleStatus = async (user: UserAccount) => {
    try {
      const newStatus = !user.isActive;
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
        );
        showNotification(
          `เปลี่ยนสถานะของ ${user.displayName} เป็น "${newStatus ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}" เรียบร้อยแล้ว`,
          'success'
        );
      } else {
        showNotification(data.error || 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
      }
    } catch {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  // Add User Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('สร้างผู้ใช้งานใหม่เรียบร้อยแล้ว', 'success');
        setIsAddOpen(false);
        setAddForm({
          username: '',
          email: '',
          password: '',
          displayName: '',
          department: '',
          role: 'student',
        });
        fetchUsers();
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้', 'error');
      }
    } catch {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${activeUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('แก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว', 'success');
        setIsEditOpen(false);
        setActiveUser(null);
        fetchUsers();
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาดในการแก้ไข', 'error');
      }
    } catch {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Password Reset Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${activeUser.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`รีเซ็ตรหัสผ่านของ ${activeUser.displayName} สำเร็จ`, 'success');
        setIsPasswordOpen(false);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setActiveUser(null);
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'error');
      }
    } catch {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User Submit
  const handleDeleteSubmit = async () => {
    if (!activeUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${activeUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification('ลบผู้ใช้งานเรียบร้อยแล้ว', 'success');
        setIsDeleteOpen(false);
        setActiveUser(null);
        fetchUsers();
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้', 'error');
      }
    } catch {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      showNotification('ไม่มีข้อมูลสำหรับส่งออก', 'error');
      return;
    }

    const headers = [
      'ID',
      'Username',
      'ชื่อ-นามสกุล',
      'อีเมล',
      'แผนก/สาขาวิชา',
      'บทบาท (Role)',
      'ผู้ให้บริการ (Provider)',
      'สถานะ',
      'เข้าสู่ระบบล่าสุด',
      'วันที่สร้าง',
    ];

    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.username}"`,
      `"${u.displayName}"`,
      `"${u.email}"`,
      `"${u.department || '-'}"`,
      `"${u.role}"`,
      `"${u.authProvider}"`,
      `"${u.isActive ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('th-TH') : '-'}"`,
      `"${new Date(u.createdAt).toLocaleString('th-TH')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cric_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('ส่งออกไฟล์ CSV สำเร็จ', 'success');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            <span>Admin</span>
          </span>
        );
      case 'director':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            <span>ผู้อำนวยการ</span>
          </span>
        );
      case 'deputy_director':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
            <Briefcase className="w-3 h-3" />
            <span>รองผู้อำนวยการ</span>
          </span>
        );
      case 'planning_officer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Briefcase className="w-3 h-3" />
            <span>งานวางแผนฯ</span>
          </span>
        );
      case 'head_dept':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Crown className="w-3 h-3" />
            <span>หัวหน้าแผนก/งาน</span>
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <GraduationCap className="w-3 h-3" />
            <span>ครู / ผู้สอน</span>
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Briefcase className="w-3 h-3" />
            <span>บุคลากร (Staff)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <UserCheck className="w-3 h-3" />
            <span>นักศึกษา</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">ผู้ใช้ทั้งหมด</div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-xs text-rose-500">ผู้ดูแลระบบ</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.admin}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-xs text-violet-500">ผู้บริหาร / หัวหน้า</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{stats.management}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-xs text-emerald-500">ครู / อาจารย์</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.teacher}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-xs text-purple-500">บุคลากร (Staff)</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.staff}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-xs text-blue-500">นักศึกษา</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.student}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-xs text-emerald-600 dark:text-emerald-400">เปิดใช้งาน</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</div>
        </div>
      </div>

      {/* Action Bar: Search, Filters, and Action Buttons */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, username, ตำแหน่ง, อีเมล หรือแผนก..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          />
        </div>

        {/* Right buttons: Division/Dept/Status filters, Import Plan, Export CSV, Add User */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Division Filter */}
          {divisions.length > 0 && (
            <select
              value={selectedDivisionId}
              onChange={(e) => {
                setSelectedDivisionId(e.target.value);
                setSelectedDepartmentId('all');
              }}
              className="px-3 py-2 bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm max-w-[180px]"
            >
              <option value="all">ทุกฝ่ายงาน</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Department Filter */}
          {filterDepartments.length > 0 && (
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm max-w-[200px]"
            >
              <option value="all">ทุกแผนกวิชา / งาน</option>
              {filterDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">เปิดใช้งาน (Active)</option>
            <option value="suspended">ระงับการใช้งาน (Suspended)</option>
          </select>

          {/* Import from Plan Button */}
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-[1.01]"
            title="นำเข้าผู้ใช้และฝ่าย/แผนกจากระบบ Plan"
          >
            <Server className="w-3.5 h-3.5" />
            <span>นำเข้าจากระบบ Plan</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#141517] hover:bg-neutral-50 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm"
            title="ส่งออกรายชื่อเป็น CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => {
              fetchUsers();
              fetchDivisions();
            }}
            disabled={loading}
            className="p-2 bg-white dark:bg-[#141517] hover:bg-neutral-50 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add User Button */}
          <button
            type="button"
            onClick={() => {
              setActiveUser(null);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้ใหม่</span>
          </button>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
        {(
          [
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'director', label: 'ผู้อำนวยการ' },
            { key: 'deputy_director', label: 'รองผู้อำนวยการ' },
            { key: 'planning_officer', label: 'งานวางแผนฯ' },
            { key: 'head_dept', label: 'หัวหน้าแผนก/งาน' },
            { key: 'teacher', label: 'ครู / ผู้สอน' },
            { key: 'staff', label: 'บุคลากร (Staff)' },
            { key: 'student', label: 'นักศึกษา' },
            { key: 'admin', label: 'ผู้ดูแลระบบ' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedRole(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedRole === tab.key
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-xs">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">ไม่พบข้อมูลผู้ใช้งาน</h3>
            <p className="text-xs text-neutral-500 max-w-sm mt-1">
              {searchQuery ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองบทบาท' : 'คลิกปุ่ม "เพิ่มผู้ใช้ใหม่" เพื่อสร้างผู้ใช้งานคนแรก'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                <tr>
                  <th className="py-3 px-4 font-medium">ผู้ใช้งาน</th>
                  <th className="py-3 px-4 font-medium">อีเมล / สังกัด</th>
                  <th className="py-3 px-4 font-medium">บทบาท (Role)</th>
                  <th className="py-3 px-4 font-medium">Provider</th>
                  <th className="py-3 px-4 font-medium">สถานะ</th>
                  <th className="py-3 px-4 font-medium">ล็อกอินล่าสุด</th>
                  <th className="py-3 px-4 font-medium text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-850">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white flex items-center flex-wrap gap-1.5">
                            <span>{u.displayName}</span>
                            {u.sourceSystem === 'plan' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium">
                                Plan
                              </span>
                            )}
                            {!u.isActive && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                ระงับ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-500 flex items-center flex-wrap gap-1.5">
                            <span>@{u.username}</span>
                            {u.position && (
                              <span className="font-sans text-neutral-500 dark:text-neutral-400">
                                • {u.position}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email / Dept */}
                    <td className="py-3.5 px-4">
                      <div className="text-neutral-900 dark:text-neutral-200">{u.email}</div>
                      {u.departments && u.departments.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.departments.map((d) => (
                            <span
                              key={d.departmentId}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                d.isHead
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                              }`}
                              title={d.department?.division?.name || ''}
                            >
                              {d.isHead ? <Crown className="w-2.5 h-2.5 shrink-0" /> : <Building2 className="w-2.5 h-2.5 shrink-0" />}
                              <span>{d.department?.name || d.departmentId}</span>
                              {d.isHead && <span className="font-bold">(หัวหน้าฯ)</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{u.department || 'ไม่ระบุแผนก'}</span>
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    {/* Provider */}
                    <td className="py-3.5 px-4">
                      {u.authProvider === 'google' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Google</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                          <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Local</span>
                        </span>
                      )}
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="py-3.5 px-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={u.isActive}
                          onChange={() => handleToggleStatus(u)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-xs text-neutral-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('th-TH') : 'ยังไม่เคยเข้าสู่ระบบ'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUser(u);
                            setPasswordForm({ newPassword: '', confirmPassword: '' });
                            setIsPasswordOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="เปลี่ยนรหัสผ่าน"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUser(u);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUser(u);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="ลบผู้ใช้"
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
      </div>

      {/* Unified Add / Edit User Modal (Plan-Compatible Personnel + Student) */}
      <PlanUserFormModal
        isOpen={isAddOpen || isEditOpen}
        mode={isEditOpen ? 'edit' : 'add'}
        activeUser={activeUser}
        divisions={divisions}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
          setActiveUser(null);
        }}
        onSuccess={(msg) => {
          showNotification(msg, 'success');
          fetchUsers();
        }}
        onError={(errMsg) => showNotification(errMsg, 'error')}
      />

      {/* Hybrid Plan Import Wizard Modal */}
      <PlanImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={(msg) => {
          showNotification(msg, 'success');
          fetchUsers();
          fetchDivisions();
        }}
      />

      {/* Modal: Reset Password */}
      {isPasswordOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>รีเซ็ตรหัสผ่าน</span>
              </h3>
              <button
                onClick={() => setIsPasswordOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              ตั้งรหัสผ่านใหม่สำหรับ <strong className="text-neutral-900 dark:text-white">{activeUser.displayName}</strong> (@{activeUser.username})
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร) *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="กรอกรหัสผ่านใหม่"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  ยืนยันรหัสผ่านใหม่ *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">ยืนยันการลบผู้ใช้งาน</h3>
                <p className="text-xs text-neutral-500">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
              <div><strong className="text-neutral-900 dark:text-white">ชื่อ:</strong> {activeUser.displayName}</div>
              <div><strong className="text-neutral-900 dark:text-white">Username:</strong> @{activeUser.username}</div>
              <div><strong className="text-neutral-900 dark:text-white">อีเมล:</strong> {activeUser.email}</div>
              <div><strong className="text-neutral-900 dark:text-white">บทบาท:</strong> {activeUser.role}</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {submitting ? 'กำลังลบ...' : 'ยืนยันลบผู้ใช้งาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
