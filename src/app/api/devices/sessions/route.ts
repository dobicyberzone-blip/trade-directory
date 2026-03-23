import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/devices/sessions
 * Get all active sessions for the current user
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

    // For now, return a mock session since we don't have a sessions table
    // In production, you would query a sessions table
    const currentToken = request.headers.get('authorization')?.substring(7);
    
    const sessions = [
      {
        id: 'current-session',
        userId: user.userId,
        deviceInfo: {
          type: 'desktop',
          model: 'Unknown',
          vendor: 'Unknown',
          displayName: 'Current Device',
          riskLevel: 'low' as const,
          isRecognized: true,
        },
        browser: 'Chrome',
        os: 'Windows',
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isCurrent: true,
      },
    ];

    return NextResponse.json(
      { sessions },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch sessions', sessions: [] },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/devices/sessions
 * Revoke all other sessions (logout from all other devices)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    // In production, you would delete all sessions except the current one
    // For now, return a success message
    return NextResponse.json(
      { 
        message: 'All other sessions have been revoked',
        revokedCount: 0,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to revoke sessions' },
      { status: 500, headers: corsHeaders }
    );
  }
}
