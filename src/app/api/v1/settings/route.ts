import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const DEFAULT_SETTINGS = {
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
};

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function readLocalSettings() {
  try {
    const raw = await readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeLocalSettings(data: any) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local settings fallback', err);
  }
}

export async function GET() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.warn('Prisma query failed, falling back to local file storage:', error.message);
    const local = await readLocalSettings();
    return NextResponse.json({
      success: true,
      data: local,
      fallback: true,
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const updatePayload = {
      collegeNameTh: body.collegeNameTh !== undefined ? body.collegeNameTh?.trim() : undefined,
      collegeNameEn: body.collegeNameEn !== undefined ? body.collegeNameEn?.trim() : undefined,
      portalTitle: body.portalTitle !== undefined ? body.portalTitle?.trim() : undefined,
      portalSubtitle: body.portalSubtitle !== undefined ? body.portalSubtitle?.trim() : undefined,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
      contactEmail: body.contactEmail !== undefined ? body.contactEmail?.trim() : undefined,
      contactPhone: body.contactPhone !== undefined ? body.contactPhone?.trim() : undefined,
      helpdeskUrl: body.helpdeskUrl !== undefined ? body.helpdeskUrl?.trim() : undefined,
      footerText: body.footerText !== undefined ? body.footerText?.trim() : undefined,
      maintenanceMode: body.maintenanceMode !== undefined ? Boolean(body.maintenanceMode) : undefined,
      maintenanceMessage: body.maintenanceMessage !== undefined ? body.maintenanceMessage?.trim() : undefined,
      allowUserCustomFavorites: body.allowUserCustomFavorites !== undefined ? Boolean(body.allowUserCustomFavorites) : undefined,
      showEmbedWidgetSnippet: body.showEmbedWidgetSnippet !== undefined ? Boolean(body.showEmbedWidgetSnippet) : undefined,
      demoModeEnabled: body.demoModeEnabled !== undefined ? Boolean(body.demoModeEnabled) : undefined,
      keycloakRealm: body.keycloakRealm !== undefined ? body.keycloakRealm?.trim() : undefined,
      allowedEmailDomains: body.allowedEmailDomains !== undefined ? body.allowedEmailDomains?.trim() : undefined,
      sessionTimeoutMinutes: body.sessionTimeoutMinutes !== undefined ? Number(body.sessionTimeoutMinutes) || 120 : undefined,

      // Google OAuth 2.0 Fields
      googleAuthEnabled: body.googleAuthEnabled !== undefined ? Boolean(body.googleAuthEnabled) : undefined,
      googleClientId: body.googleClientId !== undefined ? body.googleClientId?.trim() || null : undefined,
      googleClientSecret: body.googleClientSecret !== undefined ? body.googleClientSecret?.trim() || null : undefined,
      googleHostedDomain: body.googleHostedDomain !== undefined ? body.googleHostedDomain?.trim() || null : undefined,
    };

    try {
      const updated = await prisma.systemSetting.upsert({
        where: { id: 'default' },
        update: updatePayload,
        create: {
          ...DEFAULT_SETTINGS,
          ...body,
        },
      });

      // Also sync to local file for backup
      await writeLocalSettings(updated);

      return NextResponse.json({
        success: true,
        message: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว',
        data: updated,
      });
    } catch (dbError: any) {
      console.warn('Database save failed, writing to local storage fallback:', dbError.message);
      const existing = await readLocalSettings();
      const updatedLocal = {
        ...existing,
        ...updatePayload,
        id: 'default',
        updatedAt: new Date().toISOString(),
      };
      await writeLocalSettings(updatedLocal);

      return NextResponse.json({
        success: true,
        message: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว (บันทึกลงใน Local Storage)',
        data: updatedLocal,
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
