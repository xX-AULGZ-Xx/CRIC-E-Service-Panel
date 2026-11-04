import { NextResponse } from 'next/server';
import { UserSession } from '@/types/service';
import { signSsoJwt } from '@/lib/jwt';

export function setUnifiedAuthCookies(
  response: NextResponse,
  userProfile: UserSession,
  host: string
): string {
  const isCricDomain = host.includes('cric.ac.th');
  const cookieDomain = isCricDomain ? '.cric.ac.th' : undefined;

  const ssoSessionJwt = signSsoJwt({
    email: userProfile.email,
    name: userProfile.displayName,
    username: userProfile.username,
    role: userProfile.currentRole,
    picture: userProfile.avatarUrl,
  });

  const cookiesToSet: { name: string; value: string }[] = [
    { name: 'cric_logged_in', value: 'true' },
    { name: 'cric_active_role', value: userProfile.currentRole },
    { name: 'cric_user_profile', value: encodeURIComponent(JSON.stringify(userProfile)) },
    { name: 'cric_sso_session', value: ssoSessionJwt },
  ];

  cookiesToSet.forEach(({ name, value }) => {
    // 1. Set host-level cookie
    response.cookies.set(name, value, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    // 2. Set root domain cookie (.cric.ac.th) for cross-subdomain SSO with RCMS
    if (cookieDomain) {
      response.cookies.set(name, value, {
        path: '/',
        domain: cookieDomain,
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
    }
  });

  return ssoSessionJwt;
}
