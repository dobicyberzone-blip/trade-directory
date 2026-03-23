import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET available contacts for starting a conversation — role-aware
export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    // Support both ?buyerId= (legacy) and token-based auth
    const userId = tokenPayload?.userId || searchParams.get('buyerId');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Get the requesting user's role
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    const role = requestingUser.role;

    // Get admins — always visible to everyone
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', deleted: false },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
    });

    if (role === 'EXPORTER') {
      // Exporters can only see BUYERS and ADMINS — NOT other exporters
      const buyers = await prisma.user.findMany({
        where: { role: 'BUYER', deleted: false },
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
      });

      return NextResponse.json({
        buyers: buyers.map(b => ({
          ...b,
          displayName: `${b.firstName} ${b.lastName}`,
        })),
        admins: admins.map(a => ({
          ...a,
          displayName: `${a.firstName} ${a.lastName}`,
        })),
        // Keep exporters empty so dialog doesn't show exporter tab
        exporters: [],
      }, { headers: corsHeaders });
    }

    // BUYER (and any other role) — sees EXPORTERS and ADMINS
    const exporters = await prisma.user.findMany({
      where: { role: 'EXPORTER', deleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
        business: {
          select: { id: true, name: true, verificationStatus: true },
        },
      },
    });

    return NextResponse.json({
      exporters: exporters.map(e => ({
        ...e,
        displayName: e.business?.name || `${e.firstName} ${e.lastName}`,
      })),
      admins: admins.map(a => ({
        ...a,
        displayName: `${a.firstName} ${a.lastName}`,
      })),
      buyers: [],
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500, headers: corsHeaders });
  }
}
