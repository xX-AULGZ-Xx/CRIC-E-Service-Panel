import { prisma } from '@/lib/prisma';
import { isUserAuthorizedForService } from '@/lib/auth';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { ServiceItem } from '@/types/service';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

export async function readLocalServices(): Promise<any[]> {
  try {
    const raw = await readFile(SERVICES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeLocalServices(data: any[]) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(SERVICES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local services fallback', err);
  }
}

/**
 * Fetch and enrich services from PostgreSQL (or local JSON fallback),
 * filtering by active status and role-based access unless `includeAll` is true.
 */
export async function getServicesForRole(options: {
  role?: string;
  userId?: string;
  includeAll?: boolean;
}): Promise<ServiceItem[]> {
  const { role = 'guest', userId, includeAll = false } = options;
  let services: any[] = [];

  try {
    services = await prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        userFavorites: userId
          ? {
              where: {
                userId,
              },
            }
          : false,
      },
    });
    await writeLocalServices(services);
  } catch (dbErr: any) {
    console.warn('Database query failed, reading from local storage:', dbErr.message);
    services = await readLocalServices();
  }

  const enriched = services.map((s) => ({
    ...s,
    isFavorite:
      s.userFavorites?.length > 0 ||
      (s.isDefaultFavorite && (!s.userFavorites || s.userFavorites.length === 0)),
    favoriteOrder: s.userFavorites?.[0]?.sortOrder ?? (s.isDefaultFavorite ? s.sortOrder : 999),
  }));

  if (includeAll) {
    return enriched;
  }

  return enriched.filter((service) => {
    if (!service.isActive) return false;
    return isUserAuthorizedForService([role], service.allowedRoles);
  });
}
