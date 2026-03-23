import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditLogger } from '@/lib/admin/audit';
import { sendProductApprovedEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const { action, ids } = await request.json();
    if (!action || !ids?.length) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    let result;
    if (action === 'delete') {
      const items = await prisma.product.findMany({ where: { id: { in: ids } } });
      result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
      for (const item of items) await AuditLogger.logDelete('admin-user-id', 'Product', item.id, item);
    } else if (action === 'verify') {
      // Get products with owner info before updating
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { verified: true } });

      // Send approval emails to product owners
      for (const product of products) {
        if (product.user) {
          void sendProductApprovedEmail(
            product.user.email,
            product.user.firstName,
            product.name
          ).catch(err => console.error('[Product Approval] Failed to send email:', err));
        }
      }
    } else if (action === 'unverify') {
      result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { verified: false } });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `${action} completed`, count: result.count });
  } catch (error) {
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
