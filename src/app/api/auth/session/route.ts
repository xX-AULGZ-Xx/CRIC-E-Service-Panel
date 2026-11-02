import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserSession, DEFAULT_USERS, isAuthenticatedUser } from '@/lib/auth';
import { UserRole } from '@/types/service';

export async function GET() {
  const session = await getCurrentUserSession();
  const isLoggedIn = await isAuthenticatedUser();
  return NextResponse.json({
    success: true,
    data: session,
    isLoggedIn,
    availableRoles: Object.keys(DEFAULT_USERS),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role } = body as { role: UserRole };

    if (!role || !DEFAULT_USERS[role]) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    const userProfileCookie = req.cookies.get('cric_user_profile')?.value;
    let customProfile: any = null;
    if (userProfileCookie) {
      try {
        customProfile = JSON.parse(decodeURIComponent(userProfileCookie));
        customProfile.currentRole = role;
      } catch {}
    }

    const sessionData = customProfile || DEFAULT_USERS[role];

    const response = NextResponse.json({
      success: true,
      data: sessionData,
      message: `Switched active role to ${role}`,
    });

    // Set cookie for 7 days
    response.cookies.set('cric_active_role', role, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    if (customProfile) {
      response.cookies.set('cric_user_profile', encodeURIComponent(JSON.stringify(customProfile)), {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
