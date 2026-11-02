import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'ออกจากระบบเรียบร้อยแล้ว',
  });

  // Clear session cookies
  response.cookies.set('cric_logged_in', '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('cric_active_role', '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('cric_user_profile', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
