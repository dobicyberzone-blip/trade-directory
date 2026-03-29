import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

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

    // Generate CSV
    const csvRows = [
      ['Market/Country', 'Region', 'Description', 'Status', 'Sort Order', 'Created At'].join(','),
      ...markets.map((market: any) =>
        [
          `"${market.name}"`,
          `"${market.region}"`,
          `"${market.description || ''}"`,
          market.isActive ? 'Active' : 'Inactive',
          market.sortOrder,
          new Date(market.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-markets-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to export export markets' },
      { status: 500 }
    );
  }
}

