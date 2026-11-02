import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';
import { readLocalUsers, writeLocalUsers, sanitizeUser } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUserSession();
    if (!session.roles.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    let user: any = null;
    try {
      user = await prisma.user.findUnique({ where: { id } });
    } catch {
      const local = await readLocalUsers();
      user = local.find((u) => u.id === id) || null;
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sanitizeUser(user) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUserSession();
    if (!session.roles.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { displayName, email, department, role, isActive, avatarUrl } = body;

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;

    let updatedUser: any = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (e: any) {
      console.warn('Prisma update failed, updating local file fallback:', e.message);
      const local = await readLocalUsers();
      const idx = local.findIndex((u) => u.id === id);
      if (idx !== -1) {
        local[idx] = {
          ...local[idx],
          ...updateData,
          updatedAt: new Date(),
        };
        await writeLocalUsers(local);
        updatedUser = local[idx];
      }
    }

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
      data: sanitizeUser(updatedUser),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUserSession();
    if (!session.roles.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Safety checks
    // 1. Prevent deleting self
    if (session.userId === id || session.email.toLowerCase() === id.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'ไม่อนุญาตให้ลบบัญชีผู้ดูแลระบบที่กำลังเข้าสู่ระบบอยู่' },
        { status: 400 }
      );
    }

    // 2. Prevent deleting the last admin
    let totalAdmins = 0;
    try {
      totalAdmins = await prisma.user.count({ where: { role: 'admin' } });
    } catch {
      const local = await readLocalUsers();
      totalAdmins = local.filter((u) => u.role === 'admin').length;
    }

    let targetUser: any = null;
    try {
      targetUser = await prisma.user.findUnique({ where: { id } });
    } catch {
      const local = await readLocalUsers();
      targetUser = local.find((u) => u.id === id) || null;
    }

    if (targetUser && targetUser.role === 'admin' && totalAdmins <= 1) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายของระบบได้' },
        { status: 400 }
      );
    }

    try {
      await prisma.user.delete({ where: { id } });
    } catch (e: any) {
      console.warn('Prisma delete failed, deleting from local users.json:', e.message);
      const local = await readLocalUsers();
      const filtered = local.filter((u) => u.id !== id);
      await writeLocalUsers(filtered);
    }

    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้งานเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
