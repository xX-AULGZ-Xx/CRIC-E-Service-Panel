export type UserRole = 'student' | 'teacher' | 'staff' | 'admin';

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
