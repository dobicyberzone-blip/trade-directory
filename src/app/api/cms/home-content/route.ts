import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET(request: NextRequest) {
  try {
    // Since ContentSection and ContentItem tables are removed, return empty arrays
    const sections: any[] = [];
    const items: Record<string, any[]> = {};
    
    // Get all site settings
    const settings = await prisma.siteSettings.findMany({
      orderBy: { settingKey: 'asc' }
    });

    return NextResponse.json({ sections, items, settings });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch home content' },
      { status: 500 }
    );
  }
}
