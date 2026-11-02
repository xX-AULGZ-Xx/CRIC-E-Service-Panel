import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function clearAllCookies(response: NextResponse, host: string) {
  const cookieNames = [
    'cric_logged_in',
    'cric_active_role',
    'cric_user_profile',
    'cric_sso_session',
    'cric_keycloak_state',
    'cric_keycloak_redirect_uri',
    'cric_keycloak_callback_url',
    'cric_oauth_state',
    'cric_oauth_redirect_uri',
  ];

  const isCricDomain = host.includes('cric.ac.th');

  cookieNames.forEach((name) => {
    // Clear host level cookie
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    // Clear root domain level cookie (.cric.ac.th)
    if (isCricDomain) {
      response.cookies.set(name, '', {
        path: '/',
        domain: '.cric.ac.th',
        maxAge: 0,
        expires: new Date(0),
      });
    }
  });
}

function getLogoutUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || (req.headers.get('x-forwarded-ssl') === 'on' ? 'https' : req.nextUrl.protocol.replace(':', ''));
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const baseUrl = `${proto}://${host}`;
  const postLogoutRedirect = `${baseUrl}/login`;

  const keycloakBaseUrl = (process.env.KEYCLOAK_URL || 'https://sso.cric.ac.th').replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM || 'cric-college';
  const clientId = process.env.KEYCLOAK_CLIENT_ID || 'cric-portal';

  return `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirect)}`;
}

export async function POST(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const logoutUrl = getLogoutUrl(req);

  const response = NextResponse.json({
    success: true,
    message: 'ออกจากระบบเรียบร้อยแล้ว',
    logoutUrl,
  });

  clearAllCookies(response, host);
  return response;
}

export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const logoutUrl = getLogoutUrl(req);

  const response = NextResponse.redirect(logoutUrl);
  clearAllCookies(response, host);
  return response;
}
