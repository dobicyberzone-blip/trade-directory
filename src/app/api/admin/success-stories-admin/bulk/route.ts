import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  try {
    const { action, ids } = await request.json();
    if (!action || !ids?.length) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    let result;
    if (action === 'delete') {
      const items = await prisma.successStory.findMany({ where: { id: { in: ids } } });
      result = await prisma.successStory.deleteMany({ where: { id: { in: ids } } });
      for (const item of items) await AuditLogger.logDelete('admin-user-id', 'SuccessStory', item.id, item);
    } else if (action === 'approve') {
      result = await prisma.successStory.updateMany({ where: { id: { in: ids } }, data: { isApproved: true } });
    } else if (action === 'feature') {
      result = await prisma.successStory.updateMany({ where: { id: { in: ids } }, data: { isFeatured: true } });
    } else if (action === 'unfeature') {
      result = await prisma.successStory.updateMany({ where: { id: { in: ids } }, data: { isFeatured: false } });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `${action} completed`, count: result.count });
  } catch (error) {
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
