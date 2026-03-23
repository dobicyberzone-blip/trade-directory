import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';
import { logAuditAction } from '@/lib/audit-logger';
import { sendInquiryReceivedEmail, sendInquirySentEmail } from '@/lib/email-templates';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST send inquiry to a business
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to send inquiries' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { exporterId, message, businessName, businessId } = body;

    if (!exporterId || !message) {
      return NextResponse.json(
        { error: 'Exporter ID and message are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const buyerId = user.userId;

    // Check if conversation already exists between these users
    const existingConversation = await prisma.chatConversation.findFirst({
      where: {
        inquiryId: businessId,
        participants: {
          every: {
            userId: { in: [buyerId, exporterId] }
          }
        }
      },
      include: {
        participants: true
      }
    });

    let conversation;
    let chatMessage;

    if (existingConversation) {
      // Use existing conversation and add message
      conversation = existingConversation;
      
      chatMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: buyerId,
          message,
          messageType: 'INQUIRY',
        },
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
      });

      // Update conversation lastMessageAt
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Increment unread count for other participants
      await prisma.chatParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: { not: buyerId },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });
    } else {
      // Create new conversation (inquiryId is optional - don't set invalid FK)
      conversation = await prisma.chatConversation.create({
        data: {
          subject: `Inquiry about ${businessName}`,
          participants: {
            create: [
              { userId: buyerId, role: 'BUYER' },
              { userId: exporterId, role: 'EXPORTER' },
            ],
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

      // Create first message
      chatMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: buyerId,
          message,
          messageType: 'INQUIRY',
        },
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
      });
    }

    // Create notification for exporter
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { firstName: true, lastName: true, email: true },
    });

    await prisma.notification.create({
      data: {
        userId: exporterId,
        title: 'New Inquiry',
        message: `${buyer?.firstName || 'A buyer'} sent you an inquiry about ${businessName}`,
        type: 'CHAT_MESSAGE',
      },
    });

    // Get exporter details for email
    const exporter = await prisma.user.findUnique({
      where: { id: exporterId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (buyer && exporter) {
      // Confirmation to buyer
      void sendInquirySentEmail(
        buyer.email,
        `${buyer.firstName} ${buyer.lastName}`,
        exporter.firstName,
        businessName
      ).catch(() => {});

      // Notification to exporter
      void sendInquiryReceivedEmail(
        exporter.email,
        `${exporter.firstName} ${exporter.lastName}`,
        `${buyer.firstName} ${buyer.lastName}`,
        businessName,
        message
      ).catch(() => {});
    }

    // Track activity for the buyer
    void logAuditAction({
      userId: buyerId,
      action: 'INQUIRY_SENT',
      description: `Sent inquiry to ${businessName}`,
      metadata: { exporterId, businessId, businessName },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    }).catch(() => {});

    return NextResponse.json(
      { 
        success: true, 
        conversationId: conversation.id,
        conversation, 
        message: chatMessage,
        messageId: 'new_inquiry'
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to send inquiry' },
      { status: 500, headers: corsHeaders }
    );
  }
}
