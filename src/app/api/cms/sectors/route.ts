import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET all sectors with business counts
export async function GET() {
  try {
    // Get all businesses grouped by sector with counts
    const sectors = await prisma.business.groupBy({
      by: ['sector'],
      where: {
        verificationStatus: 'VERIFIED',
      },
      _count: {
        sector: true,
      },
      orderBy: {
        _count: {
          sector: 'desc',
        },
      },
    });

    // Transform to match expected format
    const sectorsWithCounts = sectors.map(sector => ({
      name: sector.sector,
      count: sector._count.sector,
    }));

    return NextResponse.json({ sectors: sectorsWithCounts }, { headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch sectors' },
      { status: 500, headers: corsHeaders }
    );
  }
}
