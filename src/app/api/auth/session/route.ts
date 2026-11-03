import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserSession, DEFAULT_USERS, isAuthenticatedUser } from '@/lib/auth';
import { UserRole, UserSession } from '@/types/service';
import { setUnifiedAuthCookies } from '@/lib/session';
import { isDemoModeActive } from '@/lib/settings';

export async function GET() {
  const session = await getCurrentUserSession();
  const isLoggedIn = await isAuthenticatedUser();
  const demoActive = await isDemoModeActive();

  return NextResponse.json({
    success: true,
    data: session,
    isLoggedIn,
    demoModeEnabled: demoActive,
    availableRoles: Object.keys(DEFAULT_USERS),
  });
}

export async function POST(req: NextRequest) {
  try {
    const demoActive = await isDemoModeActive();
    if (!demoActive) {
      return NextResponse.json(
        { success: false, error: 'การสลับบทบาทถูกปิดใช้งานในสภาพแวดล้อมจริง (Production Mode)' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role } = body as { role: UserRole };

    if (!role || !DEFAULT_USERS[role]) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    const userProfileCookie = req.cookies.get('cric_user_profile')?.value;
    let customProfile: Partial<UserSession> | null = null;
    if (userProfileCookie) {
      try {
        customProfile = JSON.parse(decodeURIComponent(userProfileCookie));
      } catch {}
    }

    const baseUser = DEFAULT_USERS[role];
    const updatedSession: UserSession = {
      ...baseUser,
      ...(customProfile || {}),
      currentRole: role,
    };

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
    const response = NextResponse.json({
      success: true,
      data: updatedSession,
      message: `Switched active role to ${role}`,
    });

    // Re-sign unified SSO cookies and propagate across .cric.ac.th
    setUnifiedAuthCookies(response, updatedSession, host);

    // Keep demo indicator cookie active
    const isCricDomain = host.includes('cric.ac.th');
    const cookieDomain = isCricDomain ? '.cric.ac.th' : undefined;
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

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
