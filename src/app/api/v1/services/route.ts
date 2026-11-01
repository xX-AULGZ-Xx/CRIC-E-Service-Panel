import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession, isUserAuthorizedForService } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await getCurrentUserSession();
    const isManageMode = searchParams.get('all') === 'true';
    const filterRole = searchParams.get('role') || session.currentRole;

    const services = await prisma.service.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
        userFavorites: {
          where: {
            userId: session.userId,
          },
        },
      },
    });

    const enriched = services.map((s) => ({
      ...s,
      isFavorite: s.userFavorites.length > 0 || (s.isDefaultFavorite && s.userFavorites.length === 0),
      favoriteOrder: s.userFavorites[0]?.sortOrder ?? (s.isDefaultFavorite ? s.sortOrder : 999),
    }));

    if (isManageMode) {
      return NextResponse.json({
        success: true,
        count: enriched.length,
        data: enriched,
      });
    }

    // Filter active services and check RBAC permissions
    const visibleServices = enriched.filter((service) => {
      if (!service.isActive) return false;
      return isUserAuthorizedForService([filterRole], service.allowedRoles);
    });

    return NextResponse.json({
      success: true,
      role: filterRole,
      count: visibleServices.length,
      data: visibleServices,
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch services',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      url,
      iconUrl,
      categoryId,
      allowedRoles = [],
      openInNewTab = true,
      isActive = true,
      isDefaultFavorite = false,
      sortOrder = 0,
    } = body;

    if (!title || !url || !iconUrl) {
      return NextResponse.json(
        { success: false, error: 'Title, URL, and Icon are required' },
        { status: 400 }
      );
    }

    const newService = await prisma.service.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        url: url.trim(),
        iconUrl: iconUrl.trim(),
        categoryId: categoryId || null,
        allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [],
        openInNewTab: Boolean(openInNewTab),
        isActive: Boolean(isActive),
        isDefaultFavorite: Boolean(isDefaultFavorite),
        sortOrder: Number(sortOrder) || 0,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      data: newService,
    });
  } catch (error: any) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create service' },
      { status: 500 }
    );
  }
}
