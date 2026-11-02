import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface Context {
  params: Promise<{ id: string }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

async function readLocalServices(): Promise<any[]> {
  try {
    const raw = await readFile(SERVICES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalServices(data: any[]) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(SERVICES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local services fallback', err);
  }
}

export async function GET(req: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    let service: any = null;

    try {
      service = await prisma.service.findUnique({
        where: { id },
        include: { category: true },
      });
    } catch {
      const list = await readLocalServices();
      service = list.find((s) => s.id === id) || null;
    }

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get service' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: Context) {
  try {
    const session = await getCurrentUserSession();
    if (!session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const updateData = {
      title: body.title !== undefined ? body.title.trim() : undefined,
      description: body.description !== undefined ? body.description?.trim() || null : undefined,
      url: body.url !== undefined ? body.url.trim() : undefined,
      iconUrl: body.iconUrl !== undefined ? body.iconUrl.trim() : undefined,
      categoryId: body.categoryId !== undefined ? body.categoryId || null : undefined,
      allowedRoles: Array.isArray(body.allowedRoles) ? body.allowedRoles : undefined,
      openInNewTab: body.openInNewTab !== undefined ? Boolean(body.openInNewTab) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      isDefaultFavorite: body.isDefaultFavorite !== undefined ? Boolean(body.isDefaultFavorite) : undefined,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
    };

    try {
      const updated = await prisma.service.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      const list = await readLocalServices();
      await writeLocalServices(list.map((s) => (s.id === id ? { ...s, ...updated } : s)));

      return NextResponse.json({
        success: true,
        message: 'Service updated successfully',
        data: updated,
      });
    } catch (dbErr: any) {
      console.warn('Database update failed, using local storage:', dbErr.message);
      const list = await readLocalServices();
      let updatedLocal: any = null;
      const updatedList = list.map((s) => {
        if (s.id === id) {
          updatedLocal = { ...s, ...updateData, updatedAt: new Date().toISOString() };
          return updatedLocal;
        }
        return s;
      });
      await writeLocalServices(updatedList);

      return NextResponse.json({
        success: true,
        message: 'Service updated successfully (Local Storage)',
        data: updatedLocal,
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  try {
    const session = await getCurrentUserSession();
    if (!session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    try {
      await prisma.service.delete({
        where: { id },
      });
    } catch (dbErr: any) {
      console.warn('Database delete failed, using local storage:', dbErr.message);
    }

    const list = await readLocalServices();
    await writeLocalServices(list.filter((s) => s.id !== id));

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete service' },
      { status: 500 }
    );
  }
}
