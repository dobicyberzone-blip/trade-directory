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

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { businessId, rating, review } = body;

    // Validate required fields
    if (!businessId || !rating) {
      return NextResponse.json(
        { error: 'Business ID and rating are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user already rated this business
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_businessId: {
          userId: user.userId,
          businessId,
        },
      },
    });

    let savedRating;

    if (existingRating) {
      // Update existing rating
      savedRating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          review: review || null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new rating
      savedRating = await prisma.rating.create({
        data: {
          rating,
          review: review || null,
          userId: user.userId,
          businessId,
        },
      });
    }

    return NextResponse.json({ rating: savedRating }, { 
      status: existingRating ? 200 : 201,
      headers: corsHeaders 
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get user, but don't require authentication
    const user = await verifyToken(request);
    
    if (!user) {
      // Return empty ratings if not authenticated
      return NextResponse.json(
        { ratings: [] },
        { headers: corsHeaders }
      );
    }

    // Get user's ratings
    const userRatings = await prisma.rating.findMany({
      where: { userId: user.userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ratings: userRatings }, { headers: corsHeaders });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500, headers: corsHeaders }
    );
  }
}
