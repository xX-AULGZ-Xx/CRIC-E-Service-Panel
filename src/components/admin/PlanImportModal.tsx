'use client';

import React, { useState } from 'react';
import {
  X,
  Server,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Crown,
  ArrowRight,
  Users,
  Building2,
} from 'lucide-react';
import { UserRole } from '@/types/service';

interface PlanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (summaryMessage: string) => void;
}

interface PreviewUserItem {
  planId: string;
  username: string;
  fullName: string;
  email: string;
  autoEmail: boolean;
  role: UserRole;
  planRole: string;
  position?: string | null;
  departmentNames: string[];
  isHeadCount: number;
  isActive: boolean;
  status: 'new' | 'conflict';
  existingUserId?: string | null;
  existingDisplayName?: string | null;
  existingRole?: string | null;
}

interface PreviewResponse {
  sourceUrl?: string;
  summary: {
    total: number;
    newCount: number;
    conflictCount: number;
    divisionsCount: number;
    departmentsCount: number;
  };
  bundle: any;
  items: PreviewUserItem[];
}

interface ImportResultSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  divisionsSynced: number;
  departmentsSynced: number;
}

const ROLE_TH_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  director: 'ผู้อำนวยการ',
  deputy_director: 'รองผู้อำนวยการ',
  planning_officer: 'งานวางแผนฯ',
  head_dept: 'หัวหน้าแผนก/งาน',
  teacher: 'ครู / ผู้สอน',
  staff: 'บุคลากร',
  student: 'นักศึกษา',
  guest: 'บุคคลทั่วไป',
};

