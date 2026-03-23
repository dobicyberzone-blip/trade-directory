import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Fetch subcategories for a specific category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const subcategories = await prisma.subcategory.findMany({
      where: {
        categoryId: id,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(
      { subcategories },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subcategories' },
      { status: 500, headers: corsHeaders }
    );
  }
}
