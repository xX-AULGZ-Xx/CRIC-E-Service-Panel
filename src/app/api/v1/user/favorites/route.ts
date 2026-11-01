import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.userId },
      include: { service: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: favorites,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    const body = await req.json();
    const { serviceId, action, sortOrder } = body as {
      serviceId: string;
      action?: 'add' | 'remove' | 'toggle' | 'reorder';
      sortOrder?: number;
    };

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_serviceId: {
          userId: session.userId,
          serviceId,
        },
      },
    });

    if (action === 'remove' || (action === 'toggle' && existing)) {
      if (existing) {
        await prisma.userFavorite.delete({
          where: { id: existing.id },
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Removed from favorites',
        isFavorite: false,
      });
    }

    // Add or toggle-add
    if (!existing) {
      const highest = await prisma.userFavorite.findFirst({
        where: { userId: session.userId },
        orderBy: { sortOrder: 'desc' },
      });

      const nextOrder = sortOrder !== undefined ? sortOrder : (highest?.sortOrder ?? 0) + 1;

      const created = await prisma.userFavorite.create({
        data: {
          userId: session.userId,
          serviceId,
          sortOrder: nextOrder,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Added to favorites',
        isFavorite: true,
        data: created,
      });
    }

    // Update sortOrder if specified
    if (sortOrder !== undefined) {
      const updated = await prisma.userFavorite.update({
        where: { id: existing.id },
        data: { sortOrder },
      });
      return NextResponse.json({
        success: true,
        message: 'Updated favorite order',
        data: updated,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Already in favorites',
      isFavorite: true,
    });
  } catch (error: any) {
    console.error('Favorites error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update favorites' },
      { status: 500 }
    );
  }
}
