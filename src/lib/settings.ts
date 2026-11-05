import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export interface SystemSettingsData {
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
  googleClientId: string | null;
  googleClientSecret: string | null;
  googleHostedDomain: string | null;

  // Keycloak Central SSO Integration
  keycloakPublicUrl: string | null;
  keycloakInternalUrl: string | null;
  keycloakClientId: string | null;
  keycloakClientSecret: string | null;
  centralGatewayEnabled: boolean;
}

export const DEFAULT_SETTINGS: SystemSettingsData = {
  id: 'default',
  collegeNameTh: 'วิทยาลัยอาชีวศึกษา CRIC',
  collegeNameEn: 'CRIC Vocational College',
  portalTitle: 'CRIC E-Service Panel',
  portalSubtitle: 'ศูนย์รวมบริการดิจิทัลสำหรับนักศึกษาและบุคลากร',
  logoUrl: null,
  contactEmail: 'support@cric.ac.th',
  contactPhone: '02-123-4567',
  helpdeskUrl: 'https://helpdesk.cric.ac.th',
  footerText: '© 2026 CRIC College. All rights reserved.',
  maintenanceMode: false,
  maintenanceMessage: 'ระบบกำลังอยู่ระหว่างการปรับปรุงชั่วคราว เพื่อพัฒนาประสิทธิภาพการบริการ ขออภัยในความไม่สะดวก',
  allowUserCustomFavorites: true,
  showEmbedWidgetSnippet: true,
  demoModeEnabled: true,
  keycloakRealm: 'cric-college',
  allowedEmailDomains: 'cric.ac.th, student.cric.ac.th',
  sessionTimeoutMinutes: 120,

  // Google OAuth 2.0 Integration
  googleAuthEnabled: false,
  googleClientId: null,
  googleClientSecret: null,
  googleHostedDomain: 'cric.ac.th',

  // Keycloak Central SSO Integration
  keycloakPublicUrl: 'https://sso.cric.ac.th',
  keycloakInternalUrl: 'http://keycloak:8080',
  keycloakClientId: 'cric-portal',
  keycloakClientSecret: null,
  centralGatewayEnabled: true,
};

export function isEnvDemoModeDisabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === 'false' ||
    process.env.DEMO_MODE === 'false'
  );
}

export async function isDemoModeActive(): Promise<boolean> {
  if (isEnvDemoModeDisabled()) {
    return false;
  }
  const settings = await getSystemSettings();
  return settings.demoModeEnabled !== false;
}

export async function getSystemSettings(): Promise<SystemSettingsData> {
  const isEnvDisabled = isEnvDemoModeDisabled();

  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });
    if (settings) {
      return {
        ...DEFAULT_SETTINGS,
        ...settings,
        demoModeEnabled: isEnvDisabled ? false : settings.demoModeEnabled !== false,
      };
    }
  } catch (e) {
    // Database query failed or table not found, fallback to local file
  }

  const filePath = path.join(process.cwd(), 'data', 'settings.json');
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        demoModeEnabled: isEnvDisabled ? false : data.demoModeEnabled !== false,
      };
    } catch {}
  }

  return {
    ...DEFAULT_SETTINGS,
    demoModeEnabled: isEnvDisabled ? false : DEFAULT_SETTINGS.demoModeEnabled,
  };
}
