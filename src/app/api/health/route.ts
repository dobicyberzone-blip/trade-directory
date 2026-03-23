import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use centralized Prisma client for Vercel serverless
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection with timing
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbLatency: `${dbLatency}ms`,
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
    });
  } catch (error) {

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed',
    }, { status: 500 });
  }
}