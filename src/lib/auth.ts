import { cookies } from 'next/headers';
import { UserRole, UserSession } from '@/types/service';

export const ALL_USER_ROLES: UserRole[] = [
  'admin',
  'director',
  'deputy_director',
  'planning_officer',
  'head_dept',
  'teacher',
  'staff',
  'student',
  'guest',
];

export const ROLE_LABELS_TH: Record<UserRole, string> = {
  admin: 'ผู้ดูแลระบบ',
  director: 'ผู้อำนวยการ',
  deputy_director: 'รองผู้อำนวยการ',
  planning_officer: 'เจ้าหน้าที่แผนงาน',
  head_dept: 'หัวหน้าแผนก/งาน',
  teacher: 'ครู / อาจารย์',
  staff: 'เจ้าหน้าที่',
  student: 'นักเรียน / นักศึกษา',
  guest: 'บุคคลทั่วไป',
};

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
  director: {
    userId: 'user-director-001',
    username: 'director',
    displayName: 'ผู้อำนวยการวิทยาลัย (Director)',
    email: 'director@cric.ac.th',
    avatarUrl: undefined,
    roles: ['director'],
    currentRole: 'director',
  },
  deputy_director: {
    userId: 'user-deputy-001',
    username: 'deputy.strat',
    displayName: 'รองผู้อำนวยการ (Deputy Director)',
    email: 'deputy@cric.ac.th',
    avatarUrl: undefined,
    roles: ['deputy_director'],
    currentRole: 'deputy_director',
  },
  planning_officer: {
    userId: 'user-planning-001',
    username: 'planning1',
    displayName: 'เจ้าหน้าที่งานวางแผน (Planning Officer)',
    email: 'planning@cric.ac.th',
    avatarUrl: undefined,
    roles: ['planning_officer'],
    currentRole: 'planning_officer',
  },
  head_dept: {
    userId: 'user-head-001',
    username: 'head.dept',
    displayName: 'หัวหน้าแผนก/หัวหน้างาน (Head of Dept)',
    email: 'head.dept@cric.ac.th',
    avatarUrl: undefined,
    roles: ['head_dept'],
    currentRole: 'head_dept',
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
  guest: {
    userId: 'user-guest-000',
    username: 'guest',
    displayName: 'บุคคลทั่วไป / สาธารณะ (Guest / Public)',
    email: 'guest@cric.ac.th',
    avatarUrl: undefined,
    roles: ['guest'],
    currentRole: 'guest',
  },
};

export async function getCurrentUserSession(): Promise<UserSession | null> {
  const isAuth = await isAuthenticatedUser();
  if (!isAuth) {
    return null;
  }

  const cookieStore = await cookies();
  const selectedRole = (cookieStore.get('cric_active_role')?.value || 'admin') as UserRole;
  const userProfileCookie = cookieStore.get('cric_user_profile')?.value;

  let customProfile: Partial<UserSession> | null = null;
  if (userProfileCookie) {
    try {
      customProfile = JSON.parse(decodeURIComponent(userProfileCookie));
    } catch {}
  }

  const baseUser = DEFAULT_USERS[selectedRole] || DEFAULT_USERS.admin;

  if (customProfile) {
    return {
      ...baseUser,
      ...customProfile,
      currentRole: selectedRole,
      roles: customProfile.roles && customProfile.roles.length > 0 ? customProfile.roles : [selectedRole],
    };
  }

  return baseUser;
}

export async function isAuthenticatedUser(): Promise<boolean> {
  const cookieStore = await cookies();
  const loggedInCookie = cookieStore.get('cric_logged_in')?.value;
  return loggedInCookie === 'true';
}

const ROLE_INHERITANCE: Record<string, string[]> = {
  director: ['director', 'deputy_director', 'planning_officer', 'head_dept', 'staff', 'teacher'],
  deputy_director: ['deputy_director', 'planning_officer', 'head_dept', 'staff', 'teacher'],
  planning_officer: ['planning_officer', 'staff', 'teacher'],
  head_dept: ['head_dept', 'teacher'],
};

export function isUserAuthorizedForService(userRoles: string[], serviceAllowedRoles: string[]): boolean {
  // If service has no specific roles assigned or explicitly allows 'guest', it is public to everyone
  if (!serviceAllowedRoles || serviceAllowedRoles.length === 0 || serviceAllowedRoles.includes('guest')) {
    return true;
  }

  // If user is guest / unauthenticated, but service does NOT include 'guest', deny access
  if (!userRoles || userRoles.length === 0 || userRoles.includes('guest')) {
    return false;
  }

  // Admin role can always see all services
  if (userRoles.includes('admin')) {
    return true;
  }

  // Expand organizational roles from Plan so personnel can access baseline internal services
  const effectiveRoles = new Set<string>(userRoles);
  for (const r of userRoles) {
    const inherited = ROLE_INHERITANCE[r];
    if (inherited) {
      inherited.forEach((ir) => effectiveRoles.add(ir));
    }
  }

  return serviceAllowedRoles.some((role) => effectiveRoles.has(role));
}
