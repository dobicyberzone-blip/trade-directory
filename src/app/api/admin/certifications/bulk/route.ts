import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  try {
    const { action, ids } = await request.json();
    if (!action || !ids?.length) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    if (action === 'delete') {
      const items = await prisma.businessCertification.findMany({ where: { id: { in: ids } } });
      const result = await prisma.businessCertification.deleteMany({ where: { id: { in: ids } } });
      for (const item of items) await AuditLogger.logDelete('admin-user-id', 'BusinessCertification', item.id, item);
      return NextResponse.json({ message: 'Deleted', count: result.count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
