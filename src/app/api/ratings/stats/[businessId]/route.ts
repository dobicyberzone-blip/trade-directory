import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    // Get all ratings for this business
    const ratings = await prisma.rating.findMany({
      where: { businessId },
      select: { rating: true },
    });

    const totalRatings = ratings.length;
    
    if (totalRatings === 0) {
      return NextResponse.json({
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }, { headers: corsHeaders });
    }

    // Calculate average rating
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sum / totalRatings;

    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratings.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    return NextResponse.json({
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings,
      ratingDistribution,
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rating stats' },
      { status: 500, headers: corsHeaders }
    );
  }
}
