'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Edit3,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  UserCheck,
  Building2,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { DivisionItem, UserAccount, UserRole } from '@/types/service';
import { formatUsernameHandle } from '@/lib/format';

interface PlanUserFormModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  activeUser?: UserAccount | null;
  divisions: DivisionItem[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type FormCategoryTab = 'personnel' | 'student';
type PersonnelType = 'TEACHER' | 'STAFF';

const PLAN_SYSTEM_ROLES: {
  role: UserRole;
  title: string;
  desc: string;
  badgeColor: string;
}[] = [
  {
    role: 'teacher',
    title: 'ครู / ผู้สอน',
    desc: 'ผู้ปฏิบัติงานสอน เสนอโครงการ และใช้งานบริการพื้นฐาน',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    role: 'head_dept',
    title: 'หัวหน้าแผนก / งาน',
    desc: 'หัวหน้าแผนกวิชาหรือหัวหน้างานระดับปฏิบัติการ',
    badgeColor: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  {
    role: 'planning_officer',
    title: 'เจ้าหน้าที่งานวางแผนฯ',
    desc: 'ตรวจสอบแผนงาน งบประมาณ และประสานงานโครงการ',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  {
    role: 'deputy_director',
    title: 'รองผู้อำนวยการ',
    desc: 'กำกับดูแลฝ่ายงานตามโครงสร้างบริหารสถานศึกษา',
    badgeColor: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  {
    role: 'director',
    title: 'ผู้อำนวยการ',
    desc: 'ผู้บริหารสูงสุดของสถานศึกษา อนุมัติแผนและภาพรวม',
    badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
  {
    role: 'admin',
    title: 'ผู้ดูแลระบบ (Admin)',
    desc: 'จัดการผู้ใช้ ตั้งค่าระบบ และสิทธิ์ทุกบริการใน Panel',
    badgeColor: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
  },
];

export default function PlanUserFormModal({
  isOpen,
  mode,
  activeUser,
  divisions,
  onClose,
  onSuccess,
  onError,
}: PlanUserFormModalProps) {
  const [categoryTab, setCategoryTab] = useState<FormCategoryTab>('personnel');
  const [personnelType, setPersonnelType] = useState<PersonnelType>('TEACHER');
  const [role, setRole] = useState<UserRole>('teacher');

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [position, setPosition] = useState('');
  const [studentDeptText, setStudentDeptText] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [headDeptIds, setHeadDeptIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLocalError(null);
    setPassword('');
    setShowPassword(false);

    if (mode === 'edit' && activeUser) {
      const isStudent = activeUser.role === 'student';
      setCategoryTab(isStudent ? 'student' : 'personnel');
      setPersonnelType(
        activeUser.personnelType === 'STAFF' || activeUser.role === 'staff' || activeUser.role === 'planning_officer'
          ? 'STAFF'
          : 'TEACHER'
      );
      setRole(activeUser.role);
      setDisplayName(activeUser.displayName || '');
      setUsername(activeUser.username || '');
      setEmail(activeUser.email || '');
      setPosition(activeUser.position || '');
      setStudentDeptText(activeUser.department || '');
      setIsActive(activeUser.isActive);

      const deptIds = (activeUser.departments || []).map((d) => d.departmentId);
      const hIds = (activeUser.departments || []).filter((d) => d.isHead).map((d) => d.departmentId);
      setSelectedDeptIds(deptIds);
      setHeadDeptIds(hIds);
    } else {
      setCategoryTab('personnel');
      setPersonnelType('TEACHER');
      setRole('teacher');
      setDisplayName('');
      setUsername('');
      setEmail('');
      setPosition('');
      setStudentDeptText('');
      setIsActive(true);
      setSelectedDeptIds([]);
      setHeadDeptIds([]);
    }
  }, [isOpen, mode, activeUser]);

  const handleCategorySwitch = (tab: FormCategoryTab) => {
    setCategoryTab(tab);
    if (tab === 'student') {
      setRole('student');
    } else if (role === 'student' || role === 'guest') {
      setRole(personnelType === 'STAFF' ? 'staff' : 'teacher');
    }
  };

  const handlePersonnelTypeSelect = (pType: PersonnelType) => {
    setPersonnelType(pType);
    if (mode === 'add') {
      if (pType === 'TEACHER' && (role === 'staff' || role === 'student')) {
        setRole('teacher');
      } else if (pType === 'STAFF' && role === 'teacher') {
        setRole('planning_officer');
      }
    }
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDeptIds((prev) => {
      if (prev.includes(deptId)) {
        setHeadDeptIds((heads) => heads.filter((h) => h !== deptId));
        return prev.filter((id) => id !== deptId);
      }
      return [...prev, deptId];
    });
  };

  const toggleHeadDepartment = (deptId: string) => {
    if (!selectedDeptIds.includes(deptId)) {
      setSelectedDeptIds((prev) => [...prev, deptId]);
    }
    setHeadDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const toggleWholeDivision = (div: DivisionItem) => {
    const divDeptIds = (div.departments || []).map((d) => d.id);
    if (divDeptIds.length === 0) return;

    const allSelected = divDeptIds.every((id) => selectedDeptIds.includes(id));
    if (allSelected) {
      setSelectedDeptIds((prev) => prev.filter((id) => !divDeptIds.includes(id)));
      setHeadDeptIds((prev) => prev.filter((id) => !divDeptIds.includes(id)));
    } else {
      setSelectedDeptIds((prev) => Array.from(new Set([...prev, ...divDeptIds])));
    }
  };

  const divisionSelectionSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const div of divisions) {
      const count = (div.departments || []).filter((d) => selectedDeptIds.includes(d.id)).length;
      map.set(div.id, count);
    }
    return map;
  }, [divisions, selectedDeptIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!displayName.trim() || !username.trim()) {
      setLocalError('กรุณากรอกชื่อ-นามสกุล และ Username ให้ครบถ้วน');
      return;
    }

    if (mode === 'add' && password.trim().length < 4) {
      setLocalError('กรุณากำหนดรหัสผ่านเริ่มต้นอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (mode === 'edit' && password.trim().length > 0 && password.trim().length < 4) {
      setLocalError('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setSubmitting(true);
    try {
      const effectiveRole: UserRole = categoryTab === 'student' ? 'student' : role;
      const payload: Record<string, any> = {
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim().toLowerCase() || null,
        role: effectiveRole,
        isActive,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      if (categoryTab === 'personnel') {
        payload.personnelType = personnelType;
        payload.position = position.trim() || null;
        payload.departmentIds = selectedDeptIds;
        payload.headDeptIds = headDeptIds;
      } else {
        payload.personnelType = null;
        payload.position = null;
        payload.department = studentDeptText.trim() || null;
        payload.departmentIds = [];
        payload.headDeptIds = [];
      }

      const url = mode === 'add' ? '/api/v1/users' : `/api/v1/users/${activeUser?.id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้');
      }

      onSuccess(
        mode === 'add'
          ? `สร้างผู้ใช้งาน "${displayName.trim()}" เรียบร้อยแล้ว`
          : `อัปเดตข้อมูล "${displayName.trim()}" เรียบร้อยแล้ว`
      );
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setLocalError(errMsg);
      onError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {mode === 'add' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {mode === 'add' ? 'เพิ่มผู้ใช้งานใหม่' : `แก้ไขข้อมูลผู้ใช้งาน (${formatUsernameHandle(activeUser?.username)})`}
              </h3>
              <p className="text-[11px] text-neutral-500">
                รองรับโครงสร้างบุคลากร ฝ่าย/แผนก และบทบาทระบบ Plan เชื่อมโยงกับ CRIC E-Service Panel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="px-6 pt-3 pb-2 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-200/70 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => handleCategorySwitch('personnel')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                categoryTab === 'personnel'
                  ? 'bg-white dark:bg-[#1e2024] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>บุคลากร (ครู / เจ้าหน้าที่ แบบ Plan)</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategorySwitch('student')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                categoryTab === 'student'
                  ? 'bg-white dark:bg-[#1e2024] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>นักเรียน / นักศึกษา</span>
            </button>
          </div>
        </div>

        {/* Form Scroll Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {localError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {categoryTab === 'personnel' ? (
            <>
              {/* 1. Personnel Type Selector (2 types only matching Plan) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  1. ประเภทบุคลากร
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePersonnelTypeSelect('TEACHER')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      personnelType === 'TEACHER'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        personnelType === 'TEACHER'
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        ครู / ผู้สอน (TEACHER)
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        ครูประจำ ครูพิเศษ หัวหน้าแผนกวิชา หรือผู้บริหารสถานศึกษา
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonnelTypeSelect('STAFF')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      personnelType === 'STAFF'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                        : 'border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        personnelType === 'STAFF'
                          ? 'bg-purple-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        เจ้าหน้าที่ / สนับสนุน (STAFF)
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        เจ้าหน้าที่งานวางแผนฯ งานธุรการ พัสดุ การเงิน หรือสายสนับสนุน
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Account & Profile Info */}
              <div className="space-y-3.5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  2. ข้อมูลบัญชีและประวัติส่วนตัว
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ชื่อ-นามสกุล (Full Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="เช่น นางสาวสมหญิง รักเรียน"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ตำแหน่ง / วิทยฐานะ
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="เช่น ครู ชำนาญการ, นักวิชาการศึกษา"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ชื่อผู้ใช้ (Username) *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="เช่น somying.r"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      อีเมล (Email)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ไม่บังคับ (เว้นว่างได้หากไม่มีอีเมล)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      {mode === 'add' ? 'รหัสผ่านเริ่มต้น *' : 'เปลี่ยนรหัสผ่าน (ไม่บังคับ)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={mode === 'add'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'add' ? 'อย่างน้อย 4 ตัวอักษร' : 'เว้นว่างหากไม่เปลี่ยน'}
                        className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. System Role Cards (6 Plan Roles + optional general Staff chip) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                    <span>3. บทบาทสิทธิ์ในระบบ (System Role)</span>
                  </label>
                  {personnelType === 'STAFF' && (
                    <button
                      type="button"
                      onClick={() => setRole('staff')}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                        role === 'staff'
                          ? 'border-purple-500 bg-purple-600 text-white font-semibold'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      บุคลากรทั่วไป Panel (Staff)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {PLAN_SYSTEM_ROLES.map((item) => {
                    const active = role === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setRole(item.role)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          active
                            ? `${item.badgeColor} ring-2 ring-blue-500/25 shadow-sm`
                            : 'border-neutral-200 dark:border-neutral-800 bg-slate-50/40 dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold">{item.title}</span>
                          {active && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <p className="text-[10px] opacity-80 mt-1 leading-relaxed">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Multi-Division & Multi-Department + Head Assignment */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>4. สังกัดฝ่ายและแผนกวิชา / งาน (เลือกได้หลายรายการ)</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                      เลือก {selectedDeptIds.length} แผนก/งาน
                    </span>
                    {headDeptIds.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        หัวหน้างาน {headDeptIds.length} แห่ง
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick 4-Division Setup for Deputy Director (Plan Feature) */}
                {(role === 'deputy_director' || role === 'director') && divisions.length > 0 && (
                  <div className="p-3 rounded-2xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/70 space-y-2">
                    <div className="text-[11px] font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ตั้งค่าด่วนสำหรับผู้บริหาร: คลิกเลือกทั้งฝ่ายงานที่รับผิดชอบ</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {divisions.map((div) => {
                        const divDeptIds = (div.departments || []).map((d) => d.id);
                        const allChecked =
                          divDeptIds.length > 0 && divDeptIds.every((id) => selectedDeptIds.includes(id));
                        return (
                          <button
                            key={div.id}
                            type="button"
                            onClick={() => toggleWholeDivision(div)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                              allChecked
                                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                : 'bg-white dark:bg-neutral-900 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 hover:bg-violet-100/70'
                            }`}
                          >
                            {div.name} ({div.code})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {divisions.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center text-xs text-neutral-500">
                    ยังไม่มีข้อมูลฝ่ายงาน/แผนกวิชาในระบบ
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                    {divisions.map((div) => {
                      const divDepts = div.departments || [];
                      const selectedCount = divisionSelectionSummary.get(div.id) || 0;
                      const allChecked =
                        divDepts.length > 0 && selectedCount === divDepts.length;

                      return (
                        <div
                          key={div.id}
                          className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950/70 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-neutral-200/70 dark:border-neutral-800">
                            <button
                              type="button"
                              onClick={() => toggleWholeDivision(div)}
                              className="text-left flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                                  allChecked
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : selectedCount > 0
                                      ? 'bg-blue-500/20 border-blue-500 text-blue-600'
                                      : 'border-neutral-400'
                                }`}
                              >
                                {allChecked ? '✓' : selectedCount > 0 ? '•' : ''}
                              </span>
                              <span>{div.name}</span>
                            </button>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              {div.code}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {divDepts.map((dept) => {
                              const checked = selectedDeptIds.includes(dept.id);
                              const isHead = headDeptIds.includes(dept.id);
                              return (
                                <div
                                  key={dept.id}
                                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl text-xs transition-colors ${
                                    checked
                                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60'
                                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
                                  }`}
                                >
                                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleDepartment(dept.id)}
                                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                    />
                                    <span className="truncate text-neutral-800 dark:text-neutral-200">
                                      {dept.name}
                                    </span>
                                  </label>

                                  {checked && (
                                    <button
                                      type="button"
                                      onClick={() => toggleHeadDepartment(dept.id)}
                                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all ${
                                        isHead
                                          ? 'bg-amber-500 text-white shadow-xs'
                                          : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-amber-500/20 hover:text-amber-700'
                                      }`}
                                      title="กำหนดให้เป็นหัวหน้าแผนก/งานนี้"
                                    >
                                      <Crown className="w-2.5 h-2.5" />
                                      <span>{isHead ? 'หัวหน้างาน' : '+ เป็นหัวหน้างาน'}</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Simple Dedicated Form for Student */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>บัญชีนักเรียน / นักศึกษา จะได้รับบทบาท Student โดยอัตโนมัติ</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น นายสมชาย ใจดี"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    รหัสนักศึกษา / Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น 6720101001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ไม่บังคับ (เช่น 6720101001@cric.ac.th หรือเว้นว่าง)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {mode === 'add' ? 'รหัสผ่านเริ่มต้น *' : 'เปลี่ยนรหัสผ่าน (ไม่บังคับ)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={mode === 'add'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'add' ? 'อย่างน้อย 4 ตัวอักษร' : 'เว้นว่างหากไม่เปลี่ยน'}
                      className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    แผนกวิชา / ระดับชั้น
                  </label>
                  <input
                    type="text"
                    value={studentDeptText}
                    onChange={(e) => setStudentDeptText(e.target.value)}
                    placeholder="เช่น ปวส.1 เทคโนโลยีสารสนเทศ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Account Status Toggle (on Edit) */}
          {mode === 'edit' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  สถานะการใช้งานบัญชี
                </div>
                <div className="text-[11px] text-neutral-500">
                  {isActive
                    ? 'ผู้ใช้สามารถเข้าสู่ระบบและใช้งานบริการตามสิทธิ์ได้ปกติ'
                    : 'บัญชีถูกระงับการใช้งานชั่วคราว'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-neutral-300 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : mode === 'add' ? 'บันทึกผู้ใช้ใหม่' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
