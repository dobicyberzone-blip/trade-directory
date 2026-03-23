/**
 * KEPROBA Admin Alert Notification System
 * TradeDir.Alrt.01 - Event-based notifications for admin staff
 * TradeDir.Alrt.02 - Proactive monitoring and self-healing
 */

import prisma from './prisma';
import { sendEmailNotification } from './email-notifications';

// Log levels as per TradeDir.Alrt.02
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Admin notification types
export enum AdminAlertType {
  // TradeDir.Alrt.01 Events
  NEW_EXPORTER_PROFILE = 'NEW_EXPORTER_PROFILE',
  EXPORTER_PROFILE_AMENDMENT = 'EXPORTER_PROFILE_AMENDMENT',
  EXPORTER_STATUS_CHANGE = 'EXPORTER_STATUS_CHANGE',
  INVALID_LOGIN_ATTEMPT = 'INVALID_LOGIN_ATTEMPT',
  FAILED_LOGIN_PATTERN = 'FAILED_LOGIN_PATTERN',
  BACKUP_COMPLETED = 'BACKUP_COMPLETED',
  RESTORE_COMPLETED = 'RESTORE_COMPLETED',
  
  // TradeDir.Alrt.02 Events
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  SERVICE_DOWN = 'SERVICE_DOWN',
  SERVICE_RECOVERED = 'SERVICE_RECOVERED',
  REPEATED_FAILURE = 'REPEATED_FAILURE',
  SECURITY_THREAT = 'SECURITY_THREAT',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
}

// Admin notification priorities
export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Interface for admin alerts
interface AdminAlert {
  type: AdminAlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Admin notification preferences storage
interface AdminNotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  alertTypes: Record<AdminAlertType, boolean>;
  minPriority: AlertPriority;
  adminEmails: string[];
}

// Default admin notification settings
const DEFAULT_ADMIN_SETTINGS: AdminNotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  alertTypes: {
    [AdminAlertType.NEW_EXPORTER_PROFILE]: true,
    [AdminAlertType.EXPORTER_PROFILE_AMENDMENT]: true,
    [AdminAlertType.EXPORTER_STATUS_CHANGE]: true,
    [AdminAlertType.INVALID_LOGIN_ATTEMPT]: false,
    [AdminAlertType.FAILED_LOGIN_PATTERN]: true,
    [AdminAlertType.BACKUP_COMPLETED]: true,
    [AdminAlertType.RESTORE_COMPLETED]: true,
    [AdminAlertType.CRITICAL_ERROR]: true,
    [AdminAlertType.SERVICE_DOWN]: true,
    [AdminAlertType.SERVICE_RECOVERED]: true,
    [AdminAlertType.REPEATED_FAILURE]: true,
    [AdminAlertType.SECURITY_THREAT]: true,
    [AdminAlertType.SYSTEM_WARNING]: true,
  },
  minPriority: AlertPriority.MEDIUM,
  adminEmails: [], // Will be fetched from admin users
};

/**
 * Get admin users who should receive notifications
 */
async function getAdminRecipients(minPriority: AlertPriority = AlertPriority.MEDIUM): Promise<Array<{ id: string; email: string; firstName: string; lastName: string }>> {
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      suspended: false,
      deleted: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });
  
  return adminUsers;
}

/**
 * Send admin alert notification
 * Asynchronous - does not block main request (TradeDir.Alrt.01)
 */
export async function sendAdminAlert(alert: AdminAlert): Promise<void> {
  try {
    // Get admin recipients
    const admins = await getAdminRecipients();
    
    if (admins.length === 0) {
      console.warn('[AdminAlerts] No admin recipients found');
      return;
    }

    // Create in-app notifications for all admins
    const notificationData = admins.map(admin => ({
      userId: admin.id,
      title: alert.title,
      message: alert.message,
      type: 'ADMIN_ALERT',
      urgency: alert.priority === AlertPriority.CRITICAL ? 'HIGH' : alert.priority === AlertPriority.HIGH ? 'MEDIUM' : 'LOW',
      metadata: JSON.stringify({
        alertType: alert.type,
        priority: alert.priority,
        details: alert.details,
        userId: alert.userId,
        ipAddress: alert.ipAddress,
        timestamp: new Date().toISOString(),
      }),
    }));

    // Bulk create notifications
    if (notificationData.length > 0) {
      await prisma.notification.createMany({
        data: notificationData,
      });
    }

    // Send email notifications to admins asynchronously
    // Using void to not block - TradeDir.Alrt.01 requirement
    void sendAdminEmailAlerts(admins, alert);

    // Log the alert
    console.log(`[AdminAlert] ${alert.priority} - ${alert.type}: ${alert.title}`);
    
  } catch (error) {
    // Log error but don't throw - alerts should never break main functionality
    console.error('[AdminAlert] Error sending admin alert:', error);
  }
}

