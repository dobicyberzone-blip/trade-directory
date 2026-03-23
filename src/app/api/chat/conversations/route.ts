import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET all conversations for a user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      participants: {
        some: {
          userId: user.userId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    const conversations = await prisma.chatConversation.findMany({
      where,
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        inquiry: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // Filter conversations for exporters: only show admin and buyers who sent inquiries
    let filteredConversations = conversations;
    if (user.role === 'EXPORTER') {
      filteredConversations = conversations.filter(conv => {
        // Get other participants (not the current user)
        const otherParticipants = conv.participants.filter(p => p.userId !== user.userId);
        
        // Allow conversations with admin or buyers only
        return otherParticipants.some(p => 
          p.user.role === 'ADMIN' || p.user.role === 'BUYER'
        );
      });
    }

    return NextResponse.json({ conversations: filteredConversations }, { headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST create new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inquiryId, participantIds, subject, roles } = body;

    if (!participantIds || participantIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 participants are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create conversation with participants
    const conversation = await prisma.chatConversation.create({
      data: {
        inquiryId,
        subject,
        participants: {
          create: participantIds.map((userId: string, index: number) => ({
            userId,
            role: roles?.[index] || (index === 0 ? 'BUYER' : 'EXPORTER'),
          })),
        },
      },
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { conversation, message: 'Conversation created successfully' },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500, headers: corsHeaders }
    );
  }
}
