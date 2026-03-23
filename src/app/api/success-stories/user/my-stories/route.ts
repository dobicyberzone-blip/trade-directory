import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Get current user's success stories
export async function GET(request: NextRequest) {
  try {
    // Verify token
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {

        throw new Error('JWT_SECRET not configured');
      }
      
      const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string; email: string };
      userId = decoded.userId;

    } catch (error) {

      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const stories = await prisma.successStory.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { stories },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { stories: [], error: 'Failed to fetch stories' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}
