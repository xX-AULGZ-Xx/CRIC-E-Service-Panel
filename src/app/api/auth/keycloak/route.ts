import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getKeycloakPublicUrl } from '@/lib/keycloak';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const idp = url.searchParams.get('idp'); // e.g. 'google'
    const callbackUrl = url.searchParams.get('callbackUrl') || '/';

    const proto = req.headers.get('x-forwarded-proto') || (req.headers.get('x-forwarded-ssl') === 'on' ? 'https' : req.nextUrl.protocol.replace(':', ''));
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
    const baseUrl = `${proto}://${host}`;

    const redirectUri = `${baseUrl}/api/auth/callback/keycloak`;

    let dbSettings = null;
    try {
      dbSettings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    } catch (e) {
      console.warn('Failed to query dbSettings in keycloak route, using fallbacks', e);
    }

    const keycloakPublicUrl = dbSettings?.keycloakPublicUrl || getKeycloakPublicUrl(req);
    const realm = dbSettings?.keycloakRealm || process.env.KEYCLOAK_REALM || 'cric-college';
    const clientId = dbSettings?.keycloakClientId || process.env.KEYCLOAK_CLIENT_ID || 'cric-portal';

    const state = crypto.randomBytes(16).toString('hex');
    const authEndpoint = `${keycloakPublicUrl}/realms/${realm}/protocol/openid-connect/auth`;

    const authUrl = new URL(authEndpoint);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);

    if (idp) {
      authUrl.searchParams.set('kc_idp_hint', idp);
    }

    const response = NextResponse.redirect(authUrl.toString());

    // Save state, redirectUri, and callbackUrl in temporary cookies
    response.cookies.set('cric_keycloak_state', state, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'lax',
    });

    response.cookies.set('cric_keycloak_redirect_uri', redirectUri, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
    });

    response.cookies.set('cric_keycloak_callback_url', callbackUrl, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Keycloak login initiation error:', err);
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('ไม่สามารถเชื่อมต่อไปยังระบบ SSO กลางได้'), req.url));
  }
}
