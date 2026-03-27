/**
 * Master Data API — Industries → Sectors → Business Organizations
 * Admin/SuperAdmin only. Full CRUD with cascading deletes enforced by DB.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

function isAdmin(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

// ── GET ──────────────────────────────────────────────────────────────────────
// ?type=industries|sectors|organizations
// ?industryId=... (filter sectors by industry)
// ?sectorId=...   (filter organizations by sector)
export async function GET(req: NextRequest) {
  const token = await verifyToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') || 'industries';
  const industryId = searchParams.get('industryId');
  const sectorId = searchParams.get('sectorId');

  try {
    if (type === 'industries') {
      const data = await prisma.industry.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { sectors: true } } },
      });
      return NextResponse.json({ data }, { headers: cors });
    }

    if (type === 'sectors') {
      const data = await prisma.sector.findMany({
        where: industryId ? { industryId } : undefined,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          industry: { select: { id: true, name: true } },
          _count: { select: { businessOrganizations: true } },
        },
      });
      return NextResponse.json({ data }, { headers: cors });
    }

    if (type === 'organizations') {
      const data = await prisma.businessOrganization.findMany({
        where: sectorId ? { sectorId } : undefined,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { sector: { select: { id: true, name: true, industry: { select: { id: true, name: true } } } } },
      });
      return NextResponse.json({ data }, { headers: cors });
    }

    // Full hierarchy for the management UI
    const industries = await prisma.industry.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        sectors: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            businessOrganizations: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
          },
        },
      },
    });
    return NextResponse.json({ data: industries }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const token = await verifyToken(req);
  if (!token || !isAdmin(token.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: cors });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
  }

  const { type, name, description, industryId, sectorId, sortOrder, isActive } = body;

  if (!type) {
    return NextResponse.json({ error: 'Missing required field: type (must be "industry", "sector", or "organization")' }, { status: 400, headers: cors });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Missing required field: name' }, { status: 400, headers: cors });
  }

  try {
    let data;
    if (type === 'industry') {
      data = await prisma.industry.create({ data: { name: name.trim(), description, sortOrder: sortOrder ?? 0, isActive: isActive ?? true } });
    } else if (type === 'sector') {
      if (!industryId) return NextResponse.json({ error: 'Missing required field: industryId (required when creating a sector)' }, { status: 400, headers: cors });
      data = await prisma.sector.create({ data: { name: name.trim(), description, industryId, sortOrder: sortOrder ?? 0, isActive: isActive ?? true } });
    } else if (type === 'organization') {
      if (!sectorId) return NextResponse.json({ error: 'Missing required field: sectorId (required when creating an organization)' }, { status: 400, headers: cors });
      data = await prisma.businessOrganization.create({ data: { name: name.trim(), description, sectorId, sortOrder: sortOrder ?? 0, isActive: isActive ?? true } });
    } else {
      return NextResponse.json({ error: `Invalid type "${type}". Must be one of: industry, sector, organization` }, { status: 400, headers: cors });
    }
    return NextResponse.json({ data }, { status: 201, headers: cors });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Name already exists in this context' }, { status: 409, headers: cors });
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}

// ── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const token = await verifyToken(req);
  if (!token || !isAdmin(token.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: cors });

  const body = await req.json();
  const { type, id, name, description, sortOrder, isActive } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400, headers: cors });

  const upd = {
    ...(name !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description }),
    ...(sortOrder !== undefined && { sortOrder }),
    ...(isActive !== undefined && { isActive }),
    updatedAt: new Date(),
  };

  try {
    let data;
    if (type === 'industry') data = await prisma.industry.update({ where: { id }, data: upd });
    else if (type === 'sector') data = await prisma.sector.update({ where: { id }, data: upd });
    else if (type === 'organization') data = await prisma.businessOrganization.update({ where: { id }, data: upd });
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400, headers: cors });
    return NextResponse.json({ data }, { headers: cors });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Name already exists' }, { status: 409, headers: cors });
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const token = await verifyToken(req);
  if (!token || !token.isSuperAdmin) return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403, headers: cors });

  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!id || !type) return NextResponse.json({ error: 'type and id required' }, { status: 400, headers: cors });

  try {
    if (type === 'industry') await prisma.industry.delete({ where: { id } });
    else if (type === 'sector') await prisma.sector.delete({ where: { id } });
    else if (type === 'organization') await prisma.businessOrganization.delete({ where: { id } });
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400, headers: cors });
    return NextResponse.json({ success: true }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}
