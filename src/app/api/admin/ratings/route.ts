import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { review: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const total = await prisma.rating.count({ where });
    const ratings = await prisma.rating.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sortField]: sortOrder },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        business: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: ratings, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    const item = await prisma.rating.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    await prisma.rating.delete({ where: { id } });
    await AuditLogger.logDelete('admin-user-id', 'Rating', id, item);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
  }
}
