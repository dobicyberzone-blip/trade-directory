/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireSuperAdmin } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';
import { AuditLogger } from '@/lib/admin/audit';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Fetch businesses with pagination, sorting, and filtering
export const GET = requirePermission(
  Permission.BUSINESS_VIEW,
  async (request, _context) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const sector = searchParams.get('sector') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const order = searchParams.get('order') || 'desc';
      const dateFrom = searchParams.get('dateFrom') || '';
      const dateTo = searchParams.get('dateTo') || '';

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { contactEmail: { contains: search } },
          { location: { contains: search } },
          { county: { contains: search } },
          { town: { contains: search } },
          { registrationNumber: { contains: search } },
          { kraPin: { contains: search } },
        ];
      }
      if (status) where.verificationStatus = status;
      if (sector) where.sector = sector;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const total = await prisma.business.count({ where });
      const businesses = await prisma.business.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          owner: {
            select: { firstName: true, lastName: true, email: true, phoneNumber: true },
          },
        },
      });

      return NextResponse.json(
        { businesses, total, page, limit, totalPages: Math.ceil(total / limit) },
        { headers: corsHeaders }
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch businesses' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// POST - Create a new business — Super Admin only
export const POST = requireSuperAdmin(
  async (request, _context) => {
    try {
      const body = await request.json();
      const {
        name, registrationNumber, kraPin, sector, contactEmail, contactPhone,
        physicalAddress, location, county, town, website, description,
        ownerFirstName, ownerLastName, ownerEmail, ownerPhone,
      } = body;

      if (!name || !sector || !contactEmail) {
        return NextResponse.json(
          { error: 'Business name, sector, and email are required' },
          { status: 400, headers: corsHeaders }
        );
      }

      let owner = await prisma.user.findUnique({ where: { email: ownerEmail || contactEmail } });
      if (!owner) {
        owner = await prisma.user.create({
          data: {
            email: ownerEmail || contactEmail,
            firstName: ownerFirstName || 'Business',
            lastName: ownerLastName || 'Owner',
            phoneNumber: ownerPhone || contactPhone,
            password: Math.random().toString(36).slice(-8),
            role: 'EXPORTER',
            isVerified: true,
          },
        });
      }

      const business = await prisma.business.create({
        data: {
          name, description, location, county, town, sector,
          contactEmail, contactPhone, website, physicalAddress,
          registrationNumber, kraPin,
          verificationStatus: 'PENDING',
          ownerId: owner.id,
        },
        include: {
          owner: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
        },
      });

      return NextResponse.json(
        { business, message: 'Business created successfully' },
        { status: 201, headers: corsHeaders }
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create business' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
