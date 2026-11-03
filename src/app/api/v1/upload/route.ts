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
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${originalName}`;
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
