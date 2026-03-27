/**
 * Public Master Data API — returns active Industries, Sectors, Business Organizations
 * Used by registration form and business profile form dropdowns.
 * Falls back to constants.ts if DB is empty.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INDUSTRIES, SECTORS_BY_INDUSTRY } from '@/lib/constants';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const industryId = searchParams.get('industryId');
  const sectorId = searchParams.get('sectorId');

  try {
    const industryCount = await prisma.industry.count({ where: { isActive: true } });

    // If DB has data, serve from DB
    if (industryCount > 0) {
      if (sectorId) {
        // Return organizations for a specific sector
        const organizations = await prisma.businessOrganization.findMany({
          where: { sectorId, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true },
        });
        return NextResponse.json({ organizations }, { headers: cors });
      }

      if (industryId) {
        // Return sectors for a specific industry
        const sectors = await prisma.sector.findMany({
          where: { industryId, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true },
        });
        return NextResponse.json({ sectors }, { headers: cors });
      }

      const industries = await prisma.industry.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true },
      });
      return NextResponse.json({ industries, source: 'db' }, { headers: cors });
    }

    // Fallback: return from constants (no org fallback — orgs are DB-only)
    const industries = INDUSTRIES.map((name, i) => ({ id: name, name, sortOrder: i }));
    if (sectorId) {
      return NextResponse.json({ organizations: [], source: 'constants' }, { headers: cors });
    }
    if (industryId) {
      const sectors = (SECTORS_BY_INDUSTRY[industryId] || []).map((name, i) => ({ id: name, name, sortOrder: i }));
      return NextResponse.json({ sectors, source: 'constants' }, { headers: cors });
    }
    return NextResponse.json({ industries, source: 'constants' }, { headers: cors });
  } catch (e: any) {
    // Always fall back gracefully
    const industries = INDUSTRIES.map((name, i) => ({ id: name, name, sortOrder: i }));
    return NextResponse.json({ industries, source: 'constants-fallback' }, { headers: cors });
  }
}
