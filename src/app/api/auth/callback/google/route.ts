import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/settings';
import { UserRole, UserSession } from '@/types/service';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const proto = req.headers.get('x-forwarded-proto') || (req.headers.get('x-forwarded-ssl') === 'on' ? 'https' : req.nextUrl.protocol.replace(':', ''));
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const baseUrl = `${proto}://${host}`;
  const defaultRedirectUri = `${baseUrl}/api/auth/callback/google`;
  const savedRedirectUri = req.cookies.get('cric_oauth_redirect_uri')?.value || defaultRedirectUri;

  const redirectToLoginWithError = (msg: string) => {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, baseUrl));
  };

  // Google returned an error
  if (error) {
    console.error('Google OAuth returned error:', error);
    return redirectToLoginWithError(`การเข้าสู่ระบบผ่าน Google ถูกยกเลิกหรือล้มเหลว (${error})`);
  }

  // Missing code
  if (!code) {
    return redirectToLoginWithError('ไม่พบ Authorization Code จาก Google');
  }

  try {
    const settings = await getSystemSettings();

    if (!settings.googleClientId || !settings.googleClientSecret) {
      return redirectToLoginWithError('ข้อมูล Google Client ID หรือ Client Secret ไม่สมบูรณ์ในระบบ');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: settings.googleClientId.trim(),
        client_secret: settings.googleClientSecret.trim(),
        redirect_uri: savedRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to exchange Google token:', tokenData);
      const detail = tokenData.error_description || tokenData.error || 'ตรวจสอบ Redirect URI หรือ Secret ให้ตรงกัน';
      return redirectToLoginWithError(`การยืนยันสิทธิ์กับ Google ล้มเหลว: ${detail}`);
    }

    // Fetch user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return redirectToLoginWithError('ไม่สามารถดึงข้อมูลโปรไฟล์ผู้ใช้จากบัญชี Google ได้');
    }

    const userInfo = await userInfoResponse.json();
    const email = (userInfo.email || '').toLowerCase().trim();
    const name = userInfo.name || email.split('@')[0];
    const picture = userInfo.picture || '';
    const userHd = userInfo.hd || (email.split('@')[1] || '');

    // Domain check if configured
    const requiredHd = (settings.googleHostedDomain || '').trim().toLowerCase();
    if (requiredHd) {
      const allowedDomains = (settings.allowedEmailDomains || requiredHd)
        .split(',')
        .map((d: string) => d.trim().toLowerCase())
        .filter(Boolean);

      const emailDomain = email.split('@')[1] || '';
      const domainMatch = allowedDomains.some((d: string) => emailDomain === d || userHd === d);

      if (!domainMatch) {
        return redirectToLoginWithError(
          `อีเมล ${email} ไม่อยู่ในรายชื่อโดเมนที่อนุญาต (@${requiredHd}) กรุณาใช้อีเมลสถาบัน`
        );
      }
    }

    // Determine user role
    let assignedRole: UserRole = 'student';

    // Check Master Admin in data/admin.json
    const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');
    let masterAdmin: any = null;
    if (fs.existsSync(adminFilePath)) {
      try {
        masterAdmin = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));
      } catch {}
    }

    if (masterAdmin && (email === masterAdmin.email?.toLowerCase().trim() || email === 'admin@' + requiredHd)) {
      assignedRole = 'admin';
    } else if (email.startsWith('admin@') || email.includes('.admin@')) {
      assignedRole = 'admin';
    } else if (
      email.startsWith('teacher') || 
      email.startsWith('ajarn') || 
      email.startsWith('kru') || 
      email.includes('.t@') ||
      email.includes('teacher.') ||
      email.includes('ajarn.')
    ) {
      assignedRole = 'teacher';
    } else if (
      email.startsWith('staff') || 
      email.includes('staff.') ||
      email.includes('officer.')
    ) {
      assignedRole = 'staff';
    } else {
      assignedRole = 'student';
    }

    const roles: UserRole[] = assignedRole === 'admin' 
      ? ['admin', 'staff', 'teacher', 'student'] 
      : [assignedRole];

    const userProfile: UserSession = {
      userId: `google-${userInfo.sub || Date.now()}`,
      username: email.split('@')[0],
      displayName: name,
      email: email,
      avatarUrl: picture,
      roles: roles,
      currentRole: assignedRole,
    };

    const targetUrl = assignedRole === 'admin' ? '/admin/services' : '/';
    const response = NextResponse.redirect(new URL(targetUrl, baseUrl));

    // Store active role and login status
    response.cookies.set('cric_active_role', assignedRole, {
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

    // Store rich Google user profile
    response.cookies.set('cric_user_profile', encodeURIComponent(JSON.stringify(userProfile)), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    // Clean up temporary cookies
    response.cookies.delete('cric_oauth_state');
    response.cookies.delete('cric_oauth_redirect_uri');

    return response;
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return redirectToLoginWithError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ Google: ' + (err.message || 'Error'));
  }
}