export default function PlanImportModal({ isOpen, onClose, onSuccess }: PlanImportModalProps) {
  const [sourceMode, setSourceMode] = useState<'live' | 'json'>('live');
  const [step, setStep] = useState<'source' | 'preview' | 'done'>('source');

  const [apiUrl, setApiUrl] = useState('http://localhost:5050');
  const [syncKey, setSyncKey] = useState('');
  const [jsonFileName, setJsonFileName] = useState<string>('');
  const [rawJsonData, setRawJsonData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState<'overwrite' | 'skip'>('overwrite');
  const [resultSummary, setResultSummary] = useState<ImportResultSummary | null>(null);
  const [resultErrors, setResultErrors] = useState<Array<{ username: string; error: string }>>([]);

  const resetModal = () => {
    setStep('source');
    setError(null);
    setPreview(null);
    setSelectedUsernames([]);
    setResultSummary(null);
    setResultErrors([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setJsonFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        setRawJsonData(parsed);
      } catch {
        setError('ไฟล์ที่เลือกไม่ใช่รูปแบบ JSON ที่ถูกต้อง');
        setRawJsonData(null);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handlePreview = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload =
        sourceMode === 'live'
          ? { action: 'preview-live', apiUrl: apiUrl.trim(), syncKey: syncKey.trim() || undefined }
          : { action: 'preview-json', rawPayload: rawJsonData };

      if (sourceMode === 'json' && !rawJsonData) {
        throw new Error('กรุณาเลือกไฟล์ JSON ที่ส่งออกจากระบบ Plan ก่อน');
      }

      const res = await fetch('/api/v1/users/import-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ไม่สามารถตรวจสอบข้อมูลนำเข้าได้');
      }

      setPreview(json);
      setSelectedUsernames((json.items || []).map((i: PreviewUserItem) => i.username));
      setStep('preview');
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!preview || selectedUsernames.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users/import-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          rawPayload: preview.bundle,
          selectedUsernames,
          conflictStrategy,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'การนำเข้าข้อมูลล้มเหลว');
      }

      setResultSummary(json.summary);
      setResultErrors(json.errors || []);
      setStep('done');
      onSuccess(json.message);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดระหว่างนำเข้าข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (!preview) return;
    if (selectedUsernames.length === preview.items.length) {
      setSelectedUsernames([]);
    } else {
      setSelectedUsernames(preview.items.map((i) => i.username));
    }
  };

  const toggleSelectUser = (uname: string) => {
    setSelectedUsernames((prev) =>
      prev.includes(uname) ? prev.filter((u) => u !== uname) : [...prev, uname]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                นำเข้าผู้ใช้งานและโครงสร้างฝ่าย/แผนก จากระบบ Plan
              </h3>
              <p className="text-[11px] text-neutral-500">
                ซิงค์บัญชีครู ผู้บริหาร งานวางแผนฯ พร้อมรหัสผ่านเดิม (bcryptjs) และสังกัดแผนก/หัวหน้างานอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'source' && (
            <div className="space-y-5">
              {/* Source Switcher */}
              <div className="grid grid-cols-2 gap-2.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setSourceMode('live');
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    sourceMode === 'live'
                      ? 'bg-white dark:bg-[#1e2024] text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Server className="w-4 h-4" />
                  <span>ดึงข้อมูลสดผ่าน API (Live Sync)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceMode('json');
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    sourceMode === 'json'
                      ? 'bg-white dark:bg-[#1e2024] text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>อัปโหลดไฟล์ JSON จาก Plan</span>
                </button>
              </div>

              {sourceMode === 'live' ? (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        URL ของระบบ Plan API
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setApiUrl('http://localhost:5050')}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 text-neutral-600 dark:text-neutral-300"
                        >
                          Local (localhost:5050)
                        </button>
                        <button
                          type="button"
                          onClick={() => setApiUrl('https://plan.cric.ac.th')}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 text-neutral-600 dark:text-neutral-300"
                        >
                          Production (plan.cric.ac.th)
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://plan.cric.ac.th หรือ http://localhost:5050"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Sync Key Override (ไม่บังคับ — ค่าเริ่มต้นใช้จากค่าสิ่งแวดล้อมของเซิร์ฟเวอร์)
                    </label>
                    <input
                      type="password"
                      value={syncKey}
                      onChange={(e) => setSyncKey(e.target.value)}
                      placeholder="เว้นว่างเพื่อใช้ค่า PANEL_SYNC_SECRET เริ่มต้น"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-950 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-3">
                  <Upload className="w-10 h-10 text-indigo-500 mx-auto" />
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                      เลือกไฟล์ JSON ที่ส่งออกจากหน้าจัดการผู้ใช้ของระบบ Plan
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      กดปุ่ม &quot;ส่งออก JSON สำหรับ Panel&quot; ในระบบ Plan แล้วอัปโหลดไฟล์ `.json` ที่นี่
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm">
                    <span>เลือกไฟล์ .json</span>
                    <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {jsonFileName && (
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      ✓ โหลดไฟล์แล้ว: {jsonFileName}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePreview}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'กำลังตรวจสอบข้อมูล...' : 'ตรวจสอบและดูตัวอย่าง'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> ฝ่าย / แผนก
                  </div>
                  <div className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                    {preview.summary.divisionsCount} / {preview.summary.departmentsCount}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> ผู้ใช้ทั้งหมด
                  </div>
                  <div className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                    {preview.summary.total} คน
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">เพิ่มใหม่</div>
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {preview.summary.newCount} คน
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="text-[11px] text-amber-600 dark:text-amber-400">มีอยู่แล้ว (ซ้ำ)</div>
                  <div className="text-base font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                    {preview.summary.conflictCount} คน
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="text-[11px] text-blue-600 dark:text-blue-400">เลือกนำเข้า</div>
                  <div className="text-base font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                    {selectedUsernames.length} คน
                  </div>
                </div>
              </div>

              {/* Conflict Strategy */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  การจัดการบัญชีที่มีอยู่แล้วใน Panel:
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="conflictStrategy"
                      checked={conflictStrategy === 'overwrite'}
                      onChange={() => setConflictStrategy('overwrite')}
                    />
                    <span>อัปเดตทับข้อมูลเดิม (แนะนำ)</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="conflictStrategy"
                      checked={conflictStrategy === 'skip'}
                      onChange={() => setConflictStrategy('skip')}
                    />
                    <span>ข้ามบัญชีที่มีอยู่แล้ว</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 dark:bg-neutral-900 sticky top-0 text-neutral-600 dark:text-neutral-400">
                    <tr>
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedUsernames.length === preview.items.length && preview.items.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="py-2.5 px-3 font-semibold">ผู้ใช้ / อีเมล</th>
                      <th className="py-2.5 px-3 font-semibold">บทบาท (Plan)</th>
                      <th className="py-2.5 px-3 font-semibold">แผนก/งาน</th>
                      <th className="py-2.5 px-3 font-semibold">สถานะเทียบ Panel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {preview.items.map((item) => {
                      const checked = selectedUsernames.includes(item.username);
                      return (
                        <tr key={item.planId} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelectUser(item.username)}
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-neutral-900 dark:text-white">{item.fullName}</div>
                            <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
                              <span>@{item.username}</span>
                              <span>• {item.email}</span>
                              {item.autoEmail && (
                                <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-sans text-[10px]">
                                  Auto Email
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                              {ROLE_TH_LABELS[item.role] || item.role}
                            </span>
                            {item.isHeadCount > 0 && (
                              <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                <Crown className="w-2.5 h-2.5" /> หัวหน้าฯ ({item.isHeadCount})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 max-w-[200px] truncate">
                            {item.departmentNames.length > 0 ? item.departmentNames.join(', ') : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.status === 'new' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                เพิ่มใหม่
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                มีแล้ว ({conflictStrategy === 'overwrite' ? 'อัปเดตทับ' : 'ข้าม'})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('source')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  ← ย้อนกลับเลือกแหล่งข้อมูล
                </button>
                <button
                  type="button"
                  disabled={loading || selectedUsernames.length === 0}
                  onClick={handleExecuteImport}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {loading ? 'กำลังนำเข้าข้อมูล...' : `ยืนยันนำเข้า (${selectedUsernames.length} รายการ)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 'done' && resultSummary && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">นำเข้าข้อมูลจากระบบ Plan เสร็จสิ้น</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  ซิงค์ฝ่ายงาน {resultSummary.divisionsSynced} ฝ่าย และแผนกวิชา/งาน {resultSummary.departmentsSynced} แห่งเรียบร้อยแล้ว
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[11px] text-emerald-600">เพิ่มใหม่</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{resultSummary.created}</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="text-[11px] text-blue-600">อัปเดต</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{resultSummary.updated}</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="text-[11px] text-amber-600">ข้าม</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{resultSummary.skipped}</div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <div className="text-[11px] text-rose-600">ผิดพลาด</div>
                  <div className="text-xl font-bold text-rose-700 dark:text-rose-300">{resultSummary.failed}</div>
                </div>
              </div>

              {resultErrors.length > 0 && (
                <div className="max-w-xl mx-auto text-left p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs space-y-1">
                  {resultErrors.map((e, idx) => (
                    <div key={idx} className="text-rose-700 dark:text-rose-300 font-mono">
                      @{e.username}: {e.error}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold"
                >
                  ปิดหน้าต่างและแสดงรายชื่อผู้ใช้
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
