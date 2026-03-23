import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
 * GET /api/chat/unread-count
 * Get count of unread chat messages for current user across all conversations
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

    // Get all conversations where user is a participant
    const participants = await prisma.chatParticipant.findMany({
      where: {
        userId: user.userId,
      },
      select: {
        conversationId: true,
        unreadCount: true,
      },
    });

    // Sum up all unread counts
    const totalUnreadCount = participants.reduce((sum, participant) => {
      return sum + (participant.unreadCount || 0);
    }, 0);

    return NextResponse.json(
      { unreadCount: totalUnreadCount },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch count', unreadCount: 0 },
      { status: 500, headers: corsHeaders }
    );
  }
}
