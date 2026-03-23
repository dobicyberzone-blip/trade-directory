import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac/middleware';
import { Permission } from '@/lib/rbac/permissions';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Fetch all success stories with pagination, filtering
export const GET = requirePermission(
  Permission.ANALYTICS_VIEW,
  async (request, _context) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const approved = searchParams.get('approved'); // 'true', 'false', or null for all
      const featured = searchParams.get('featured'); // 'true', 'false', or null for all

      // Build where clause
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { buyerName: { contains: search, mode: 'insensitive' } },
          { exporterName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (approved !== null && approved !== '') {
        where.isApproved = approved === 'true';
      }

      if (featured !== null && featured !== '') {
        where.isFeatured = featured === 'true';
      }

      const skip = (page - 1) * limit;

      const [stories, total] = await Promise.all([
        prisma.successStory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        prisma.successStory.count({ where }),
      ]);

      return NextResponse.json(
        {
          stories,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('[Success Stories] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch success stories' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// PUT - Update success story (approve, feature, etc.)
export const PUT = requirePermission(
  Permission.ANALYTICS_VIEW,
  async (request, _context) => {
    try {
      const body = await request.json();
      const { id, isApproved, isFeatured, ...updateData } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'Story ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Build update data
      const dataToUpdate: Record<string, unknown> = { ...updateData };
      
      if (typeof isApproved === 'boolean') {
        dataToUpdate.isApproved = isApproved;
      }
      
      if (typeof isFeatured === 'boolean') {
        dataToUpdate.isFeatured = isFeatured;
      }

      const updatedStory = await prisma.successStory.update({
        where: { id },
        data: dataToUpdate,
      });

      return NextResponse.json(
        { success: true, story: updatedStory },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('[Success Stories PUT] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update success story' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);

// DELETE - Delete a success story
export const DELETE = requirePermission(
  Permission.ANALYTICS_VIEW,
  async (request, _context) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'Story ID is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      await prisma.successStory.delete({
        where: { id },
      });

      return NextResponse.json(
        { success: true, message: 'Success story deleted' },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('[Success Stories DELETE] Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete success story' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
);
