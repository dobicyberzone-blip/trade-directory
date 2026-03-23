import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendInquiryReceivedEmail, sendInquiryResponseEmail } from '@/lib/email-templates';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, message, messageType = 'TEXT', attachmentUrl } = body;

    if (!conversationId || !senderId || !message) {
      return NextResponse.json(
        { error: 'Conversation ID, sender ID, and message are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        message,
        messageType,
        attachmentUrl,
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
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Increment unread count for other participants
    await prisma.chatParticipant.updateMany({
      where: {
        conversationId,
        userId: {
          not: senderId,
        },
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });

    // Create notifications for other participants
    const participants = await prisma.chatParticipant.findMany({
      where: {
        conversationId,
        userId: { not: senderId },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true, role: true },
    });

    // Get conversation subject for context
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { subject: true },
    });

    for (const participant of participants) {
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          title: 'New Message',
          message: `${sender?.firstName} ${sender?.lastName} sent you a message`,
          type: 'CHAT_MESSAGE',
        },
      });

      // Send email notification to participant
      if (participant.user?.email) {
        const recipientName = `${participant.user.firstName} ${participant.user.lastName}`.trim();
        const senderName = `${sender?.firstName} ${sender?.lastName}`.trim();
        const subject = conversation?.subject || 'your inquiry';

        // Buyer sent message → exporter receives "inquiry received" style email
        // Exporter replied → buyer receives "inquiry response" style email
        if (sender?.role === 'BUYER' || sender?.role === 'buyer') {
          void sendInquiryReceivedEmail(
            participant.user.email,
            recipientName,
            senderName,
            subject,
            message
          ).catch(() => {});
        } else {
          void sendInquiryResponseEmail(
            participant.user.email,
            recipientName,
            senderName,
            subject
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json(
      { message: chatMessage, success: true },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500, headers: corsHeaders }
    );
  }
}
