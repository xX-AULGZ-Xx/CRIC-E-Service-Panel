'use client';

import React, { useState, useEffect } from 'react';
import AppLauncher from '@/components/launcher/AppLauncher';
import { UserRole } from '@/types/service';
import { 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Terminal, 
  Code, 
  ExternalLink, 
  Globe, 
  Play, 
  Cpu
} from 'lucide-react';

interface ClientItem {
  id: string;
  name: string;
  secret: string;
  rootUrl: string;
  redirectUris: string[];
  status: 'Active' | 'Ready for Connection';
  badgeColor: string;
}

export default function AdminIntegrationManager() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<{
    keycloakPublicUrl?: string;
    keycloakRealm?: string;
    keycloakClientId?: string;
    keycloakClientSecret?: string;
  } | null>(null);
  const [portalOrigin, setPortalOrigin] = useState('https://panel.cric.ac.th');

  // Simulator states
  const [simClient, setSimClient] = useState('cric-plan-app');
  const [simRole, setSimRole] = useState<UserRole>('teacher');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Code snippet tab
  const [codeTab, setCodeTab] = useState<'html' | 'laravel' | 'node' | 'python'>('html');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalOrigin(window.location.origin);
    }
    fetch('/api/v1/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch((err) => console.error('Failed to load settings in integration manager', err));
  }, []);

  const keycloakUrl = (settings?.keycloakPublicUrl || 'https://sso.cric.ac.th').replace(/\/$/, '');
  const realm = settings?.keycloakRealm || 'cric-college';
  const portalClientId = settings?.keycloakClientId || 'cric-portal';
  const portalClientSecret = settings?.keycloakClientSecret || 'cric-portal-secret-key';

  const clients: ClientItem[] = [
    {
      id: 'cric-plan-app',
      name: 'ระบบแผนงานและงบประมาณ (CRIC Plan)',
      secret: 'cric-plan-secret-key-2026',
      rootUrl: 'https://plan.cric.ac.th',
      redirectUris: [
        'https://plan.cric.ac.th/*',
        'https://plan.cric.ac.th/auth/callback',
      ],
      status: 'Active',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'cric-rcms-app',
      name: 'ระบบบริหารจัดการงานวิจัยและวิทยาลัย (CRIC RCMS)',
      secret: 'cric-rcms-secret-key-2026',
      rootUrl: 'https://rcms.cric.ac.th',
      redirectUris: [
        'https://rcms.cric.ac.th/*',
        'https://rcms.cric.ac.th/auth/callback',
      ],
      status: 'Active',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    {
      id: portalClientId,
      name: 'CRIC E-Service Panel (ระบบกลาง)',
      secret: portalClientSecret,
      rootUrl: portalOrigin,
      redirectUris: [
        `${portalOrigin}/*`,
        `${portalOrigin}/api/auth/callback/keycloak`,
      ],
      status: 'Active',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    },
  ];

  const oidcEndpoints = [
    {
      label: 'OpenID Discovery Document',
      url: `${keycloakUrl}/realms/${realm}/.well-known/openid-configuration`,
      desc: 'เอกสารรวมการตั้งค่าและ Public Key ทั้งหมดของ Keycloak IdP',
    },
    {
      label: 'Authorization Endpoint',
      url: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`,
      desc: 'URL ที่ระบบลูกส่งผู้ใช้มา Login SSO',
    },
    {
      label: 'Token Endpoint',
      url: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
      desc: 'URL สำหรับแลกเปลี่ยน Authorization Code เป็น Access & ID Token (JWT)',
    },
    {
      label: 'Userinfo Endpoint',
      url: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/userinfo`,
      desc: 'URL ดึงข้อมูลผู้ใช้งาน (Name, Email, Roles)',
    },
    {
      label: 'Single Logout (SLO)',
      url: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`,
      desc: 'URL สำหรับสั่งออกจากระบบพร้อมกันทุกระบบ',
    },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const runSimulation = async () => {
    setSimLoading(true);
    try {
      const res = await fetch('/api/v1/integration/simulate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: simClient, role: simRole }),
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Intro Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-neutral-900 border border-blue-200/60 dark:border-neutral-800 space-y-2 shadow-sm transition-colors duration-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Phase 1: Developer Integration Hub</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          ศูนย์เชื่อมต่อระบบลูกข่าย (CRIC Subsystems Integration Hub)
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          รวบรวม Client Credentials, OIDC Endpoints, เครื่องมือจำลองการออก Token และ Live Sandbox พรีวิวเมนู 9 จุด สำหรับทีมผู้พัฒนาระบบแผนงาน (plan.cric.ac.th), ระบบ RCMS (rcms.cric.ac.th) และระบบอื่นๆ ในอนาคต
        </p>
      </div>

      {/* Section 1: Registered Clients Directory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <span>รายการระบบลูกข่ายที่ลงทะเบียนใน Keycloak (Registered OIDC Clients)</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              นำ Client ID และ Secret ด้านล่างไปคอนฟิกในระบบลูกข่ายเพื่อเปิดใช้งาน Single Sign-On
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const isSecretVisible = showSecret[client.id];

            return (
              <div
                key={client.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-neutral-700 transition-all space-y-4 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${client.badgeColor}`}>
                      {client.status}
                    </span>
                    <a
                      href={client.rootUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-white flex items-center gap-1 font-mono"
                    >
                      <span>{client.rootUrl.replace('https://', '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">
                      {client.name}
                    </h4>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                      Client ID: {client.id}
                    </span>
                  </div>

                  {/* Client Secret */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>Client Secret</span>
                      <button
                        type="button"
                        onClick={() => toggleSecret(client.id)}
                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
                      >
                        {isSecretVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isSecretVisible ? 'ซ่อน' : 'แสดง'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={isSecretVisible ? 'text' : 'password'}
                        readOnly
                        value={client.secret}
                        className="w-full pl-3 pr-9 py-1.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(client.secret, client.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                        title="คัดลอก Client Secret"
                      >
                        {copiedKey === client.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Redirect URIs */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Valid Redirect URIs</span>
                    <div className="space-y-1">
                      {client.redirectUris.map((uri, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 truncate"
                        >
                          {uri}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Protocol: OpenID Connect</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSimClient(client.id);
                      runSimulation();
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Play className="w-3 h-3" />
                    <span>ทดสอบ Token</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Central OIDC Endpoints */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <span>จุดเชื่อมต่อมาตรฐาน (Central OIDC Endpoints)</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141517] shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Endpoint Function</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">คำอธิบาย</th>
                <th className="px-4 py-3 text-right">คัดลอก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
              {oidcEndpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-neutral-850/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white font-sans">{ep.label}</td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400 max-w-sm truncate">{ep.url}</td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 font-sans text-[11px]">{ep.desc}</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => handleCopy(ep.url, `ep-${idx}`)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-200 shadow-sm"
                    >
                      {copiedKey === `ep-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === `ep-${idx}` ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Interactive Token Playground (OIDC Simulator) */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-500" />
            <span>เครื่องมือจำลองการออก Token OIDC (Interactive Token Playground)</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            จำลองการแลกเปลี่ยน Authorization Code และตรวจสอบข้อมูล Claims (Roles, Email, Subject) ที่ระบบลูกจะได้รับ
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#141517] border border-neutral-200 dark:border-neutral-800 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">เลือกระบบลูกข่าย (Client)</label>
              <select
                value={simClient}
                onChange={(e) => setSimClient(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
              >
                <option value="cric-plan-app">ระบบแผนงานและงบประมาณ (plan.cric.ac.th)</option>
                <option value="cric-rcms-app">ระบบวิจัยและบริหารจัดการ (rcms.cric.ac.th)</option>
                <option value="cric-portal">CRIC Central Portal (ระบบกลาง)</option>
              </select>
            </div>

            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">เลือกบทบาทผู้ใช้จำลอง (User Role)</label>
              <select
                value={simRole}
                onChange={(e) => setSimRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-black transition-all"
              >
                <option value="teacher">อาจารย์ผู้สอน (Teacher - อ.ประเสริฐ)</option>
                <option value="staff">เจ้าหน้าที่ (Staff - สุนีย์)</option>
                <option value="student">นักศึกษา (Student - สมชาย)</option>
                <option value="admin">ผู้ดูแลระบบ (Admin - Administrator)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={simLoading}
              onClick={runSimulation}
              className="w-full sm:w-auto self-end px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{simLoading ? 'กำลังสร้าง Token...' : 'จำลองขอ Token'}</span>
            </button>
          </div>

          {/* Results Display */}
          {simResult && (
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>ออก Token สำเร็จ (200 OK) - จำลอง OIDC Bearer Token</span>
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  อายุ Token: {simResult.expires_in} วินาที (1 ชั่วโมง)
                </span>
              </div>

              {/* Decoded Claims Payload */}
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 mb-1">
                  <span>Decoded JWT Claims Payload (ข้อมูลที่ระบบลูกข่ายอ่านได้):</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(simResult.decoded_payload, null, 2), 'simPayload')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'simPayload' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'simPayload' ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto max-h-64">
                  {JSON.stringify(simResult.decoded_payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Live 9-Dots Launcher Sandbox & Code Snippets */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>จำลองการฝังเมนู 9 จุดในเว็บระบบลูก (Live 9-Dots Launcher Sandbox)</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            ทดสอบการแสดงผลและพฤติกรรมของปุ่ม 9 จุดบน Header จำลองของระบบ plan.cric.ac.th หรือ rcms.cric.ac.th
          </p>
        </div>

        {/* Mock Host Subsystem Header */}
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#16171a] p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-mono text-[11px] ml-2 text-neutral-600 dark:text-neutral-300">
                https://plan.cric.ac.th/dashboard
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">● Embedded Launcher Active</span>
          </div>

          <div className="pt-3 px-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                PLAN
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">ระบบแผนงานและงบประมาณ (CRIC Plan)</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">สำนักงานผู้อำนวยการ วิทยาลัยอาชีวศึกษา CRIC</div>
              </div>
            </div>

            {/* Embedded 9-Dots Launcher Preview */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-[11px] text-neutral-500 dark:text-neutral-400">
                คลิกปุ่ม 9 จุดเพื่อทดสอบ ➔
              </div>
              <div className="p-1 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm">
                <AppLauncher currentRole="teacher" />
              </div>
            </div>
          </div>
        </div>

        {/* Code Snippets by Tech Stack */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCodeTab('html')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                codeTab === 'html'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              HTML Widget (Embed Script)
            </button>
            <button
              type="button"
              onClick={() => setCodeTab('laravel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                codeTab === 'laravel'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              PHP / Laravel (Plan & RCMS)
            </button>
            <button
              type="button"
              onClick={() => setCodeTab('node')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                codeTab === 'node'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Node.js / Next.js
            </button>
            <button
              type="button"
              onClick={() => setCodeTab('python')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                codeTab === 'python'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Python (Django / FastAPI)
            </button>
          </div>

          <div className="relative">
            {codeTab === 'html' && (
              <pre className="p-4 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto">
{`<!-- วางโค้ดนี้ไว้ก่อนปิดแท็ก </body> ในหน้าเว็บของระบบลูก -->
<script src="${portalOrigin}/widget/launcher.js" defer></script>`}
              </pre>
            )}

            {codeTab === 'laravel' && (
              <pre className="p-4 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl text-xs font-mono text-blue-600 dark:text-blue-300 overflow-x-auto">
{`// 1. ติดตั้ง Socialite Provider
// composer require socialiteproviders/keycloak

// 2. ใน config/services.php
'keycloak' => [
    'client_id' => 'cric-plan-app',
    'client_secret' => 'cric-plan-secret-key-2026',
    'redirect' => 'https://plan.cric.ac.th/auth/callback',
    'base_url' => '${keycloakUrl}',
    'realms' => '${realm}'
],

// 3. ใน AuthController.php
public function handleCallback() {
    $user = Socialite::driver('keycloak')->user();
    // เข้าถึง Roles: $user->user['realm_access']['roles']
}`}
              </pre>
            )}

            {codeTab === 'node' && (
              <pre className="p-4 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl text-xs font-mono text-amber-600 dark:text-amber-300 overflow-x-auto">
{`// NextAuth.js OIDC Provider
import KeycloakProvider from "next-auth/providers/keycloak";

KeycloakProvider({
  clientId: "cric-plan-app",
  clientSecret: "cric-plan-secret-key-2026",
  issuer: "${keycloakUrl}/realms/${realm}",
})`}
              </pre>
            )}

            {codeTab === 'python' && (
              <pre className="p-4 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl text-xs font-mono text-purple-600 dark:text-purple-300 overflow-x-auto">
{`# Django mozilla-django-oidc
OIDC_RP_CLIENT_ID = 'cric-rcms-app'
OIDC_RP_CLIENT_SECRET = 'cric-rcms-secret-key-2026'
OIDC_OP_AUTHORIZATION_ENDPOINT = '${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth'
OIDC_OP_TOKEN_ENDPOINT = '${keycloakUrl}/realms/${realm}/protocol/openid-connect/token'`}
              </pre>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
