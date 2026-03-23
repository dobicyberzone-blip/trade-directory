import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET settings by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    
    if (category) {
      where.category = category;
    }

    const settings = await prisma.siteSettings.findMany({
      where,
      orderBy: {
        settingKey: 'asc',
      },
    });

    return NextResponse.json({ settings }, { headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500, headers: corsHeaders }
    );
  }
}
