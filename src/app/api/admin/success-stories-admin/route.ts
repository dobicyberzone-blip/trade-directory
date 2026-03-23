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
    const approved = searchParams.get('approved');
    const featured = searchParams.get('featured');

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { exporterName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (approved !== null && approved !== '') {
      where.isApproved = approved === 'true';
    }
    if (featured !== null && featured !== '') {
      where.isFeatured = featured === 'true';
    }

    const total = await prisma.successStory.count({ where });
    const stories = await prisma.successStory.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sortField]: sortOrder },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ data: stories, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch success stories' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const current = await prisma.successStory.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const updated = await prisma.successStory.update({ where: { id }, data });
    await AuditLogger.logUpdate('admin-user-id', 'SuccessStory', id, current, updated);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update success story' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    const item = await prisma.successStory.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    await prisma.successStory.delete({ where: { id } });
    await AuditLogger.logDelete('admin-user-id', 'SuccessStory', id, item);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete success story' }, { status: 500 });
  }
}
