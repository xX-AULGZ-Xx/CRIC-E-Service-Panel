import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { findUserByEmail, recordUserLogin, readLocalUsers, writeLocalUsers, UserEntity } from '@/lib/users';
import { UserRole, UserSession } from '@/types/service';
import { setUnifiedAuthCookies } from '@/lib/session';
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

    // Determine user role & sync with User database
    let assignedRole: UserRole = 'student';

    const existingDbUser = await findUserByEmail(email);

    if (existingDbUser) {
      if (!existingDbUser.isActive) {
        return redirectToLoginWithError('บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      }
      assignedRole = existingDbUser.role as UserRole;

      // Update avatar and last login
      try {
        await prisma.user.update({
          where: { id: existingDbUser.id },
          data: {
            displayName: name || existingDbUser.displayName,
            avatarUrl: picture || existingDbUser.avatarUrl,
            lastLoginAt: new Date(),
          },
        });
      } catch {
        const local = await readLocalUsers();
        const idx = local.findIndex((u) => u.email.toLowerCase() === email);
        if (idx !== -1) {
          local[idx].displayName = name || local[idx].displayName;
          local[idx].avatarUrl = picture || local[idx].avatarUrl;
          local[idx].lastLoginAt = new Date();
          await writeLocalUsers(local);
        }
      }
    } else {
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

      // Auto-create user in database
      const newUsername = email.split('@')[0];
      try {
        await prisma.user.create({
          data: {
            username: newUsername,
            email: email,
            displayName: name,
            role: assignedRole,
            avatarUrl: picture,
            isActive: true,
            authProvider: 'google',
            lastLoginAt: new Date(),
          },
        });
      } catch (dbErr: any) {
        console.warn('DB create on Google login failed, writing local backup:', dbErr.message);
        const newUser: UserEntity = {
          id: `usr_${Date.now()}`,
          username: newUsername,
          email: email,
          passwordHash: null,
          displayName: name,
          department: null,
          role: assignedRole,
          avatarUrl: picture,
          isActive: true,
          authProvider: 'google',
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const local = await readLocalUsers();
        local.unshift(newUser);
        await writeLocalUsers(local);
      }
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

    // Store active role and login status across .cric.ac.th
    setUnifiedAuthCookies(response, userProfile, host);

    // Clean up temporary cookies
    response.cookies.delete('cric_oauth_state');
    response.cookies.delete('cric_oauth_redirect_uri');

    return response;
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return redirectToLoginWithError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ Google: ' + (err.message || 'Error'));
  }
}
