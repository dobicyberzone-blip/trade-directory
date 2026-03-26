import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/auth/check-business-name?name=...
 * Returns { available: boolean }
 * Used by the registration form to validate duplicate business names in real-time.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: 'Business name too short' },
      { status: 400, headers: corsHeaders }
    );
  }

  const existing = await prisma.business.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });

  return NextResponse.json(
    { available: !existing },
    { headers: corsHeaders }
  );
}
