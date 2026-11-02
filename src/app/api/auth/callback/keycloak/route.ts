import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findUserByEmail, recordUserLogin, readLocalUsers, writeLocalUsers, UserEntity } from '@/lib/users';
import { UserRole, UserSession } from '@/types/service';
import { signSsoJwt } from '@/lib/jwt';
import { getKeycloakInternalUrl } from '@/lib/keycloak';
import { setUnifiedAuthCookies } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function decodeJwtPayload(tokenStr: string): any {
  try {
    const parts = tokenStr.split('.');
    if (parts.length === 3) {
      const decodedStr = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(decodedStr);
    }
  } catch (e) {
    console.warn('Failed to decode JWT payload:', e);
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const proto = req.headers.get('x-forwarded-proto') || (req.headers.get('x-forwarded-ssl') === 'on' ? 'https' : req.nextUrl.protocol.replace(':', ''));
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const baseUrl = `${proto}://${host}`;
  const defaultRedirectUri = `${baseUrl}/api/auth/callback/keycloak`;
  const savedRedirectUri = req.cookies.get('cric_keycloak_redirect_uri')?.value || defaultRedirectUri;
  const targetCallbackUrl = req.cookies.get('cric_keycloak_callback_url')?.value || '/';

  const redirectToLoginWithError = (msg: string) => {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, baseUrl));
  };

  if (error) {
    console.error('Keycloak returned error:', error);
    return redirectToLoginWithError(`การเข้าสู่ระบบผ่าน SSO ถูกยกเลิกหรือล้มเหลว (${error})`);
  }

  if (!code) {
    return redirectToLoginWithError('ไม่พบ Authorization Code จากระบบ Keycloak SSO');
  }

  try {
    const keycloakBaseUrl = getKeycloakInternalUrl();
    const realm = process.env.KEYCLOAK_REALM || 'cric-college';
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'cric-portal';
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'cric-portal-secret-key';

    // 1. Exchange authorization code for tokens
    const tokenEndpoint = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`;
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code.trim(),
        redirect_uri: savedRedirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to exchange Keycloak token:', tokenData);
      const detail = tokenData.error_description || tokenData.error || 'ตรวจสอบ Client Secret หรือ Redirect URI ให้ตรงกัน';
      return redirectToLoginWithError(`การยืนยันสิทธิ์กับ Keycloak ล้มเหลว: ${detail}`);
    }

    // 2. Fetch UserInfo from Keycloak
    let userInfo: any = null;
    const userinfoEndpoint = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/userinfo`;
    const userinfoResponse = await fetch(userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (userinfoResponse.ok) {
      userInfo = await userinfoResponse.json();
    }

    // Combine claims from ID token, Access token, and UserInfo endpoint
    const decodedAccess = decodeJwtPayload(tokenData.access_token);
    const decodedId = tokenData.id_token ? decodeJwtPayload(tokenData.id_token) : null;

    userInfo = {
      ...decodedId,
      ...decodedAccess,
      ...userInfo,
      realm_access: decodedAccess?.realm_access || userInfo?.realm_access || { roles: [] },
    };

    const email = (userInfo.email || `${userInfo.preferred_username || 'user'}@cric.ac.th`).toLowerCase().trim();
    const name = userInfo.name || userInfo.full_name || email.split('@')[0];
    const username = (userInfo.preferred_username || email.split('@')[0]).toLowerCase().trim();

    // Extract picture (handle string or array)
    let rawAvatar = userInfo.picture || userInfo.avatar_url || userInfo.avatar || null;
    if (Array.isArray(rawAvatar) && rawAvatar.length > 0) {
      rawAvatar = rawAvatar[0];
    }
    const picture = typeof rawAvatar === 'string' && rawAvatar.startsWith('http') ? rawAvatar : '';

    // 3. User Role mapping & JIT Sync
    let assignedRole: UserRole = 'student';

    // Check Master Admin in data/admin.json
    const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');
    if (fs.existsSync(adminFilePath)) {
      try {
        const masterAdmin = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));
        if (masterAdmin.email && masterAdmin.email.toLowerCase() === email) {
          assignedRole = 'admin';
        }
      } catch {}
    }

    // Check database User table
    let existingUser = await findUserByEmail(email);

    if (existingUser) {
      if (!existingUser.isActive) {
        return redirectToLoginWithError('บัญชีผู้ใช้นี้ถูกระงับการใช้งานในระบบ กรุณาติดต่อผู้ดูแลระบบ');
      }
      assignedRole = existingUser.role as UserRole;
      await recordUserLogin(existingUser.id);
    } else {
      // Role detection from realm roles
      const realmRoles: string[] = userInfo.realm_access?.roles || [];
      if (assignedRole !== 'admin') {
        if (realmRoles.includes('admin')) {
          assignedRole = 'admin';
        } else if (realmRoles.includes('teacher')) {
          assignedRole = 'teacher';
        } else if (realmRoles.includes('staff')) {
          assignedRole = 'staff';
        } else {
          assignedRole = 'student';
        }
      }

      // Provision user
      let createdInDb = false;
      try {
        await prisma.user.create({
          data: {
            username,
            email,
            displayName: name,
            role: assignedRole,
            avatarUrl: picture || null,
            isActive: true,
            authProvider: 'keycloak',
            lastLoginAt: new Date(),
          },
        });
        createdInDb = true;
      } catch (err) {
        console.warn('Prisma JIT user creation skipped, saving locally:', err);
      }

      if (!createdInDb) {
        const newUser: UserEntity = {
          id: `usr-${Date.now()}`,
          username,
          displayName: name,
          email,
          passwordHash: null,
          department: null,
          role: assignedRole,
          avatarUrl: picture,
          isActive: true,
          authProvider: 'keycloak',
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
      userId: `kc-${userInfo.sub || Date.now()}`,
      username,
      displayName: name,
      email,
      avatarUrl: picture,
      roles,
      currentRole: assignedRole,
    };

    // 4. Generate Central SSO Session JWT for cross-domain sharing with RCMS
    const ssoSessionJwt = signSsoJwt({
      email,
      name,
      username,
      role: assignedRole,
      picture,
    });

    const finalTarget = targetCallbackUrl !== '/' && targetCallbackUrl !== '/login'
      ? targetCallbackUrl 
      : (assignedRole === 'admin' ? '/admin/services' : '/');

    const response = NextResponse.redirect(new URL(finalTarget, baseUrl));

    // Set unified session cookies across .cric.ac.th
    setUnifiedAuthCookies(response, userProfile, host);

    // Clean up temporary auth cookies
    response.cookies.delete('cric_keycloak_state');
    response.cookies.delete('cric_keycloak_redirect_uri');
    response.cookies.delete('cric_keycloak_callback_url');

    return response;
  } catch (err: any) {
    console.error('Keycloak callback error:', err);
    return redirectToLoginWithError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ Keycloak: ' + (err.message || 'Error'));
  }
}
