import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const ratings = await prisma.rating.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        business: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'Business', 'User', 'Email', 'Rating', 'Review', 'Created At'];
    const rows = ratings.map((r) => [
      r.id,
      r.business.name,
      `${r.user.firstName} ${r.user.lastName}`,
      r.user.email,
      r.rating,
      r.review || '',
      new Date(r.createdAt).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="ratings-${Date.now()}.csv"` },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
