import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');

    const user = await verifyToken(request);
    if (!user) {

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Only admins can view all users
    if (user.role !== 'ADMIN') {

      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          suspended: true,
          phoneNumber: true,
          avatar: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
          business: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              products: true,
              inquiries: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform the data to include business count (0 or 1)
    const usersWithCounts = users.map(user => ({
      ...user,
      _count: {
        ...user._count,
        business: user.business ? 1 : 0,
      },
      business: undefined, // Remove the business object from response
    }));

    return NextResponse.json(
      {
        users: usersWithCounts,
        total,
        limit,
        offset,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500, headers: corsHeaders }
    );
  }
}
