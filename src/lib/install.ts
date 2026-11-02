import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

const LOCK_FILE = path.join(process.cwd(), 'data', 'installed.lock');

export interface InstallLockInfo {
  installed: boolean;
  installedAt: string;
  version: string;
  adminEmail: string;
  collegeNameTh?: string;
  collegeNameEn?: string;
}

export interface PreflightCheckResult {
  node: { ok: boolean; version: string; message: string };
  database: { ok: boolean; type: string; urlHost: string; message: string };
  keycloak: { ok: boolean; url: string; message: string };
  storage: { ok: boolean; dataWritable: boolean; uploadsWritable: boolean; message: string };
  isInstalled: boolean;
  allPassed: boolean;
}

/**
 * Checks if the system has completed initial installation
 */
export function isSystemInstalled(): boolean {
  try {
    return fs.existsSync(LOCK_FILE);
  } catch {
    return false;
  }
}

/**
 * Reads installation metadata
 */
export function getInstallLockInfo(): InstallLockInfo | null {
  try {
    if (!fs.existsSync(LOCK_FILE)) return null;
    const content = fs.readFileSync(LOCK_FILE, 'utf-8');
    return JSON.parse(content) as InstallLockInfo;
  } catch {
    return null;
  }
}

/**
 * Creates the installed.lock file
 */
export function createInstallLock(data: Omit<InstallLockInfo, 'installed' | 'installedAt' | 'version'>): void {
  const dir = path.dirname(LOCK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const payload: InstallLockInfo = {
    installed: true,
    installedAt: new Date().toISOString(),
    version: '1.0.0',
    ...data,
  };

  fs.writeFileSync(LOCK_FILE, JSON.stringify(payload, null, 2), 'utf-8');
}

/**
 * Runs pre-flight environment checks
 */
export async function checkSystemPreflight(): Promise<PreflightCheckResult> {
  const isInstalled = isSystemInstalled();

  // 1. Node.js Version Check (Requires >= 18.0.0)
  const nodeVer = process.version;
  const majorVer = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  const nodeOk = majorVer >= 18;

  // 2. Database Check (PostgreSQL via Prisma)
  let dbOk = false;
  let dbHost = 'localhost:5433';
  let dbMessage = 'พร้อมเชื่อมต่อฐานข้อมูล';
  try {
    const rawUrl = process.env.DATABASE_URL || '';
    if (rawUrl.includes('@')) {
      dbHost = rawUrl.split('@')[1].split('/')[0];
    }
    // Test raw query
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    dbMessage = `เชื่อมต่อฐานข้อมูล PostgreSQL (${dbHost}) สำเร็จ`;
  } catch (err: any) {
    dbOk = false;
    dbMessage = `ไม่สามารถเชื่อมต่อฐานข้อมูล: ${err.message || 'Connection refused'}`;
  }

  // 3. Keycloak Check
  let keycloakOk = false;
  const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8085';
  let keycloakMessage = 'พร้อมเชื่อมต่อ Keycloak SSO';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const kcRes = await fetch(`${keycloakUrl}/realms/cric-college`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (kcRes.ok || kcRes.status === 200 || kcRes.status === 404) {
      keycloakOk = true;
      keycloakMessage = `เชื่อมต่อ Keycloak SSO Server (${keycloakUrl}) พร้อมทำงาน`;
    } else {
      keycloakMessage = `Keycloak ตอบสนองด้วยสถานะ HTTP ${kcRes.status}`;
    }
  } catch (err: any) {
    // Note: Keycloak is not strictly blocking for initial setup because demo mode / local auth exists
    keycloakOk = false;
    keycloakMessage = `ไม่พบการเชื่อมต่อ Keycloak ที่ ${keycloakUrl} (สามารถเริ่มระบบในโหมด Local / Demo ก่อนได้)`;
  }

  // 4. Storage Write Permissions Check
  let dataWritable = false;
  let uploadsWritable = false;
  let storageFailReason = '';

  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true, mode: 0o777 });
      } catch (mkdirErr: any) {
        storageFailReason = `สร้างโฟลเดอร์ data/ ไม่ได้ (${mkdirErr.code || mkdirErr.message})`;
      }
    }
    const testDataFile = path.join(dataDir, '.test-perm');
    fs.writeFileSync(testDataFile, 'test');
    fs.unlinkSync(testDataFile);
    dataWritable = true;
  } catch (err: any) {
    dataWritable = false;
    if (!storageFailReason) {
      storageFailReason = `เขียนโฟลเดอร์ data/ ไม่ได้ (${err.code || err.message})`;
    }
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o777 });
      } catch (mkdirErr: any) {
        storageFailReason = `สร้างโฟลเดอร์ public/uploads/ ไม่ได้ (${mkdirErr.code || mkdirErr.message})`;
      }
    }
    const testUploadFile = path.join(uploadsDir, '.test-perm');
    fs.writeFileSync(testUploadFile, 'test');
    fs.unlinkSync(testUploadFile);
    uploadsWritable = true;
  } catch (err: any) {
    uploadsWritable = false;
    if (!storageFailReason) {
      storageFailReason = `เขียนโฟลเดอร์ public/uploads/ ไม่ได้ (${err.code || err.message})`;
    }
  }

  const storageOk = dataWritable && uploadsWritable;
  const storageMessage = storageOk
    ? 'สิทธิ์การบันทึกไฟล์ (Storage Write Permission) สมบูรณ์'
    : `${storageFailReason || 'โฟลเดอร์ data/ หรือ public/uploads/ ไม่มีสิทธิ์เขียนไฟล์'} (แนะนำรัน: docker exec -u 0 cric-portal chmod -R 777 /app/data /app/public/uploads)`;

  const allPassed = nodeOk && dbOk && storageOk;

  return {
    node: {
      ok: nodeOk,
      version: nodeVer,
      message: nodeOk ? `Node.js ${nodeVer} ตรงตามข้อกำหนด (>= 18.x)` : `Node.js ${nodeVer} ต่ำกว่าที่กำหนด`,
    },
    database: {
      ok: dbOk,
      type: 'PostgreSQL',
      urlHost: dbHost,
      message: dbMessage,
    },
    keycloak: {
      ok: keycloakOk,
      url: keycloakUrl,
      message: keycloakMessage,
    },
    storage: {
      ok: storageOk,
      dataWritable,
      uploadsWritable,
      message: storageMessage,
    },
    isInstalled,
    allPassed,
  };
}
