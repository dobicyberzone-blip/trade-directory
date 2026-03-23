import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

// GET - List all export sectors
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
    const sortField = searchParams.get('sortField') || 'orderIndex';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [sectors, total] = await Promise.all([
      prisma.exportSector.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.exportSector.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: sectors,
      total,
      page,
      pageSize,
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to fetch export sectors', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new export sector
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, icon, orderIndex, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sector = await prisma.exportSector.create({
      data: {
        name,
        description,
        icon,
        orderIndex: orderIndex || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: sector });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to create export sector', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update export sector
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, icon, orderIndex, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sector = await prisma.exportSector.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: sector });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to update export sector', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete export sector
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

    await prisma.exportSector.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Export sector deleted' });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to delete export sector', details: error.message },
      { status: 500 }
    );
  }
}
