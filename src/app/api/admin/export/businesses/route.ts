/**
 * Admin Business Export API
 * Export businesses data to CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.(role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all businesses
    const businesses = await prisma.business.findMany({
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create CSV content
    const headers = [
      'ID',
      'Name',
      'Registration Number',
      'KRA PIN',
      'Email',
      'Phone',
      'City',
      'Country',
      'Sector',
      'Verification Status',
      'Featured',
      'Owner Name',
      'Owner Email',
      'Created At',
    ];

    const rows = businesses.map(business => [
      business.id,
      business.name,
      business.registrationNumber || '',
      business.kraPin || '',
      business.contactEmail || business.companyEmail || '',
      business.contactPhone || business.mobileNumber || '',
      business.city || business.town || '',
      business.country || '',
      business.sector || '',
      business.verificationStatus,
      business.featured ? 'Yes' : 'No',
      `${business.owner?.firstName || ''} ${business.owner?.lastName || ''}`.trim(),
      business.owner?.email || '',
      business.createdAt.toISOString().split('T')[0],
    ]);

    // Escape CSV values
    const escapeCsvValue = (value: any) => {
      const str = String(value || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(',')),
    ].join('\n');

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="businesses-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to export businesses' },
      { status: 500 }
    );
  }
}

