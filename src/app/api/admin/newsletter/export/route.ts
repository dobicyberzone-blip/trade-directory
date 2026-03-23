import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedDate: 'desc' },
    });

    const headers = ['ID', 'Email', 'Subscribed Date', 'Active'];
    const rows = subscribers.map((s) => [
      s.id,
      s.email,
      new Date(s.subscribedDate).toISOString(),
      s.active ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="newsletter-subscribers-${Date.now()}.csv"` },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