/**
 * Send email alerts to admins
 */
async function sendAdminEmailAlerts(
  admins: Array<{ id: string; email: string; firstName: string; lastName: string }>,
  alert: AdminAlert
): Promise<void> {
  const emailPromises = admins.map(async (admin) => {
    try {
      const adminName = `${admin.firstName} ${admin.lastName}`.trim() || 'Admin';
      
      await sendEmailNotification(
        admin.email,
        adminName,
        `[KEPROBA ${alert.priority}] ${alert.title}`,
        formatAlertEmailMessage(alert),
        'ADMIN_ALERT',
        alert.priority === AlertPriority.CRITICAL ? 'HIGH' : alert.priority === AlertPriority.HIGH ? 'MEDIUM' : 'LOW'
      );
    } catch (error) {
      console.error(`[AdminAlerts] Failed to send email to admin ${admin.email}:`, error);
    }
  });

  await Promise.allSettled(emailPromises);
}

/**
 * Format alert message for email
 */
function formatAlertEmailMessage(alert: AdminAlert): string {
  let message = `${alert.message}\n\n`;
  
  if (alert.details) {
    message += `Details:\n`;
    for (const [key, value] of Object.entries(alert.details)) {
      message += `- ${key}: ${JSON.stringify(value)}\n`;
    }
  }
  
  if (alert.userEmail) {
    message += `\nUser Email: ${alert.userEmail}`;
  }
  
  if (alert.ipAddress) {
    message += `\nIP Address: ${alert.ipAddress}`;
  }
  
  message += `\n\nTimestamp: ${new Date().toISOString()}`;
  message += `\nAlert Type: ${alert.type}`;
  message += `\nPriority: ${alert.priority}`;
  
  return message;
}

// ============ TradeDir.Alrt.01 Event Notifications ============

/**
 * Notify admins when a new exporter profile is added
 */
export async function notifyNewExporterProfile(
  businessId: string,
  businessName: string,
  exporterEmail: string,
  submittedBy?: string
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.NEW_EXPORTER_PROFILE,
    priority: AlertPriority.MEDIUM,
    title: 'New Exporter Profile Submitted',
    message: `A new exporter profile "${businessName}" has been submitted and is pending verification.`,
    details: {
      businessId,
      businessName,
      exporterEmail,
      submittedBy,
      action: 'Profile requires review and verification',
    },
    userEmail: exporterEmail,
  });
}

/**
 * Notify admins of exporter profile amendments
 */
export async function notifyExporterProfileAmendment(
  businessId: string,
  businessName: string,
  exporterEmail: string,
  changes: string[],
  changedBy?: string
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.EXPORTER_PROFILE_AMENDMENT,
    priority: AlertPriority.MEDIUM,
    title: 'Exporter Profile Amended',
    message: `Exporter profile "${businessName}" has been amended.`,
    details: {
      businessId,
      businessName,
      exporterEmail,
      changes,
      changedBy,
      action: 'Review amended profile details',
    },
    userEmail: exporterEmail,
  });
}

/**
 * Notify admins of exporter status changes
 */
export async function notifyExporterStatusChange(
  businessId: string,
  businessName: string,
  oldStatus: string,
  newStatus: string,
  changedBy?: string
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.EXPORTER_STATUS_CHANGE,
    priority: newStatus === 'REJECTED' || newStatus === 'SUSPENDED' ? AlertPriority.HIGH : AlertPriority.LOW,
    title: `Exporter Status Changed: ${newStatus}`,
    message: `Exporter "${businessName}" status changed from ${oldStatus} to ${newStatus}.`,
    details: {
      businessId,
      businessName,
      oldStatus,
      newStatus,
      changedBy,
    },
  });
}

