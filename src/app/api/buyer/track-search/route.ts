import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    // Allow anonymous searches, but only track for logged-in users
    if (!user || !user.userId) {
      return NextResponse.json({ success: true, tracked: false });
    }

    const body = await request.json();
    const { query, filters, resultsCount } = body;

    // Create search record
    await prisma.search.create({
      data: {
        userId: user.userId,
        query: query || null,
        filters: filters ? JSON.stringify(filters) : null,
        resultsCount: resultsCount || null,
      },
    });

    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    console.error('[Track Search] Error:', error);
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: true, tracked: false });
  }
}
