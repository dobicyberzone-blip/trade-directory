import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    // Allow anonymous tracking, but only save for logged-in users
    if (!user || !user.userId) {
      return NextResponse.json({ success: true, tracked: false });
    }

    const body = await request.json();
    const { type, data } = body;

    // Handle different tracking types
    if (type === 'search') {
      const { query, filters, resultsCount } = data;

      // Create search record
      await prisma.search.create({
        data: {
          userId: user.userId,
          query: query || null,
          filters: filters ? JSON.stringify(filters) : null,
          resultsCount: resultsCount || null,
        },
      });

      return NextResponse.json({ success: true, tracked: true, type: 'search' });
    }

    if (type === 'profile_view') {
      const { businessId, source } = data;
      if (businessId) {
        const viewerIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const viewerUserAgent = request.headers.get('user-agent') || 'unknown';
        await prisma.profileView.create({
          data: {
            businessId,
            viewerId: user.userId,
            viewerIp,
            viewerUserAgent,
            source: source || 'directory',
          },
        });
        return NextResponse.json({ success: true, tracked: true, type: 'profile_view' });
      }
    }

    // Add other tracking types here in the future (page views, clicks, etc.)
    
    return NextResponse.json({ success: true, tracked: false, message: 'Unknown tracking type' });
    
  } catch (error) {
    console.error('[Analytics Track] Error:', error);
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: true, tracked: false, error: 'Tracking failed' });
  }
}
