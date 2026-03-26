import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { AuditLogger } from '@/lib/admin/audit';

// GET - List all featured exporters
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          business: {
            name: { contains: search, mode: 'insensitive' as const },
          },
        }
      : {};

    const [featured, total] = await Promise.all([
      prisma.featuredExporter.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
        orderBy: { priority: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              city: true,
              country: true,
              verificationStatus: true,
            },
          },
        },
      }),
      prisma.featuredExporter.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: featured,
      total,
      page,
      pageSize,
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to fetch featured exporters', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add featured exporter
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { businessId, priority, featuredUntil } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // ── CORE RULE: only VERIFIED businesses may be featured ──
    if (business.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        {
          error: 'Only verified exporters can be featured.',
          detail: `"${business.name}" has verification status "${business.verificationStatus}". Complete the verification process before enabling featuring.`,
        },
        { status: 422 }
      );
    }

    // Check if already featured
    const existing = await prisma.featuredExporter.findUnique({
      where: { businessId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Business is already featured' },
        { status: 400 }
      );
    }

    const featured = await prisma.featuredExporter.create({
      data: {
        businessId,
        priority: priority || 0,
        featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            city: true,
            country: true,
          },
        },
      },
    });

    // Audit log
    void AuditLogger.logCreate(
      'FeaturedExporter',
      featured.id,
      { businessId, businessName: business.name, priority, featuredUntil },
      user.userId,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    ).catch(() => {});

    return NextResponse.json({ success: true, data: featured });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to add featured exporter', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update featured exporter
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, priority, featuredUntil } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const featured = await prisma.featuredExporter.update({
      where: { id },
      data: {
        ...(priority !== undefined && { priority }),
        ...(featuredUntil !== undefined && {
          featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
        }),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            city: true,
            country: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: featured });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to update featured exporter', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove featured exporter
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.featuredExporter.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Featured exporter removed',
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to remove featured exporter', details: error.message },
      { status: 500 }
    );
  }
}
