// Notification Service Utility
// Provides efficient notification creation without slowing down the main request

import { PrismaClient } from '@prisma/client';
import { sendEmailNotification } from './email-notifications';

const prisma = new PrismaClient();

export type NotificationType = 
  | 'CHAT_MESSAGE'
  | 'BUSINESS_VERIFICATION'
  | 'BUSINESS_APPROVED'
  | 'BUSINESS_REJECTED'
  | 'INQUIRY_RECEIVED'
  | 'INQUIRY_RESPONSE'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'ORDER_UPDATE'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'MAINTENANCE'
  | 'FEATURE_UPDATE'
  | 'SECURITY_ALERT'
  | 'SUCCESS_STORY_APPROVED'
  | 'ADMIN_ALERT'
  | 'SYSTEM_ERROR'
  | 'PRODUCT_VERIFICATION';

export type NotificationUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  urgency?: NotificationUrgency;
}

/**
 * Create a notification asynchronously (fire-and-forget for non-blocking performance)
 * This function doesn't await the result, allowing the main request to complete quickly
 */
export async function createNotificationAsync(input: CreateNotificationInput): Promise<void> {
  // Fire and forget - don't await to avoid blocking the main request
  void createNotification(input);
}

/**
 * Create a notification with proper error handling
 * Also sends an email notification to the user
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        urgency: input.urgency || 'LOW',
        read: false,
      },
    });

    // Send email notification in background (don't await to avoid blocking)
    void sendEmailToUser(input.userId, input.title, input.message, input.type, input.urgency || 'LOW');
  } catch (error) {
    // Log error but don't throw - notifications should never break main functionality

  }
}

/**
 * Helper function to send email notification to user
 */
async function sendEmailToUser(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  urgency: NotificationUrgency
): Promise<void> {
  try {
    // Fetch user email and name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user || !user.email) {
      return;
    }

    const userName = `${user.firstName} ${user.lastName}`.trim() || 'User';
    await sendEmailNotification(user.email, userName, title, message, type, urgency);
  } catch (error) {
    // Silently fail - email notifications are optional

  }
}

/**
 * Create notifications for multiple users (e.g., system announcements)
 * Also sends email notifications to all users
 */
export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType,
  urgency?: NotificationUrgency
): Promise<void> {
  if (userIds.length === 0) return;

  try {
    // Use createMany for efficient bulk insert
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        urgency: urgency || 'LOW',
        read: false,
      })),
    });

    // Send bulk email notifications in background
    void sendBulkEmailsToUsers(userIds, title, message, type, urgency || 'LOW');
  } catch (error) {

  }
}

/**
 * Helper function to send bulk email notifications
 */
async function sendBulkEmailsToUsers(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType,
  urgency: NotificationUrgency
): Promise<void> {
  try {
    console.log(`[Notifications] Sending bulk emails to ${userIds.length} users`);
    
    // Fetch user emails and names
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { email: true, firstName: true, lastName: true },
    });

    console.log(`[Notifications] Found ${users.length} users with emails`);

    const recipients = users
      .filter(u => u.email)
      .map(u => ({
        email: u.email!,
        name: `${u.firstName} ${u.lastName}`.trim() || 'User',
      }));

    console.log(`[Notifications] Prepared ${recipients.length} recipients for email`);

    if (recipients.length > 0) {
      const { sendBulkEmailNotifications } = await import('./email-notifications');
      console.log(`[Notifications] Calling sendBulkEmailNotifications...`);
      const successCount = await sendBulkEmailNotifications(recipients, title, message, type, urgency);
      console.log(`[Notifications] Successfully sent ${successCount}/${recipients.length} emails`);
    } else {
      console.log(`[Notifications] No recipients with valid emails`);
    }
  } catch (error) {
    // Silently fail - email notifications are optional
    console.error('[Notifications] Error sending bulk emails:', error);
  }
}

/**
 * Helper to create chat message notification
 */
export async function notifyChatMessage(
  recipientId: string,
  senderName: string,
  conversationSubject?: string
): Promise<void> {
  const subject = conversationSubject || 'a conversation';
  await createNotificationAsync({
    userId: recipientId,
    title: 'New Message',
    message: `${senderName} sent you a message in ${subject}`,
    type: 'CHAT_MESSAGE',
    urgency: 'MEDIUM',
  });
}

/**
 * Helper to create business verification notification
 */
export async function notifyBusinessStatus(
  userId: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<void> {
  const isApproved = status === 'APPROVED';
  await createNotificationAsync({
    userId,
    title: isApproved ? 'Business Approved' : 'Business Verification Update',
    message: isApproved 
      ? 'Congratulations! Your business has been approved and is now visible in the directory.'
      : `Your business verification was not approved. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`,
    type: isApproved ? 'BUSINESS_APPROVED' : 'BUSINESS_REJECTED',
    urgency: isApproved ? 'HIGH' : 'MEDIUM',
  });
}

/**
 * Helper to create inquiry notification
 */
export async function notifyInquiryReceived(
  exporterId: string,
  buyerName: string,
  productName: string
): Promise<void> {
  await createNotificationAsync({
    userId: exporterId,
    title: 'New Inquiry',
    message: `${buyerName} is interested in your product "${productName}"`,
    type: 'INQUIRY_RECEIVED',
    urgency: 'MEDIUM',
  });
}

/**
 * Helper to create inquiry response notification
 */
export async function notifyInquiryResponse(
  buyerId: string,
  exporterName: string,
  productName: string
): Promise<void> {
  await createNotificationAsync({
    userId: buyerId,
    title: 'Inquiry Response',
    message: `${exporterName} has responded to your inquiry about "${productName}"`,
    type: 'INQUIRY_RESPONSE',
    urgency: 'MEDIUM',
  });
}

/**
 * Helper to create product approval notification
 */
export async function notifyProductStatus(
  userId: string,
  productName: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<void> {
  await createNotificationAsync({
    userId,
    title: status === 'APPROVED' ? 'Product Approved' : 'Product Update',
    message: status === 'APPROVED'
      ? `Your product "${productName}" has been approved and is now visible in the marketplace.`
      : `Your product "${productName}" needs revision. Please check and resubmit.`,
    type: status === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
    urgency: 'MEDIUM',
  });
}
