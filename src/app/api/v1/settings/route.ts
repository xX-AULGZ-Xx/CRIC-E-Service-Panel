import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';

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
  keycloakRealm: 'cric-college',
  allowedEmailDomains: 'cric.ac.th, student.cric.ac.th',
  sessionTimeoutMinutes: 120,
};

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
    console.error('Error fetching settings:', error);
    // Fallback to default in-memory settings if DB query fails
    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
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

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: {
        collegeNameTh: body.collegeNameTh?.trim(),
        collegeNameEn: body.collegeNameEn?.trim(),
        portalTitle: body.portalTitle?.trim(),
        portalSubtitle: body.portalSubtitle?.trim(),
        logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
        contactEmail: body.contactEmail?.trim(),
        contactPhone: body.contactPhone?.trim(),
        helpdeskUrl: body.helpdeskUrl?.trim(),
        footerText: body.footerText?.trim(),
        maintenanceMode: Boolean(body.maintenanceMode),
        maintenanceMessage: body.maintenanceMessage?.trim(),
        allowUserCustomFavorites: Boolean(body.allowUserCustomFavorites),
        showEmbedWidgetSnippet: Boolean(body.showEmbedWidgetSnippet),
        keycloakRealm: body.keycloakRealm?.trim(),
        allowedEmailDomains: body.allowedEmailDomains?.trim(),
        sessionTimeoutMinutes: Number(body.sessionTimeoutMinutes) || 120,
      },
      create: {
        ...DEFAULT_SETTINGS,
        ...body,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
