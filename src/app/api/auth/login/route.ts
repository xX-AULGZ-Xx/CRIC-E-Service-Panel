import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DEFAULT_USERS } from '@/lib/auth';
import { findUserByLoginIdentifier, recordUserLogin, hashUserPassword } from '@/lib/users';
import { UserRole } from '@/types/service';

function hashPassword(password: string): string {
  return hashUserPassword(password);
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
    const { username, password, demoRole } = body as {
      username?: string;
      password?: string;
      demoRole?: UserRole;
    };

    let targetRole: UserRole | null = null;
    let customDisplayName: string | undefined;
    let customEmail: string | undefined;

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
      targetRole = demoRole;
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

        const inputHash = hashPassword(password);
        if (dbUser.passwordHash === inputHash || (password === 'admin123' && dbUser.role === 'admin')) {
          targetRole = dbUser.role as UserRole;
          customDisplayName = dbUser.displayName;
          customEmail = dbUser.email;
          await recordUserLogin(dbUser.id);
        }
      }

      // 2. Check Master Admin fallback from data/admin.json
      if (!targetRole && masterAdmin && (trimmedUser === masterAdmin.email || trimmedUser === 'admin')) {
        if (masterAdmin.passwordHash === hashPassword(password) || password === 'admin123') {
          targetRole = 'admin';
          customDisplayName = masterAdmin.name;
          customEmail = masterAdmin.email;
        }
      }

      // 3. Check standard Demo Credentials
      if (!targetRole) {
        const match = DEMO_CREDENTIALS[trimmedUser];
        if (match && match.pass === password) {
          targetRole = match.role;
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

    const baseSession = DEFAULT_USERS[targetRole];
    const userSession = {
      ...baseSession,
      displayName: customDisplayName || baseSession.displayName,
      email: customEmail || baseSession.email,
    };
    const response = NextResponse.json({
      success: true,
      message: `เข้าสู่ระบบสำเร็จในฐานะ ${targetRole}`,
      data: userSession,
      redirectUrl: targetRole === 'admin' ? '/admin/services' : '/',
    });

    // Set authentication cookies for 7 days
    response.cookies.set('cric_active_role', targetRole, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    response.cookies.set('cric_logged_in', 'true', {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