/**
 * Notify admins of invalid login attempts
 */
export async function notifyInvalidLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent?: string,
  attemptCount: number = 1
): Promise<void> {
  const priority = attemptCount >= 5 ? AlertPriority.HIGH : AlertPriority.LOW;
  
  await sendAdminAlert({
    type: AdminAlertType.INVALID_LOGIN_ATTEMPT,
    priority,
    title: 'Invalid Login Attempt',
    message: `Failed login attempt for ${email}. ${attemptCount > 1 ? `Total attempts: ${attemptCount}` : ''}`,
    details: {
      email,
      attemptCount,
      ipAddress,
      userAgent,
    },
    userEmail: email,
    ipAddress,
    userAgent,
  });
}

/**
 * Notify admins of failed login pattern (multiple attempts)
 */
export async function notifyFailedLoginPattern(
  email: string,
  ipAddress: string,
  attempts: number,
  timeWindow: string
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.FAILED_LOGIN_PATTERN,
    priority: AlertPriority.HIGH,
    title: 'Suspicious Login Pattern Detected',
    message: `Multiple failed login attempts detected for ${email}. This may indicate a brute-force attack.`,
    details: {
      email,
      attempts,
      timeWindow,
      ipAddress,
      action: 'Consider blocking IP or alerting user',
    },
    userEmail: email,
    ipAddress,
  });
}

/**
 * Notify admins of successful backup
 */
export async function notifyBackupCompleted(
  backupId: string,
  backupType: string,
  size?: string,
  duration?: string
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.BACKUP_COMPLETED,
    priority: AlertPriority.LOW,
    title: 'Backup Completed Successfully',
    message: `${backupType} backup completed successfully.`,
    details: {
      backupId,
      backupType,
      size,
      duration,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Notify admins of successful restore
 */
export async function notifyRestoreCompleted(
  restoreId: string,
  restoreType: string,
  restoredFrom?: string,
  duration?: string
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.RESTORE_COMPLETED,
    priority: AlertPriority.MEDIUM,
    title: 'Restore Completed Successfully',
    message: `${restoreType} restore completed successfully.`,
    details: {
      restoreId,
      restoreType,
      restoredFrom,
      duration,
      timestamp: new Date().toISOString(),
    },
  });
}

// ============ TradeDir.Alrt.02 Proactive Monitoring ============

/**
 * Log system error with full context (TradeDir.Alrt.02)
 */
