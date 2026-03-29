/**
 * Audit Logs API
 * GET /api/admin/audit-logs?type=audit|activity
 * Super admin only — supports search, date range, userId, action filter, pagination, export
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const token = await verifyToken(request);
    if (!token || (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const isSuperAdmin = token.role === 'SUPER_ADMIN';

    const sp = request.nextUrl.searchParams;
    const page     = Math.max(1, parseInt(sp.get('page')  || '1'));
    const limit    = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '50')));
    const action   = sp.get('action')   || '';
    const search   = sp.get('search')   || '';
    const userId   = sp.get('userId')   || '';
    const type     = sp.get('type')     || 'audit'; // 'audit' | 'activity'
    const exportFmt = sp.get('export')  || '';      // 'csv' | 'json'
    const startDate = sp.get('startDate') || '';
    const endDate   = sp.get('endDate')   || '';

    // Normal Admin: audit logs are Super Admin only; activity logs scoped to own actions
    if (!isSuperAdmin && type === 'audit') {
      return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403, headers: corsHeaders });
    }
    // ── Activity logs ──────────────────────────────────────────────────────
    if (type === 'activity') {
      const where: Record<string, unknown> = {};
      // Normal Admin can only see their own activity
      if (!isSuperAdmin) {
        where.userId = token.userId;
      } else if (userId) {
        where.userId = userId;
      }
      if (action) where.action = { contains: action, mode: 'insensitive' };
      if (search) {
        where.OR = [
          { action:      { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { ipAddress:   { contains: search, mode: 'insensitive' } },
        ];
      }
      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate   && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
        };
      }

      const exportLimit = exportFmt ? 10_000 : limit;
      const [logs, total] = await Promise.all([
        prisma.userActivity.findMany({
          where,
          skip: exportFmt ? 0 : (page - 1) * limit,
          take: exportLimit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
          },
        }),
        prisma.userActivity.count({ where }),
      ]);

      if (exportFmt === 'csv') {
        const csv = buildActivityCsv(logs);
        return new NextResponse(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="activity-logs-${Date.now()}.csv"`,
          },
        });
      }
      if (exportFmt === 'json') {
        return new NextResponse(JSON.stringify(logs, null, 2), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="activity-logs-${Date.now()}.json"`,
          },
        });
      }

      return NextResponse.json({
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, { headers: corsHeaders });
    }

    // ── Audit logs (admin CRUD actions) ────────────────────────────────────
    const where: Record<string, unknown> = {};
    if (userId) where.actorUserId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { action:     { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId:   { contains: search, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.timestamp = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
      };
    }

    const exportLimit = exportFmt ? 10_000 : limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: exportFmt ? 0 : (page - 1) * limit,
        take: exportLimit,
        orderBy: { timestamp: 'desc' },
        include: {
          adminUser: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    if (exportFmt === 'csv') {
      const csv = buildAuditCsv(logs);
      return new NextResponse(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
        },
      });
    }
    if (exportFmt === 'json') {
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Audit Logs]', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500, headers: corsHeaders });
  }
}

// ── CSV builders ────────────────────────────────────────────────────────────

function esc(v: unknown): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildAuditCsv(logs: any[]): string {
  const headers = ['Timestamp', 'Admin', 'Admin Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
  const rows = logs.map(l => [
    new Date(l.timestamp).toISOString(),
    l.adminUser ? `${l.adminUser.firstName} ${l.adminUser.lastName}` : 'System',
    l.adminUser?.email ?? '',
    l.action,
    l.entityType ?? '',
    l.entityId ?? '',
    l.ipAddress ?? '',
  ].map(esc).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function buildActivityCsv(logs: any[]): string {
  const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Description', 'IP Address'];
  const rows = logs.map(l => [
    new Date(l.createdAt).toISOString(),
    l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
    l.user?.email ?? '',
    l.user?.role ?? '',
    l.action,
    l.description ?? '',
    l.ipAddress ?? '',
  ].map(esc).join(','));
  return [headers.join(','), ...rows].join('\n');
}
