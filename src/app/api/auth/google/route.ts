import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSystemSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const settings = await getSystemSettings();

    // Check if Google Workspace login is enabled
    if (!settings.googleAuthEnabled) {
      const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('การเข้าสู่ระบบด้วย Google Workspace ถูกปิดการใช้งานในระบบ'), `${proto}://${host}`)
      );
    }

    // Check if credentials exist
    if (!settings.googleClientId || !settings.googleClientId.trim()) {
      const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('ยังไม่ได้ระบุ Google Client ID ในหน้าตั้งค่าแอดมิน (Admin Settings > Google Auth Key)'), `${proto}://${host}`)
      );
    }

    if (!settings.googleClientSecret || !settings.googleClientSecret.trim()) {
      const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('ยังไม่ได้ระบุ Google Client Secret ในหน้าตั้งค่าแอดมิน (Admin Settings > Google Auth Key)'), `${proto}://${host}`)
      );
    }

    // Resolve Origin & Redirect URI
    const proto = req.headers.get('x-forwarded-proto') || (req.headers.get('x-forwarded-ssl') === 'on' ? 'https' : req.nextUrl.protocol.replace(':', ''));
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
    const redirectUri = `${proto}://${host}/api/auth/callback/google`;

    // Generate random CSRF state
    const state = crypto.randomBytes(24).toString('hex');

    // Build Google OAuth 2.0 URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', settings.googleClientId.trim());
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    googleAuthUrl.searchParams.set('state', state);

    // If Hosted Domain is specified, enforce it in Google consent screen
    if (settings.googleHostedDomain && settings.googleHostedDomain.trim()) {
      googleAuthUrl.searchParams.set('hd', settings.googleHostedDomain.trim());
    }

    const response = NextResponse.redirect(googleAuthUrl.toString());

    // Set state cookie
    response.cookies.set('cric_oauth_state', state, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'lax',
      secure: proto === 'https',
    });

    // Save exact redirect URI cookie to guarantee matching token exchange
    response.cookies.set('cric_oauth_redirect_uri', redirectUri, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
      secure: proto === 'https',
    });

    return response;
  } catch (error: any) {
    console.error('Google Auth Route Error:', error);
    const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('ไม่สามารถเชื่อมต่อไปยัง Google ได้: ' + (error.message || 'Error')), `${proto}://${host}`)
    );
  }
}
