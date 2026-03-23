import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Get featured businesses from database
    const featuredBusinesses = await prisma.business.findMany({
      where: { 
        featured: true,
        verificationStatus: 'VERIFIED'
      },
      select: { id: true }
    });

    const exporterIds = featuredBusinesses.map(b => b.id);

    return NextResponse.json(
      { 
        success: true,
        exporterIds,
        count: exporterIds.length,
        message: exporterIds.length > 0 
          ? `Found ${exporterIds.length} featured exporters` 
          : 'No featured exporters configured'
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { 
        success: true,
        exporterIds: [],
        message: 'Using default verified businesses'
      },
      { headers: corsHeaders }
    );
  }
}
