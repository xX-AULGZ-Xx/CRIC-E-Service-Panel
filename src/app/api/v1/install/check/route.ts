import { NextResponse } from 'next/server';
import { checkSystemPreflight } from '@/lib/install';

export async function GET() {
  try {
    const preflight = await checkSystemPreflight();
    return NextResponse.json({
      success: true,
      data: preflight,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to perform preflight checks',
      },
      { status: 500 }
    );
  }
}
