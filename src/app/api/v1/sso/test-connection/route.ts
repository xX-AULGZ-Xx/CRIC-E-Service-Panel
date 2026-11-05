import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserSession } from '@/lib/auth';
import { getSystemSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const settings = await getSystemSettings();

    const targetUrl = (body.url || settings.keycloakPublicUrl || 'https://sso.cric.ac.th').replace(/\/$/, '');
    const realm = (body.realm || settings.keycloakRealm || 'cric-college').trim();

    const discoveryUrl = `${targetUrl}/realms/${realm}/.well-known/openid-configuration`;

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(discoveryUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          latencyMs,
          statusCode: response.status,
          discoveryUrl,
          message: `เซิร์ฟเวอร์ตอบกลับด้วยรหัส HTTP ${response.status} (${response.statusText})`,
        });
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        latencyMs,
        statusCode: response.status,
        discoveryUrl,
        issuer: data.issuer || `${targetUrl}/realms/${realm}`,
        authorizationEndpoint: data.authorization_endpoint,
        tokenEndpoint: data.token_endpoint,
        userinfoEndpoint: data.userinfo_endpoint,
        endSessionEndpoint: data.end_session_endpoint,
        message: 'เชื่อมต่อ Keycloak Central SSO สำเร็จและพบ OpenID Discovery Configuration ครบถ้วน',
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const isTimeout = fetchErr.name === 'AbortError';

      return NextResponse.json({
        success: false,
        latencyMs,
        discoveryUrl,
        message: isTimeout
          ? 'การเชื่อมต่อไปยัง Keycloak หมดเวลา (Timeout เกิน 6 วินาที)'
          : `ไม่สามารถเชื่อมต่อไปยัง Keycloak ได้: ${fetchErr.message || 'Network unreachable'}`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
