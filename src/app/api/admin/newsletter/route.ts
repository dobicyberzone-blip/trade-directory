import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';
import { verifyToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const token = await verifyToken(request);
  if (!token || ((token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') && token.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const sortField = searchParams.get('sortField') || 'subscribedDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const where: Record<string, unknown> = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    if (active !== null && active !== '') {
      where.active = active === 'true';
    }

    const [total, subscribers] = await Promise.all([
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
        orderBy: { [sortField]: sortOrder },
      }),
    ]);

    return NextResponse.json({ data: subscribers, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await verifyToken(request);
  if (!token || ((token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') && token.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { email } = await request.json();
    const subscriber = await prisma.newsletterSubscriber.create({ data: { email } });
    await AuditLogger.logCreate('NewsletterSubscriber', subscriber.id, subscriber, 'admin-user-id');
    return NextResponse.json(subscriber);
  } catch {
    return NextResponse.json({ error: 'Failed to create subscriber' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const token = await verifyToken(request);
  if (!token || ((token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') && token.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { id, ...data } = await request.json();
    const current = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.newsletterSubscriber.update({ where: { id }, data });
    await AuditLogger.logUpdate('NewsletterSubscriber', id, current, updated, 'admin-user-id');
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = await verifyToken(request);
  if (!token || ((token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') && token.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const item = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.newsletterSubscriber.delete({ where: { id } });
    await AuditLogger.logDelete('NewsletterSubscriber', id, item, 'admin-user-id');
    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
  }
}



