import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/businesses/[id]/certifications - Get all certifications for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    const certifications = await prisma.businessCertification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { certifications },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/businesses/[id]/certifications - Add a new certification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const body = await request.json();
    const { name, issuer, imageUrl, logoUrl, validUntil, certificationId } = body;

    if (!name || !issuer) {
      return NextResponse.json(
        { error: 'Name and issuer are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify the business belongs to the user (unless admin)
    if (user.role !== 'ADMIN') {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true },
      });

      if (!business || business.ownerId !== user.userId) {
        return NextResponse.json(
          { error: 'Unauthorized to add certifications to this business' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    const certification = await prisma.businessCertification.create({
      data: {
        businessId,
        name,
        issuer,
        imageUrl,
        logoUrl,
        validUntil: validUntil ? new Date(validUntil) : null,
        certificationId: certificationId || null,
      },
    });

    return NextResponse.json(
      { certification },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create certification' },
      { status: 500, headers: corsHeaders }
    );
  }
}
