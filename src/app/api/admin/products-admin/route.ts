import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';

export const GET = requirePermission(
  Permission.PRODUCT_VIEW,
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '0');
      const pageSize = parseInt(searchParams.get('pageSize') || '25');
      const sortField = searchParams.get('sortField') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const search = searchParams.get('search') || '';
      const verified = searchParams.get('verified');

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (verified !== null && verified !== '') {
        where.verified = verified === 'true';
      }

      const total = await prisma.product.count({ where });
      const products = await prisma.product.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
        orderBy: { [sortField]: sortOrder },
        include: {
          business: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return NextResponse.json({ data: products, total, page, pageSize });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
  }
);

export const PUT = requirePermission(
  Permission.PRODUCT_EDIT,
  async (request: NextRequest) => {
    try {
      const { id, ...data } = await request.json();
      const current = await prisma.product.findUnique({ where: { id } });
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const updated = await prisma.product.update({ where: { id }, data });
      const userId = request.user?.userId || 'unknown';
      await AuditLogger.logUpdate('Product', id, current, updated, userId);

      return NextResponse.json({ success: true, product: updated });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
  }
);

export const DELETE = requirePermission(
  Permission.PRODUCT_DELETE,
  async (request: NextRequest) => {
    try {
      const id = request.nextUrl.searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      const item = await prisma.product.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      await prisma.product.delete({ where: { id } });
      const userId = request.user?.userId || 'unknown';
      await AuditLogger.logDelete('Product', id, item, userId);
      return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
  }
);
