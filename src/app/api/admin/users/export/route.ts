/**
 * Admin Users Export API
 * 
 * Exports user data to CSV or Excel format
 * Respects current filters, sorting, and search state
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to get user from token
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}

// Helper to check admin access
async function checkAdminAccess(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 403 }
    );
  }
  return user;
}

// Convert to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// GET: Export users
export async function GET(request: NextRequest) {
  try {
    const user = await checkAdminAccess(request);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    
    // Get format
    const format = searchParams.get('format') || 'csv';

    // Sorting
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Search
    const search = searchParams.get('search') || '';

    // Filters
    const role = searchParams.get('role');
    const isVerified = searchParams.get('isVerified');
    const emailVerified = searchParams.get('emailVerified');

    // Selected IDs (if exporting selection only)
    const selectedIds = searchParams.get('selectedIds');
    const ids = selectedIds ? selectedIds.split(',') : null;

    // Build where clause
    const where: any = {};

    if (ids) {
      where.id = { in: ids };
    } else {
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (isVerified !== null && isVerified !== undefined) {
        where.isVerified = isVerified === 'true';
      }

      if (emailVerified !== null && emailVerified !== undefined) {
        where.emailVerified = emailVerified === 'true';
      }
    }

    // Fetch all matching users (no pagination for export)
    const users = await prisma.user.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        emailVerified: true,
        phoneNumber: true,
        phoneVerified: true,
        location: true,
        company: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format data for export
    const exportData = users.map(user => ({
      ID: user.id,
      Email: user.email,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      Role: user.role,
      'Is Verified': user.isVerified ? 'Yes' : 'No',
      'Email Verified': user.emailVerified ? 'Yes' : 'No',
      'Phone Number': user.phoneNumber || '',
      'Phone Verified': user.phoneVerified ? 'Yes' : 'No',
      Location: user.location || '',
      Company: user.company || '',
      Position: user.position || '',
      'Created At': new Date(user.createdAt).toISOString(),
      'Updated At': new Date(user.updatedAt).toISOString(),
    }));

    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      const filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // For Excel, return JSON (client will convert using a library like xlsx)
    return NextResponse.json({ data: exportData });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}



