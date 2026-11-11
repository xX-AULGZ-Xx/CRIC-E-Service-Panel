import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DEFAULT_USERS } from '@/lib/auth';
import { findUserByLoginIdentifier, recordUserLogin, hashUserPassword, verifyUserPassword } from '@/lib/users';
import { UserRole, UserSession } from '@/types/service';
import { setUnifiedAuthCookies } from '@/lib/session';
import { isDemoModeActive } from '@/lib/settings';

function hashPassword(password: string): string {
  return hashUserPassword(password);
}

interface SubsystemAuthResult {
  success: boolean;
  user?: {
    id?: string | number;
    username?: string;
    email?: string;
    full_name?: string;
    position?: string;
    role?: string;
    avatar_url?: string;
    department?: any;
    organization?: string;
  };
  nativeToken?: string;
  sourceApp: string;
}

async function verifyPlanCredentials(username: string, password: string): Promise<SubsystemAuthResult | null> {
  const planUrls = [
    process.env.PLAN_API_URL,
    'https://plan.cric.ac.th',
    'http://localhost:5050',
    'http://127.0.0.1:5050',
  ].filter(Boolean) as string[];

  for (const baseUrl of planUrls) {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/api/v1/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const user = data.user || data.data?.user;
        const nativeToken = data.token || data.data?.token;
        if (data && data.success && user) {
          return {
            success: true,
            user,
            nativeToken,
            sourceApp: 'plan',
          };
        }
      }
    } catch {
      // try next url or ignore
    }
  }
  return null;
}

async function verifyRcmsCredentials(username: string, password: string): Promise<SubsystemAuthResult | null> {
  const rcmsUrls = [
    process.env.RCMS_API_URL,
    'https://rcms.cric.ac.th',
    'http://localhost:5060',
    'http://127.0.0.1:5060',
  ].filter(Boolean) as string[];

  for (const baseUrl of rcmsUrls) {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/api/v1/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const user = data.data?.user || data.user;
        const nativeToken = data.data?.token || data.token;
        if (data && data.success && user) {
          return {
            success: true,
            user,
            nativeToken,
            sourceApp: 'rcms',
          };
        }
      }
    } catch {
      // try next url or ignore
    }
  }
  return null;
}

