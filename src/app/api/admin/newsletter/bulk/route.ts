import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  try {
    const { action, ids } = await request.json();
    if (!action || !ids?.length) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    let result;
    if (action === 'delete') {
      const items = await prisma.newsletterSubscriber.findMany({ where: { id: { in: ids } } });
      result = await prisma.newsletterSubscriber.deleteMany({ where: { id: { in: ids } } });
      for (const item of items) await AuditLogger.logDelete('admin-user-id', 'NewsletterSubscriber', item.id, item);
    } else if (action === 'activate') {
      result = await prisma.newsletterSubscriber.updateMany({ where: { id: { in: ids } }, data: { active: true } });
    } else if (action === 'deactivate') {
      result = await prisma.newsletterSubscriber.updateMany({ where: { id: { in: ids } }, data: { active: false } });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `${action} completed`, count: result.count });
  } catch (error) {
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
