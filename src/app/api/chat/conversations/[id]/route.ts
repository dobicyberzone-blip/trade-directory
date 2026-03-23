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

// GET conversation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: resolvedParams.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true,
                business: {
                  select: {
                    id: true,
                    name: true,
                    verificationStatus: true,
                    description: true,
                    location: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        inquiry: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ conversation }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH update conversation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    const conversation = await prisma.chatConversation.update({
      where: { id: resolvedParams.id },
      data: { status },
    });

    return NextResponse.json(
      { conversation, message: 'Conversation updated successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.chatConversation.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json(
      { message: 'Conversation deleted successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500, headers: corsHeaders }
    );
  }
}
