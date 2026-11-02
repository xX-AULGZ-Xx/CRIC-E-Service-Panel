import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isSystemInstalled, createInstallLock } from '@/lib/install';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Guard against re-installation if already locked
    if (isSystemInstalled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'ระบบได้รับการติดตั้งเรียบร้อยแล้ว หากต้องการติดตั้งใหม่ให้ลบไฟล์ data/installed.lock บนเซิร์ฟเวอร์',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      collegeNameTh,
      collegeNameEn,
      portalTitle,
      portalSubtitle,
      logoUrl,
      adminName,
      adminEmail,
      adminPassword,
      includeSampleData = true,
    } = body;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่านสำหรับ Super Admin' },
        { status: 400 }
      );
    }

    // 2. Initialize / Seed Categories & Default Services
    const defaultCategories = [
      { id: 'cat-academic', name: 'การเรียนการสอนและวิชาการ', description: 'ระบบที่เกี่ยวข้องกับการเรียนการสอน', sortOrder: 1 },
      { id: 'cat-research-plan', name: 'งานวิจัยและแผนงาน', description: 'ระบบบริหารงานวิจัยและงบประมาณ', sortOrder: 2 },
      { id: 'cat-admin-hr', name: 'งานบริหารและบุคคล', description: 'ระบบงานสารบรรณและบุคลากร', sortOrder: 3 },
      { id: 'cat-tools-it', name: 'เครื่องมือและไอที', description: 'แอปพลิเคชันและบริการช่วยเหลือด้านเทคโนโลยี', sortOrder: 4 },
    ];

    try {
      for (const cat of defaultCategories) {
        await prisma.category.upsert({
          where: { id: cat.id },
          update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
          create: cat,
        });
      }
    } catch (dbErr: any) {
      console.warn('DB Category seed warning (falling back if needed):', dbErr.message);
    }

    // Handle services based on user choice
    if (includeSampleData) {
      try {
        const defaultServicesPath = path.join(process.cwd(), 'data', 'services.default.json');
        const fallbackPath = path.join(process.cwd(), 'data', 'services.json');
        const targetPath = fs.existsSync(defaultServicesPath) ? defaultServicesPath : fallbackPath;

        if (fs.existsSync(targetPath)) {
          const rawServices = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
          if (Array.isArray(rawServices)) {
            for (const srv of rawServices) {
              await prisma.service.upsert({
                where: { id: srv.id },
                update: {
                  title: srv.title,
                  description: srv.description,
                  url: srv.url,
                  iconUrl: srv.iconUrl,
                  categoryId: srv.categoryId,
                  allowedRoles: srv.allowedRoles,
                  openInNewTab: srv.openInNewTab,
                  isActive: srv.isActive,
                  isDefaultFavorite: srv.isDefaultFavorite,
                  sortOrder: srv.sortOrder,
                },
                create: {
                  id: srv.id,
                  title: srv.title,
                  description: srv.description,
                  url: srv.url,
                  iconUrl: srv.iconUrl,
                  categoryId: srv.categoryId,
                  allowedRoles: srv.allowedRoles,
                  openInNewTab: srv.openInNewTab,
                  isActive: srv.isActive,
                  isDefaultFavorite: srv.isDefaultFavorite,
                  sortOrder: srv.sortOrder,
                },
              });
            }
            // Sync to data/services.json
            const currentServicesPath = path.join(process.cwd(), 'data', 'services.json');
            fs.writeFileSync(currentServicesPath, JSON.stringify(rawServices, null, 2), 'utf-8');
          }
        }
      } catch (seedErr: any) {
        console.warn('DB Services seed warning:', seedErr.message);
      }
    } else {
      console.log('Clean installation selected: clearing all existing services from database and storage.');
      try {
        await prisma.userFavorite.deleteMany({});
        await prisma.service.deleteMany({});
      } catch (delErr: any) {
        console.warn('Failed to clear services for clean install:', delErr.message);
      }
      try {
        const servicesFilePath = path.join(process.cwd(), 'data', 'services.json');
        fs.writeFileSync(servicesFilePath, JSON.stringify([], null, 2), 'utf-8');
      } catch {}
    }

    // 3. Upsert System Settings
    const brandingData = {
      collegeNameTh: collegeNameTh?.trim() || 'วิทยาลัยอาชีวศึกษา CRIC',
      collegeNameEn: collegeNameEn?.trim() || 'CRIC Vocational College',
      portalTitle: portalTitle?.trim() || 'CRIC E-Service Panel',
      portalSubtitle: portalSubtitle?.trim() || 'ศูนย์รวมบริการดิจิทัลสำหรับนักศึกษาและบุคลากร',
      logoUrl: logoUrl || '/uploads/1793600763812-tab-icon.png',
      contactEmail: adminEmail.trim(),
      demoModeEnabled: true,
      allowUserCustomFavorites: true,
      showEmbedWidgetSnippet: true,
    };

    try {
      await prisma.systemSetting.upsert({
        where: { id: 'default' },
        update: brandingData,
        create: {
          id: 'default',
          ...brandingData,
        },
      });
    } catch (dbErr: any) {
      console.warn('DB Settings upsert warning, writing local file:', dbErr.message);
    }

    // Also write local settings backup
    try {
      const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');
      let currentSettings = {};
      if (fs.existsSync(settingsFilePath)) {
        currentSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
      }
      fs.writeFileSync(
        settingsFilePath,
        JSON.stringify({ ...currentSettings, ...brandingData, id: 'default', updatedAt: new Date().toISOString() }, null, 2),
        'utf-8'
      );
    } catch (err: any) {
      console.warn('Failed to write settings.json backup:', err.message);
    }

    // 4. Save Master Super Admin Account
    const adminData = {
      name: adminName?.trim() || 'Super Administrator',
      email: adminEmail.trim().toLowerCase(),
      passwordHash: hashPassword(adminPassword),
      roles: ['admin', 'teacher', 'staff'],
      createdAt: new Date().toISOString(),
    };

    const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');
    fs.writeFileSync(adminFilePath, JSON.stringify(adminData, null, 2), 'utf-8');

    // 5. Create installed.lock
    createInstallLock({
      adminEmail: adminEmail.trim().toLowerCase(),
      collegeNameTh: brandingData.collegeNameTh,
      collegeNameEn: brandingData.collegeNameEn,
    });

    // 6. Set Authentication Cookie for the new Admin
    const response = NextResponse.json({
      success: true,
      message: 'ติดตั้งระบบและสร้างบัญชี Super Admin เรียบร้อยแล้ว',
      redirectUrl: '/admin/services',
    });

    response.cookies.set('cric_active_role', 'admin', {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    response.cookies.set('cric_logged_in', 'true', {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Installation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการติดตั้งระบบ',
      },
      { status: 500 }
    );
  }
}
