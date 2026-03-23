import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        business: { select: { name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'Name', 'Category', 'Business', 'Owner', 'Price', 'Verified', 'Available'];
    const rows = products.map((p) => [
      p.id, p.name, p.category, p.business.name,
      `${p.user.firstName} ${p.user.lastName}`,
      p.price || '', p.verified ? 'Yes' : 'No', p.availability ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"` },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
