import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';
import { ensureDivisionsSeeded } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    await ensureDivisionsSeeded();

    const divisions = await prisma.division.findMany({
      include: {
        departments: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Sort 4 main Thai vocational divisions cleanly
    const codeOrder: Record<string, number> = {
      ACAD: 1,
      RES: 2,
      DEV: 3,
      STRAT: 4,
    };

    const sorted = [...divisions].sort((a, b) => {
      const orderA = codeOrder[a.code.toUpperCase()] ?? 99;
      const orderB = codeOrder[b.code.toUpperCase()] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, 'th');
    });

    return NextResponse.json({
      success: true,
      data: sorted,
    });
  } catch (error: any) {
    console.error('GET /api/v1/divisions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, name, code, divisionId } = body;

    if (type === 'department') {
      if (!name || !divisionId) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุชื่อแผนก/งาน และฝ่ายต้นสังกัด' },
          { status: 400 }
        );
      }

      const dept = await prisma.department.create({
        data: {
          name: String(name).trim(),
          divisionId: String(divisionId),
        },
        include: { division: true },
      });

      return NextResponse.json({
        success: true,
        message: 'เพิ่มแผนก/งานเรียบร้อยแล้ว',
        data: dept,
      });
    }

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อฝ่ายและรหัสฝ่าย' },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existing = await prisma.division.findFirst({
      where: { code: { equals: cleanCode, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `รหัสฝ่าย "${cleanCode}" มีอยู่ในระบบแล้ว` },
        { status: 400 }
      );
    }

    const division = await prisma.division.create({
      data: {
        name: String(name).trim(),
        code: cleanCode,
      },
      include: { departments: true },
    });

    return NextResponse.json({
      success: true,
      message: 'เพิ่มฝ่ายงานเรียบร้อยแล้ว',
      data: division,
    });
  } catch (error: any) {
    console.error('POST /api/v1/divisions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create division/department' },
      { status: 500 }
    );
  }
}
