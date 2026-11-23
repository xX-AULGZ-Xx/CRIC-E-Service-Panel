import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';
import { getServicesForRole, readLocalServices, writeLocalServices } from '@/lib/services';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  let cleanOrigin = '';
  try {
    if (origin.startsWith('http')) {
      const u = new URL(origin);
      cleanOrigin = `${u.protocol}//${u.host}`;
    }
  } catch {}

  const isAllowedOrigin = 
    cleanOrigin.endsWith('.cric.ac.th') || 
    cleanOrigin === 'https://cric.ac.th' ||
    cleanOrigin.includes('localhost') || 
    cleanOrigin.includes('127.0.0.1');

  const allowedOrigin = isAllowedOrigin ? cleanOrigin : 'https://panel.cric.ac.th';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const session = await getCurrentUserSession();
    const isManageMode = searchParams.get('all') === 'true';
    const filterRole = searchParams.get('role') || session?.currentRole || 'guest';

    const responseHeaders = {
      ...corsHeaders,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Vary': 'Origin',
    };

    const resultServices = await getServicesForRole({
      role: filterRole,
      userId: session?.userId,
      includeAll: isManageMode,
    });

    if (isManageMode) {
      return NextResponse.json({
        success: true,
        count: resultServices.length,
        data: resultServices,
      }, { headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      role: filterRole,
      count: resultServices.length,
      data: resultServices,
    }, { headers: responseHeaders });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch services',
        data: [],
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.roles.includes('admin')) {
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

    const serviceData = {
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
    };

    try {
      const newService = await prisma.service.create({
        data: serviceData,
        include: {
          category: true,
        },
      });

      const currentList = await readLocalServices();
      await writeLocalServices([newService, ...currentList]);

      return NextResponse.json({
        success: true,
        message: 'Service created successfully',
        data: newService,
      });
    } catch (dbErr: any) {
      console.warn('Database save failed, writing to local storage fallback:', dbErr.message);
      const fallbackItem = {
        id: `srv_${Date.now()}`,
        ...serviceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userFavorites: [],
      };
      const currentList = await readLocalServices();
      await writeLocalServices([fallbackItem, ...currentList]);

      return NextResponse.json({
        success: true,
        message: 'Service created successfully (Local Storage)',
        data: fallbackItem,
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create service' },
      { status: 500 }
    );
  }
}
