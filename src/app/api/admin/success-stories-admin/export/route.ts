import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const stories = await prisma.successStory.findMany({ orderBy: { createdAt: 'desc' } });
    const headers = ['ID', 'Title', 'Company', 'Exporter', 'Category', 'Destination', 'Approved', 'Featured'];
    const rows = stories.map((s) => [
      s.id, s.title, s.companyName, s.exporterName, s.productCategory, s.exportDestination,
      s.isApproved ? 'Yes' : 'No', s.isFeatured ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="success-stories-${Date.now()}.csv"` },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
