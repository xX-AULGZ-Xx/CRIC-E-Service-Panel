import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getCurrentUserSession } from '@/lib/auth';
import { isSystemInstalled } from '@/lib/install';

export async function POST(req: NextRequest) {
  try {
    const installed = isSystemInstalled();
    const session = await getCurrentUserSession();

    // Allow upload during initial setup wizard, or require admin role if already installed
    if (installed && (!session || !session.roles.includes('admin'))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด' },
        { status: 400 }
      );
    }

    // Validate File Size (Max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'ขนาดไฟล์เกินกำหนด (สูงสุดไม่เกิน 5MB)' },
        { status: 400 }
      );
    }

    // Validate Allowed File Types
    const ALLOWED_MIME_TYPES = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/svg+xml',
      'image/webp',
      'image/gif',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'ประเภทไฟล์ไม่รองรับ รองรับเฉพาะ PNG, JPG, WebP, SVG, GIF และ ICO เท่านั้น' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const originalExt = path.extname(file.name).toLowerCase() || '.png';
    const cleanBaseName = path
      .basename(file.name, originalExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const filename = `${Date.now()}-${cleanBaseName}${originalExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    let fileUrl = `/uploads/${filename}`;

    try {
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
    } catch (diskErr: any) {
      console.warn('Disk upload write failed, using base64 data url fallback:', diskErr.message);
      // Fallback to base64 Data URL so the logo always works even if file permissions fail
      const mime = file.type || 'image/png';
      fileUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      message: 'Icon uploaded successfully',
      url: fileUrl,
      filename,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
