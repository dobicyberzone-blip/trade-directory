import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/devices/activities
 * Get user activity log (login history, actions, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock activity data
    // In production, you would query an activities/audit_log table
    const activities = [
      {
        id: '1',
        userId: user.userId,
        action: 'LOGIN',
        description: 'User logged in',
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json(
      {
        activities,
        pagination: {
          page,
          limit,
          total: activities.length,
          totalPages: Math.ceil(activities.length / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { 
        error: 'Failed to fetch activities',
        activities: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
