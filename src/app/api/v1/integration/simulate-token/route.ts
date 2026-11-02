import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_USERS } from '@/lib/auth';
import { UserRole } from '@/types/service';

const REGISTERED_CLIENTS: Record<string, { name: string; secret: string; rootUrl: string }> = {
  'cric-plan-app': {
    name: 'ระบบแผนงานและงบประมาณ (CRIC Plan)',
    secret: 'cric-plan-secret-key-2026',
    rootUrl: 'https://plan.cric.ac.th',
  },
  'cric-rcms-app': {
    name: 'ระบบบริหารจัดการงานวิจัยและวิทยาลัย (CRIC RCMS)',
    secret: 'cric-rcms-secret-key-2026',
    rootUrl: 'https://rcms.cric.ac.th',
  },
  'cric-portal': {
    name: 'CRIC E-Service Portal',
    secret: 'cric-portal-secret-key',
    rootUrl: 'http://localhost:3000',
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId = 'cric-plan-app', role = 'teacher' } = body as {
      clientId: string;
      role: UserRole;
    };

    const client = REGISTERED_CLIENTS[clientId];
    if (!client) {
      return NextResponse.json(
        { success: false, error: `Client ID '${clientId}' is not registered.` },
        { status: 400 }
      );
    }

    const user = DEFAULT_USERS[role] || DEFAULT_USERS.teacher;

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 3600;

    const payload = {
      iss: 'https://sso.cric.ac.th/realms/cric-college',
      sub: user.userId,
      aud: ['account', clientId],
      azp: clientId,
      exp: expiresAt,
      iat: issuedAt,
      auth_time: issuedAt,
      session_state: 'sess_' + Math.random().toString(36).substring(2, 12),
      typ: 'Bearer',
      email: user.email,
      email_verified: true,
      name: user.displayName,
      preferred_username: user.username,
      realm_access: {
        roles: user.roles,
      },
      resource_access: {
        [clientId]: {
          roles: [`${role}_access`],
        },
      },
      scope: 'openid email profile',
    };

    // Simulated Base64url JWT tokens for inspection
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'cric-key-2026-v1' })).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = Buffer.from('simulated_rs256_cryptographic_signature_cric_idp').toString('base64url');
    const rawJwt = `${header}.${encodedPayload}.${signature}`;

    return NextResponse.json({
      success: true,
      data: {
        client,
        access_token: rawJwt,
        id_token: rawJwt,
        token_type: 'Bearer',
        expires_in: 3600,
        decoded_payload: payload,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Simulation error' },
      { status: 500 }
    );
  }
}
