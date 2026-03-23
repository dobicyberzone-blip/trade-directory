import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';

// GET - Fetch all certifications
export const GET = requirePermission(
  Permission.CERTIFICATION_VIEW,
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search') || '';
      const activeOnly = searchParams.get('activeOnly') === 'true';

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (activeOnly) {
        where.isActive = true;
      }

      const certifications = await prisma.certification.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { businessCertifications: true },
          },
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
);

// POST - Create new certification
export const POST = requirePermission(
  Permission.CERTIFICATION_CREATE,
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { name, description, logoUrl, isActive, sortOrder } = body;

      if (!name) {
        return NextResponse.json(
          { error: 'Certification name is required' },
          { status: 400 }
        );
      }

      const existing = await prisma.certification.findUnique({ where: { name } });
      if (existing) {
        return NextResponse.json(
          { error: 'Certification with this name already exists' },
          { status: 400 }
        );
      }

      const certification = await prisma.certification.create({
        data: {
          name,
          description: description || null,
          logoUrl: logoUrl || null,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder || 0,
        },
      });

      return NextResponse.json({ certification }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create certification' },
        { status: 500 }
      );
    }
  }
);