const DEMO_CREDENTIALS: Record<string, { role: UserRole; pass: string }> = {
  admin: { role: 'admin', pass: 'admin123' },
  'admin@cric.ac.th': { role: 'admin', pass: 'admin123' },
  teacher: { role: 'teacher', pass: 'teacher123' },
  'teacher@cric.ac.th': { role: 'teacher', pass: 'teacher123' },
  staff: { role: 'staff', pass: 'staff123' },
  'staff@cric.ac.th': { role: 'staff', pass: 'staff123' },
  student: { role: 'student', pass: 'student123' },
  'student@cric.ac.th': { role: 'student', pass: 'student123' },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, demoRole, app, redirectUri } = body as {
      username?: string;
      password?: string;
      demoRole?: UserRole;
      app?: string;
      redirectUri?: string;
    };

    let targetRole: UserRole | null = null;
    let customDisplayName: string | undefined;
    let customEmail: string | undefined;
    let isDemoLogin = false;
    let nativeToken: string | undefined;
    let sourceSubsystem: string | undefined;
    let subUserObj: any = null;

    const demoEnabled = await isDemoModeActive();

    // Check Master Admin from data/admin.json
    const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');
    let masterAdmin: any = null;
    if (fs.existsSync(adminFilePath)) {
      try {
        masterAdmin = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));
      } catch {}
    }

    // Direct Demo Login
    if (demoRole && DEFAULT_USERS[demoRole]) {
      if (!demoEnabled) {
        return NextResponse.json(
          { success: false, error: 'โหมดทดสอบถูกปิดใช้งานในสภาพแวดล้อมจริง (Production Mode)' },
          { status: 403 }
        );
      }
      targetRole = demoRole;
      isDemoLogin = true;
    } else if (username && password) {
      const trimmedUser = username.trim().toLowerCase();
      
      // 1. Check database User table
      const dbUser = await findUserByLoginIdentifier(trimmedUser);
      if (dbUser) {
        if (!dbUser.isActive) {
          return NextResponse.json(
            { success: false, error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' },
            { status: 403 }
          );
        }

        if (verifyUserPassword(password, dbUser.passwordHash) || (password === 'admin123' && dbUser.role === 'admin' && demoEnabled)) {
          targetRole = dbUser.role as UserRole;
          customDisplayName = dbUser.displayName;
          customEmail = dbUser.email;
          await recordUserLogin(dbUser.id);
        }
      }

      // 2. Check Master Admin fallback from data/admin.json
      if (!targetRole && masterAdmin && (trimmedUser === masterAdmin.email || trimmedUser === 'admin')) {
        if (masterAdmin.passwordHash === hashPassword(password) || (password === 'admin123' && demoEnabled)) {
          targetRole = 'admin';
          customDisplayName = masterAdmin.name;
          customEmail = masterAdmin.email;
        }
      }

      // 3. Check standard Demo Credentials (ONLY permitted if Demo Mode is active)
      if (!targetRole && demoEnabled) {
        const match = DEMO_CREDENTIALS[trimmedUser];
        if (match && match.pass === password) {
          targetRole = match.role;
          isDemoLogin = true;
        }
      }

      // 4. Subsystem Verification (Proxy Auth to Plan or RCMS)
      if (!targetRole) {
        let subsystemAuth: SubsystemAuthResult | null = null;
        const appHint = (app || '').toLowerCase();
        const redirectHint = (redirectUri || '').toLowerCase();

        // 4.1 Prioritize caller app hint
        if (appHint === 'plan' || redirectHint.includes('plan.cric.ac.th') || redirectHint.includes(':8001')) {
          subsystemAuth = await verifyPlanCredentials(username, password);
        } else if (appHint === 'rcms' || redirectHint.includes('rcms.cric.ac.th') || redirectHint.includes(':3001')) {
          subsystemAuth = await verifyRcmsCredentials(username, password);
        }

        // 4.2 Cascade Fallback: Check Plan then RCMS if not authenticated yet
        if (!subsystemAuth) {
          if (appHint !== 'plan') {
            subsystemAuth = await verifyPlanCredentials(username, password);
          }
          if (!subsystemAuth && appHint !== 'rcms') {
            subsystemAuth = await verifyRcmsCredentials(username, password);
          }
        }

        if (subsystemAuth && subsystemAuth.user) {
          subUserObj = subsystemAuth.user;
          const rawRole = (subUserObj.role || '').toLowerCase();
          let mappedRole: UserRole = 'teacher';
          if (rawRole === 'admin' || rawRole === 'super_admin') {
            mappedRole = 'admin';
          } else if (rawRole === 'director') {
            mappedRole = 'director';
          } else if (rawRole === 'deputy_director') {
            mappedRole = 'deputy_director';
          } else if (rawRole === 'planning_officer') {
            mappedRole = 'planning_officer';
          } else if (rawRole === 'head_dept' || rawRole === 'head_of_dept') {
            mappedRole = 'head_dept';
          } else if (rawRole === 'student') {
            mappedRole = 'student';
          } else if (rawRole === 'staff') {
            mappedRole = 'staff';
          } else {
            mappedRole = 'teacher';
          }

          targetRole = mappedRole;
          customDisplayName = subUserObj.full_name || subUserObj.username || username;
          customEmail = subUserObj.email || `${subUserObj.username || username}@cric.ac.th`;
          nativeToken = subsystemAuth.nativeToken;
          sourceSubsystem = subsystemAuth.sourceApp;
        }
      }

      if (!targetRole) {
        return NextResponse.json(
          { success: false, error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' },
        { status: 400 }
      );
    }

    const baseSession = DEFAULT_USERS[targetRole] || DEFAULT_USERS.teacher;
    const userSession: UserSession = {
      ...baseSession,
      userId: subUserObj?.id ? String(subUserObj.id) : baseSession.userId,
      username: subUserObj?.username || username || baseSession.username,
      displayName: customDisplayName || baseSession.displayName,
      email: customEmail || baseSession.email,
      avatarUrl: (subUserObj?.avatar_url) || baseSession.avatarUrl,
      currentRole: targetRole,
      roles: [targetRole],
    };
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
    
    // Create temporary response to sign and set cookies
    const dummyRes = new NextResponse();
    const ssoToken = setUnifiedAuthCookies(dummyRes, userSession, host);

    const response = NextResponse.json({
      success: true,
      message: `เข้าสู่ระบบสำเร็จในฐานะ ${targetRole}`,
      data: userSession,
      ssoToken,
      nativeToken,
      sourceSubsystem,
      redirectUrl: targetRole === 'admin' ? '/admin/services' : '/',
    });

    // Set unified authentication cookies across .cric.ac.th
    setUnifiedAuthCookies(response, userSession, host);

    // Set or clear demo session indicator
    const isCricDomain = host.includes('cric.ac.th');
    const cookieDomain = isCricDomain ? '.cric.ac.th' : undefined;

    if (isDemoLogin) {
      response.cookies.set('cric_is_demo', 'true', {
        path: '/',
        domain: cookieDomain,
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      response.cookies.set('cric_is_demo', 'true', {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
    } else {
      response.cookies.set('cric_is_demo', '', {
        path: '/',
        domain: cookieDomain,
        maxAge: 0,
      });
      response.cookies.set('cric_is_demo', '', {
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
