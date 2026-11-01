import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_USERS } from '@/lib/auth';
import { UserRole } from '@/types/service';

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

    // Direct Demo Login
    if (demoRole && DEFAULT_USERS[demoRole]) {
      targetRole = demoRole;
    } else if (username && password) {
      const trimmedUser = username.trim().toLowerCase();
      const match = DEMO_CREDENTIALS[trimmedUser];

      if (match && match.pass === password) {
        targetRole = match.role;
      } else {
        return NextResponse.json(
          { success: false, error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (ลองใช้บัญชี Demo ด้านล่าง)' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' },
        { status: 400 }
      );
    }

    const userSession = DEFAULT_USERS[targetRole];
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
