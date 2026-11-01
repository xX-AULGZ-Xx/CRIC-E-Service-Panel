import { cookies } from 'next/headers';
import { UserRole, UserSession } from '@/types/service';

export const DEFAULT_USERS: Record<UserRole, UserSession> = {
  admin: {
    userId: 'user-admin-001',
    username: 'admin',
    displayName: 'ผู้ดูแลระบบ CRIC (Administrator)',
    email: 'admin@cric.ac.th',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    roles: ['admin', 'staff', 'teacher'],
    currentRole: 'admin',
  },
  teacher: {
    userId: 'user-teacher-001',
    username: 'ajarn.prasert',
    displayName: 'อาจารย์ ประเสริฐ กาญจนสุข (Teacher)',
    email: 'prasert.k@cric.ac.th',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    roles: ['teacher'],
    currentRole: 'teacher',
  },
  staff: {
    userId: 'user-staff-001',
    username: 'staff.sunee',
    displayName: 'สุนีย์ วิจิตรศิลป์ (Staff / Officer)',
    email: 'sunee.w@cric.ac.th',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    roles: ['staff'],
    currentRole: 'staff',
  },
  student: {
    userId: 'user-student-001',
    username: 'somchai.s67',
    displayName: 'สมชาย รักเรียน (Student)',
    email: 'somchai.s67@cric.ac.th',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    roles: ['student'],
    currentRole: 'student',
  },
};

export async function getCurrentUserSession(): Promise<UserSession> {
  const cookieStore = await cookies();
  const selectedRole = (cookieStore.get('cric_active_role')?.value || 'admin') as UserRole;
  
  if (DEFAULT_USERS[selectedRole]) {
    return DEFAULT_USERS[selectedRole];
  }

  return DEFAULT_USERS.admin;
}

export function isUserAuthorizedForService(userRoles: string[], serviceAllowedRoles: string[]): boolean {
  // If service has no specific roles assigned, it's public to all authenticated users
  if (!serviceAllowedRoles || serviceAllowedRoles.length === 0) {
    return true;
  }
  // Admin role can always see all services
  if (userRoles.includes('admin')) {
    return true;
  }
  return serviceAllowedRoles.some((role) => userRoles.includes(role));
}
