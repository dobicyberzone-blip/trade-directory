import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const certifications = await prisma.businessCertification.findMany({
      include: { business: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'Name', 'Issuer', 'Business', 'Valid Until', 'Created At'];
    const rows = certifications.map((c) => [
      c.id,
      c.name,
      c.issuer,
      c.business.name,
      c.validUntil ? new Date(c.validUntil).toISOString() : 'N/A',
      new Date(c.createdAt).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="certifications-${Date.now()}.csv"` },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
