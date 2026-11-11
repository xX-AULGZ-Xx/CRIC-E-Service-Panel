export type UserRole =
  | 'admin'
  | 'director'
  | 'deputy_director'
  | 'planning_officer'
  | 'head_dept'
  | 'teacher'
  | 'staff'
  | 'student'
  | 'guest';

export interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  iconUrl: string;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  allowedRoles: string[];
  openInNewTab: boolean;
  isActive: boolean;
  isDefaultFavorite: boolean;
  sortOrder: number;
  isFavorite?: boolean;
  favoriteOrder?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface UserSession {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  currentRole: UserRole;
}

export interface SystemSetting {
  id: string;
  collegeNameTh: string;
  collegeNameEn: string;
  portalTitle: string;
  portalSubtitle: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  helpdeskUrl: string | null;
  footerText: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowUserCustomFavorites: boolean;
  showEmbedWidgetSnippet: boolean;
  demoModeEnabled: boolean;
  keycloakRealm: string;
  allowedEmailDomains: string;
  sessionTimeoutMinutes: number;

  // Google OAuth 2.0 Integration
  googleAuthEnabled: boolean;
  googleClientId?: string | null;
  googleClientSecret?: string | null;
  googleHostedDomain?: string | null;

  // Keycloak Central SSO Integration
  keycloakPublicUrl?: string | null;
  keycloakInternalUrl?: string | null;
  keycloakClientId?: string | null;
  keycloakClientSecret?: string | null;
  centralGatewayEnabled?: boolean;

  updatedAt?: string | Date;
}

export interface DivisionItem {
  id: string;
  code: string;
  name: string;
  externalId?: number | null;
  departments?: DepartmentItem[];
}

export interface DepartmentItem {
  id: string;
  divisionId: string;
  name: string;
  externalId?: number | null;
  division?: DivisionItem;
}

export interface UserDepartmentAssignment {
  id: string;
  userId: string;
  departmentId: string;
  isHead: boolean;
  department?: DepartmentItem;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  displayName: string;
  department: string | null;
  position?: string | null;
  personnelType?: 'TEACHER' | 'STAFF' | 'STUDENT' | string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  authProvider: 'local' | 'google' | 'keycloak';
  sourceSystem?: string | null;
  externalId?: string | null;
  lastLoginAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  departments?: UserDepartmentAssignment[];
}
