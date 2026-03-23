import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PATCH - Archive/Unarchive conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { archived = true } = body;

    // Update conversation status
    const conversation = await prisma.chatConversation.update({
      where: { id: resolvedParams.id },
      data: {
        status: archived ? 'ARCHIVED' : 'ACTIVE',
      },
    });

    return NextResponse.json(
      { 
        success: true,
        conversation,
        message: archived ? 'Conversation archived successfully' : 'Conversation unarchived successfully'
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Archive conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to archive conversation' },
      { status: 500, headers: corsHeaders }
    );
  }
}
