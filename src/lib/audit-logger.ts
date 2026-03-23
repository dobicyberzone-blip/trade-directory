/**
 * Audit Logging System
 * Tracks all administrative actions for compliance and security
 */

import prisma from '@/lib/prisma';

export interface AuditLogData {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changes?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  statusCode?: number;
}

/**
 * Log an audit action
 */
export async function logAuditAction(data: AuditLogData): Promise<void> {
  try {
    // Build description: use provided description or serialize resource info
    const description = data.description ?? (data.resourceType ? JSON.stringify({
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      changes: data.changes,
      requestMethod: data.requestMethod,
      requestPath: data.requestPath,
      statusCode: data.statusCode,
    }) : null);

    await prisma.userActivity.create({
      data: {
        userId: data.userId,
        action: data.action,
        description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('[AuditLogger] Failed to log activity:', error);
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    userId,
    action,
    resourceType,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.userActivity.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.userActivity.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}