export async function logSystemError(
  error: Error,
  context: {
    endpoint?: string;
    method?: string;
    params?: Record<string, any>;
    body?: Record<string, any>;
    userId?: string;
    userEmail?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    message: error.message,
    stack: error.stack,
    context: {
      ...context,
      // Capture system state
      memoryUsage: process.memoryUsage ? {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      } : undefined,
      uptime: process.uptime ? `${Math.round(process.uptime())}s` : undefined,
      nodeVersion: process.version,
    },
  };

  // Log to console
  console.error('[SystemError]', JSON.stringify(errorLog, null, 2));

  // Store in database for audit (optional based on error severity)
  try {
    await prisma.notification.create({
      data: {
        userId: 'SYSTEM', // System notification
        title: `System Error: ${error.message.substring(0, 50)}`,
        message: error.message,
        type: 'SYSTEM_ERROR',
        urgency: 'HIGH',
      },
    });
  } catch (dbError) {
    console.error('[SystemError] Failed to store error log:', dbError);
  }

  // Send critical error alert to admins
  await sendAdminAlert({
    type: AdminAlertType.CRITICAL_ERROR,
    priority: AlertPriority.CRITICAL,
    title: 'Critical System Error',
    message: `A critical error occurred: ${error.message}`,
    details: {
      error: error.message,
      endpoint: context.endpoint,
      userId: context.userId,
      stack: error.stack?.substring(0, 500), // Truncate for notification
    },
    userId: context.userId,
    userEmail: context.userEmail,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/**
 * Notify admins of service availability changes
 */
export async function notifyServiceStatus(
  serviceName: string,
  status: 'UP' | 'DOWN',
  details?: string,
  recoveryTime?: Date
): Promise<void> {
  const alertType = status === 'DOWN' ? AdminAlertType.SERVICE_DOWN : AdminAlertType.SERVICE_RECOVERED;
  const priority = status === 'DOWN' ? AlertPriority.CRITICAL : AlertPriority.MEDIUM;
  
  await sendAdminAlert({
    type: alertType,
    priority,
    title: `Service ${status}: ${serviceName}`,
    message: status === 'DOWN' 
      ? `Service "${serviceName}" is now DOWN. ${details || ''}`
      : `Service "${serviceName}" has recovered. ${recoveryTime ? `Downtime: ${recoveryTime.toISOString()}` : ''}`,
    details: {
      serviceName,
      status,
      details,
      recoveryTime,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Notify admins of repeated failure patterns
 */
export async function notifyRepeatedFailure(
  failureType: string,
  occurrences: number,
  timeWindow: string,
  lastOccurrence: string,
  affectedUsers?: number
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.REPEATED_FAILURE,
    priority: AlertPriority.HIGH,
    title: 'Repeated Failure Pattern Detected',
    message: `${failureType} has failed ${occurrences} times in the last ${timeWindow}.`,
    details: {
      failureType,
      occurrences,
      timeWindow,
      lastOccurrence,
      affectedUsers,
      action: 'Investigate root cause and implement fix',
    },
  });
}

/**
 * Notify admins of security threats
 */
export async function notifySecurityThreat(
  threatType: string,
  description: string,
  severity: AlertPriority,
  sourceIp?: string,
  targetUser?: string,
  actionTaken?: string
): Promise<void> {
  await sendAdminAlert({
    type: AdminAlertType.SECURITY_THREAT,
    priority: severity,
    title: `Security Threat: ${threatType}`,
    message: description,
    details: {
      threatType,
      description,
      sourceIp,
      targetUser,
      actionTaken,
      timestamp: new Date().toISOString(),
    },
    userId: targetUser,
    ipAddress: sourceIp,
  });
}

// ============ Self-Healing Utilities (TradeDir.Alrt.02) ============

/**
 * Execute self-healing action
 */
export async function executeSelfHealing(
  action: string,
  heal: () => Promise<boolean>,
  onFailure?: (error: Error) => void
): Promise<boolean> {
  try {
    console.log(`[SelfHealing] Attempting to execute: ${action}`);
    const success = await heal();
    
    if (success) {
      console.log(`[SelfHealing] Successfully executed: ${action}`);
      await notifyServiceStatus('Self-Healing', 'UP', `Successfully executed: ${action}`);
    } else {
      console.warn(`[SelfHealing] Action failed: ${action}`);
      await notifyRepeatedFailure(
        `Self-Healing: ${action}`,
        1,
        'immediate',
        new Date().toISOString()
      );
    }
    
    return success;
  } catch (error) {
    console.error(`[SelfHealing] Error executing ${action}:`, error);
    if (onFailure) {
      onFailure(error as Error);
    }
    return false;
  }
}

/**
 * Clear temporary data (self-healing action)
 */
export async function clearTemporaryData(): Promise<boolean> {
  try {
    // Clean up old notifications (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        read: true,
      },
    });
    
    console.log(`[SelfHealing] Cleared ${result.count} old notifications`);
    return true;
  } catch (error) {
    console.error('[SelfHealing] Failed to clear temporary data:', error);
    return false;
  }
}

/**
 * Restart failed service (placeholder - actual implementation depends on deployment)
 */
export async function restartFailedService(serviceName: string): Promise<boolean> {
  // This would typically involve container orchestration or process management
  console.log(`[SelfHealing] Would restart service: ${serviceName}`);
  
  // Log the attempt
  await notifyServiceStatus(serviceName, 'DOWN', 'Self-healing: attempting restart');
  
  // In a real implementation, this would use Docker API, Kubernetes API, or PM2
  return true;
}

/**
 * Revert to known good state (placeholder)
 */
export async function revertToKnownGoodState(component: string): Promise<boolean> {
  console.log(`[SelfHealing] Would revert ${component} to known good state`);
  
  // In a real implementation, this would involve database transactions or cache rollback
  return true;
}
