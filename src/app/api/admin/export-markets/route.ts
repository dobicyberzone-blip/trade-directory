import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

// GET - Fetch all export markets
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    if (!user || user.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const markets = await prisma.exportMarket.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ markets });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch export markets' },
      { status: 500 }
    );
  }
}

// POST - Create new export market
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    if (!user || user.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
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

    // Check if market already exists
    const existing = await prisma.exportMarket.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Export market with this name already exists' },
        { status: 400 }
      );
    }

    const market = await prisma.exportMarket.create({
      data: {
        name,
        region,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ market }, { status: 201 });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create export market' },
      { status: 500 }
    );
  }
}

