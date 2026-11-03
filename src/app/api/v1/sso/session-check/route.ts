import { NextRequest, NextResponse } from 'next/server';
import { verifySsoJwt } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  let cleanOrigin = '';
  try {
    if (origin.startsWith('http')) {
      const u = new URL(origin);
      cleanOrigin = `${u.protocol}//${u.host}`;
    }
  } catch {}

  const isAllowedOrigin = 
    cleanOrigin.endsWith('.cric.ac.th') || 
    cleanOrigin === 'https://cric.ac.th' ||
    cleanOrigin.includes('localhost') || 
    cleanOrigin.includes('127.0.0.1');

  const allowedOrigin = isAllowedOrigin ? cleanOrigin : 'https://panel.cric.ac.th';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const ssoCookie = req.cookies.get('cric_sso_session')?.value;
    const loggedInCookie = req.cookies.get('cric_logged_in')?.value;

    if (!ssoCookie || loggedInCookie !== 'true') {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          user: null,
        },
        { headers: corsHeaders }
      );
    }

    const payload = verifySsoJwt(ssoCookie);

    if (!payload) {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          user: null,
          message: 'เซสชันหมดอายุหรือไม่ถูกต้อง',
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        ssoToken: ssoCookie,
        user: {
          email: payload.email,
          username: payload.username,
          name: payload.name,
          role: payload.role,
          avatarUrl: payload.picture || null,
        },
        sessionExpiresAt: payload.exp ? payload.exp * 1000 : null,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Session check error:', error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: error.message || 'Error checking session',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
