import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ALL_USER_ROLES, getCurrentUserSession } from '@/lib/auth';
import { 
  getAllUsers, 
  hashUserPassword, 
  readLocalUsers, 
  writeLocalUsers, 
  sanitizeUser,
  saveUserDepartments,
  UserEntity 
} from '@/lib/users';
import { UserRole } from '@/types/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;

    const users = await getAllUsers({ search, role, status });

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    console.error('GET /api/v1/users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
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
    const {
      username,
      email,
      password,
      displayName,
      department,
      position,
      personnelType,
      departmentIds,
      headDeptIds,
      role,
      avatarUrl,
    } = body;

    if (!username || !displayName) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอก Username และชื่อ-นามสกุลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = (email && String(email).trim() ? String(email).trim() : `${cleanUsername}@cric.ac.th`).toLowerCase();
    const targetRole: UserRole = ALL_USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'student';

    // Check duplicate username or email in DB
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: cleanUsername },
            { email: cleanEmail },
          ],
        },
      });

      if (existing) {
        if (existing.username.toLowerCase() === cleanUsername) {
          return NextResponse.json(
            { success: false, error: `ชื่อผู้ใช้ "${cleanUsername}" มีอยู่ในระบบแล้ว` },
            { status: 400 }
          );
        }
        if (existing.email.toLowerCase() === cleanEmail) {
          return NextResponse.json(
            { success: false, error: `อีเมล "${cleanEmail}" มีอยู่ในระบบแล้ว` },
            { status: 400 }
          );
        }
      }
    } catch {
      // Local file duplicate check fallback
      const local = await readLocalUsers();
      if (local.some((u) => u.username.toLowerCase() === cleanUsername)) {
        return NextResponse.json(
          { success: false, error: `ชื่อผู้ใช้ "${cleanUsername}" มีอยู่ในระบบแล้ว` },
          { status: 400 }
        );
      }
      if (local.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json(
          { success: false, error: `อีเมล "${cleanEmail}" มีอยู่ในระบบแล้ว` },
          { status: 400 }
        );
      }
    }

    const passwordHash = password ? hashUserPassword(password) : hashUserPassword('password123');

    let createdUser: any;
    try {
      createdUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          displayName: displayName.trim(),
          department: department ? department.trim() : null,
          position: position ? position.trim() : null,
          personnelType: personnelType ? String(personnelType).trim() : null,
          sourceSystem: 'panel',
          role: targetRole,
          avatarUrl: avatarUrl || null,
          isActive: true,
          authProvider: 'local',
        },
      });

      if (Array.isArray(departmentIds)) {
        await saveUserDepartments(
          createdUser.id,
          departmentIds,
          Array.isArray(headDeptIds) ? headDeptIds : [],
          department ? department.trim() : null
        );
      }

      createdUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          departments: {
            include: {
              department: {
                include: { division: true },
              },
            },
          },
        },
      });
    } catch (e: any) {
      console.warn('Prisma create failed, writing to local users.json:', e.message);
      const newUser: UserEntity = {
        id: `usr_${Date.now()}`,
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        displayName: displayName.trim(),
        department: department ? department.trim() : null,
        position: position ? position.trim() : null,
        personnelType: personnelType ? String(personnelType).trim() : null,
        sourceSystem: 'panel',
        role: targetRole,
        avatarUrl: avatarUrl || null,
        isActive: true,
        authProvider: 'local',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const local = await readLocalUsers();
      local.unshift(newUser);
      await writeLocalUsers(local);
      createdUser = newUser;
    }

    return NextResponse.json({
      success: true,
      message: 'สร้างผู้ใช้งานใหม่เรียบร้อยแล้ว',
      data: sanitizeUser(createdUser),
    });
  } catch (error: any) {
    console.error('POST /api/v1/users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
