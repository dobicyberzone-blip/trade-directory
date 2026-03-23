import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

// PUT - Update export market
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, region, description, isActive, sortOrder } = body;

    if (!name || !region) {
      return NextResponse.json(
        { error: 'Market name and region are required' },
        { status: 400 }
      );
    }

    // Check if another market with the same name exists
    const existing = await prisma.exportMarket.findFirst({
      where: {
        name,
        NOT: { id: params.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Export market with this name already exists' },
        { status: 400 }
      );
    }

    const market = await prisma.exportMarket.update({
      where: { id: params.id },
      data: {
        name,
        region,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ market });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update export market' },
      { status: 500 }
    );
  }
}

// DELETE - Delete export market
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await prisma.exportMarket.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete export market' },
      { status: 500 }
    );
  }
}
