/**
 * Audit Logging Utility
 * Tracks all mutations in the admin dashboard
 */

import prisma from '@/lib/prisma';
import type { CreateAuditLogParams } from './types';

export class AuditLogger {
  /**
   * Create an audit log entry
   */
  static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: params.actorUserId,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          beforeSnapshot: params.beforeSnapshot ? JSON.stringify(params.beforeSnapshot) : null,
          afterSnapshot: params.afterSnapshot ? JSON.stringify(params.afterSnapshot) : null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should not break the main operation

    }
  }

  /**
   * Log a CREATE action
   */
  static async logCreate(
    entityType: string,
    entityId: string,
    afterSnapshot: any,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      actorUserId,
      entityType,
      entityId,
      action: 'CREATE',
      afterSnapshot,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log an UPDATE action
   */
  static async logUpdate(
    entityType: string,
    entityId: string,
    beforeSnapshot: any,
    afterSnapshot: any,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      actorUserId,
      entityType,
      entityId,
      action: 'UPDATE',
      beforeSnapshot,
      afterSnapshot,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a DELETE action
   */
  static async logDelete(
    entityType: string,
    entityId: string,
    beforeSnapshot: any,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      actorUserId,
      entityType,
      entityId,
      action: 'DELETE',
      beforeSnapshot,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a BULK_UPDATE action
   */
  static async logBulkUpdate(
    entityType: string,
    entityIds: string[],
    changes: any,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Create a single audit log for bulk operations
    await this.log({
      actorUserId,
      entityType,
      entityId: entityIds.join(','),
      action: 'BULK_UPDATE',
      afterSnapshot: { entityIds, changes },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a BULK_DELETE action
   */
  static async logBulkDelete(
    entityType: string,
    entityIds: string[],
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      actorUserId,
      entityType,
      entityId: entityIds.join(','),
      action: 'BULK_DELETE',
      beforeSnapshot: { entityIds },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityLogs(
    entityType: string,
    entityId: string,
    limit: number = 50
  ) {
    return await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserLogs(
    actorUserId: string,
    limit: number = 50
  ) {
    return await prisma.auditLog.findMany({
      where: {
        actorUserId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent audit logs
   */
  static async getRecentLogs(limit: number = 100) {
    return await prisma.auditLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }
}

export default AuditLogger;
