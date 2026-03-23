import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PATCH mark conversation as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update participant's unread count and lastReadAt
    await prisma.chatParticipant.updateMany({
      where: {
        conversationId: params.id,
        userId,
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    // Mark all messages in conversation as read
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: params.id,
        senderId: {
          not: userId,
        },
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      { message: 'Conversation marked as read' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to mark conversation as read' },
      { status: 500, headers: corsHeaders }
    );
  }
}
