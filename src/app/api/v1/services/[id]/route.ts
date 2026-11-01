import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });

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

    const updated = await prisma.service.update({
      where: { id },
      data: {
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
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      data: updated,
    });
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

    await prisma.service.delete({
      where: { id },
    });

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
