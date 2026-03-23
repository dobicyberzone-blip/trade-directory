import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch active certifications (public endpoint for exporters)
export async function GET(request: NextRequest) {
  try {
    const certifications = await prisma.certification.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
      },
    });

    return NextResponse.json({ certifications });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}
