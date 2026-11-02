import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { UserRole } from '@/types/service';

export function hashUserPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  passwordHash: string | null;
  displayName: string;
  department: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  authProvider: 'local' | 'google' | 'keycloak';
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export async function readLocalUsers(): Promise<UserEntity[]> {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read data/users.json', err);
    return [];
  }
}

export async function writeLocalUsers(users: UserEntity[]): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write data/users.json', err);
  }
}

// Initial seeding if empty
export async function seedInitialUsers(): Promise<void> {
  try {
    let count = 0;
    try {
      count = await prisma.user.count();
    } catch {
      const local = await readLocalUsers();
      count = local.length;
    }

    if (count > 0) return;

    // Check Master Admin in data/admin.json
    const adminFilePath = path.join(DATA_DIR, 'admin.json');
    let masterAdmin: any = null;
    if (fs.existsSync(adminFilePath)) {
      try {
        masterAdmin = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));
      } catch {}
    }

    const defaultAdminHash = masterAdmin?.passwordHash || hashUserPassword('admin123');
    const adminEmail = masterAdmin?.email || 'admin@cric.ac.th';
    const adminName = masterAdmin?.name || 'ผู้ดูแลระบบ CRIC (Administrator)';

    const initialUsers: UserEntity[] = [
      {
        id: 'usr_admin_001',
        username: 'admin',
        email: adminEmail.toLowerCase().trim(),
        passwordHash: defaultAdminHash,
        displayName: adminName,
        department: 'สำนักพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isActive: true,
        authProvider: 'local',
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_teacher_001',
        username: 'teacher',
        email: 'teacher@cric.ac.th',
        passwordHash: hashUserPassword('teacher123'),
        displayName: 'อ. ภัทรวดี วิทยากร',
        department: 'แผนกวิชาช่างเทคนิคคอมพิวเตอร์',
        role: 'teacher',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isActive: true,
        authProvider: 'local',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_staff_001',
        username: 'staff',
        email: 'staff@cric.ac.th',
        passwordHash: hashUserPassword('staff123'),
        displayName: 'สุนีย์ วิจิตรศิลป์',
        department: 'งานบริการการศึกษาและพัฒนาหลักสูตร',
        role: 'staff',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        isActive: true,
        authProvider: 'local',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_student_001',
        username: 'student',
        email: 'student@cric.ac.th',
        passwordHash: hashUserPassword('student123'),
        displayName: 'นาย ภานุวัฒน์ ใฝ่เรียนดี',
        department: 'สาขาวิชาเทคโนโลยีสารสนเทศ (ปวส.1)',
        role: 'student',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        isActive: true,
        authProvider: 'local',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    try {
      for (const u of initialUsers) {
        await prisma.user.create({
          data: {
            ...u,
            role: u.role as string,
          },
        });
      }
    } catch (e: any) {
      console.warn('DB seed failed, writing to data/users.json fallback:', e.message);
    }

    await writeLocalUsers(initialUsers);
  } catch (err) {
    console.error('seedInitialUsers error:', err);
  }
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function getAllUsers(filter?: { search?: string; role?: string; status?: string }) {
  await seedInitialUsers();

  try {
    const where: any = {};

    if (filter?.role && filter.role !== 'all') {
      where.role = filter.role;
    }

    if (filter?.status && filter.status !== 'all') {
      where.isActive = filter.status === 'active';
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(sanitizeUser);
  } catch (dbErr: any) {
    console.warn('Prisma getAllUsers failed, falling back to local file:', dbErr.message);
    let local = await readLocalUsers();

    if (filter?.role && filter.role !== 'all') {
      local = local.filter((u) => u.role === filter.role);
    }
    if (filter?.status && filter.status !== 'all') {
      const wantActive = filter.status === 'active';
      local = local.filter((u) => u.isActive === wantActive);
    }
    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      local = local.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    return local.map(sanitizeUser);
  }
}

export async function findUserByLoginIdentifier(identifier: string) {
  await seedInitialUsers();
  const clean = identifier.trim().toLowerCase();

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: clean, mode: 'insensitive' } },
          { email: { equals: clean, mode: 'insensitive' } },
        ],
      },
    });
    return user;
  } catch {
    const local = await readLocalUsers();
    return local.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    ) || null;
  }
}

export async function findUserByEmail(email: string) {
  const clean = email.trim().toLowerCase();
  try {
    return await prisma.user.findUnique({
      where: { email: clean },
    });
  } catch {
    const local = await readLocalUsers();
    return local.find((u) => u.email.toLowerCase() === clean) || null;
  }
}

export async function recordUserLogin(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    const local = await readLocalUsers();
    const idx = local.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      local[idx].lastLoginAt = new Date();
      await writeLocalUsers(local);
    }
  }
}
