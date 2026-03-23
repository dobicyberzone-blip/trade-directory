/**
 * Email Notification Service
 * Sends email notifications to users when they receive in-app notifications
 */

import nodemailer from 'nodemailer';
import { NotificationType, NotificationUrgency } from './notifications';

// Load environment variables if not already loaded
if (typeof process !== 'undefined' && !process.env.SMTP_HOST) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available or already loaded
  }
}

// SMTP transporter with connection pooling
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[Email] SMTP not configured - missing credentials');
      return null;
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    console.log('[Email] SMTP transporter initialized');
  }
  return transporter;
}

/**
 * Get urgency color for email styling
 */
function getUrgencyColor(urgency: NotificationUrgency): string {
  switch (urgency) {
    case 'CRITICAL': return '#dc3545';
    case 'HIGH': return '#fd7e14';
    case 'MEDIUM': return '#ffc107';
    case 'LOW': return '#28a745';
    default: return '#6c757d';
  }
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'CHAT_MESSAGE': return '💬';
    case 'BUSINESS_APPROVED': return '✅';
    case 'BUSINESS_REJECTED': return '❌';
    case 'BUSINESS_VERIFICATION': return '🔍';
    case 'INQUIRY_RECEIVED': return '📩';
    case 'INQUIRY_RESPONSE': return '📧';
    case 'PRODUCT_APPROVED': return '✅';
    case 'PRODUCT_REJECTED': return '❌';
    case 'ORDER_UPDATE': return '📦';
    case 'SYSTEM_ANNOUNCEMENT': return '📢';
    case 'MAINTENANCE': return '🔧';
    case 'FEATURE_UPDATE': return '🆕';
    case 'SECURITY_ALERT': return '🔒';
    case 'SUCCESS_STORY_APPROVED': return '🎉';
    default: return '🔔';
  }
}

/**
 * Send email notification to user
 */
export async function sendEmailNotification(
  userEmail: string,
  userName: string,
  title: string,
  message: string,
  type: NotificationType,
  urgency: NotificationUrgency = 'LOW'
): Promise<boolean> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.error('[Email] Transporter not available');
      return false;
    }

    const icon = getNotificationIcon(type);
    const urgencyColor = getUrgencyColor(urgency);
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!dashboardUrl) {
      console.error('[Email] NEXT_PUBLIC_APP_URL environment variable is not set');
      return false;
    }

    console.log(`[Email] Sending ${urgency} notification to ${userEmail}: ${title}`);

    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'KEPROBA'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `${title} - KEPROBA`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              color: white; 
              padding: 30px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .urgency-badge {
              display: inline-block;
              background: ${urgencyColor};
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              margin-top: 10px;
              letter-spacing: 0.5px;
            }
            .content { 
              padding: 40px 30px;
            }
            .greeting {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
            }
            .notification-box {
              background: #f8f9fa;
              border-left: 4px solid ${urgencyColor};
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .notification-title {
              font-size: 20px;
              font-weight: 600;
              color: #1a1a1a;
              margin: 0 0 12px 0;
            }
            .notification-message {
              font-size: 15px;
              color: #555;
              line-height: 1.6;
              margin: 0;
            }
            .cta-button {
              display: inline-block;
              background: #16a34a;
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 25px 0;
              transition: background 0.3s;
            }
            .cta-button:hover {
              background: #15803d;
            }
            .footer { 
              background: #f8f9fa;
              text-align: center; 
              padding: 25px 30px;
              color: #666; 
              font-size: 13px;
              border-top: 1px solid #e9ecef;
            }
            .footer a {
              color: #16a34a;
              text-decoration: none;
            }
            .divider {
              height: 1px;
              background: #e9ecef;
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEPROBA Notification</h1>
              <span class="urgency-badge">${urgency} Priority</span>
            </div>
            
            <div class="content">
              <p class="greeting">Hello ${userName},</p>
              
              <div class="notification-box">
                <h2 class="notification-title">${title}</h2>
                <p class="notification-message">${message}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}/dashboard/notifications" class="cta-button">
                  View in Dashboard
                </a>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 13px; color: #666; margin: 0;">
                This is an automated notification from KEPROBA. You're receiving this because you have notifications enabled for your account.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;">
                <strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong>
              </p>
              <p style="margin: 0 0 10px 0;">
                1st and 16th Floor Anniversary Towers, University Way<br>
                P.O. Box 40247 00100 GPO, Nairobi, Kenya
              </p>
              <p style="margin: 0;">
                <a href="${dashboardUrl}/dashboard/settings/notifications">Manage notification preferences</a> | 
                <a href="${dashboardUrl}/contact">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
${title}

${message}

View this notification in your dashboard: ${dashboardUrl}/dashboard/notifications

---
Kenya Export Promotion and Branding Agency (KEPROBA)
1st and 16th Floor Anniversary Towers, University Way
P.O. Box 40247 00100 GPO, Nairobi, Kenya

Manage notification preferences: ${dashboardUrl}/dashboard/settings/notifications
      `.trim(),
    });

    console.log(`[Email] Successfully sent email to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send email to ${userEmail}:`, error);
    return false;
  }
}

/**
 * Send bulk email notifications
 */
export async function sendBulkEmailNotifications(
  recipients: Array<{ email: string; name: string }>,
  title: string,
  message: string,
  type: NotificationType,
  urgency: NotificationUrgency = 'LOW'
): Promise<number> {
  console.log(`[Email] sendBulkEmailNotifications called for ${recipients.length} recipients`);
  let successCount = 0;
  
  // Send emails in batches to avoid overwhelming the SMTP server
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    console.log(`[Email] Sending batch ${Math.floor(i / batchSize) + 1} (${batch.length} emails)`);
    
    const results = await Promise.allSettled(
      batch.map(recipient => 
        sendEmailNotification(recipient.email, recipient.name, title, message, type, urgency)
      )
    );
    
    const batchSuccess = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    successCount += batchSuccess;
    console.log(`[Email] Batch ${Math.floor(i / batchSize) + 1}: ${batchSuccess}/${batch.length} sent successfully`);
  }
  
  console.log(`[Email] Total: ${successCount}/${recipients.length} emails sent successfully`);
  return successCount;
}
