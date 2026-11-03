import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';
import { hashUserPassword, readLocalUsers, writeLocalUsers } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.roles.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    const passwordHash = hashUserPassword(newPassword);

    try {
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
    } catch (e: any) {
      console.warn('Prisma password update failed, fallback to local users.json:', e.message);
      const local = await readLocalUsers();
      const idx = local.findIndex((u) => u.id === id);
      if (idx !== -1) {
        local[idx].passwordHash = passwordHash;
        local[idx].updatedAt = new Date();
        await writeLocalUsers(local);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านของผู้ใช้งานสำเร็จ',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
