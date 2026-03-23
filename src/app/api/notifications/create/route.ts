import { NextRequest, NextResponse } from 'next/server';
import { createNotification, createBulkNotifications } from '@/lib/notifications';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      userIds, // For bulk notifications
      title, 
      message, 
      type, 
      urgency 
    } = body;

    // Validate required fields
    if ((!userId && !userIds) || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId or userIds, title, message, type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Single user notification
    if (userId && !userIds) {
      await createNotification({
        userId,
        title,
        message,
        type,
        urgency,
      });
      
      return NextResponse.json(
        { success: true, message: 'Notification created' },
        { headers: corsHeaders }
      );
    }

    // Bulk notifications
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      await createBulkNotifications(
        userIds,
        title,
        message,
        type,
        urgency
      );
      
      return NextResponse.json(
        { success: true, message: `${userIds.length} notifications created` },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500, headers: corsHeaders }
    );
  }
}
