import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      
      return NextResponse.json({
        valid: true,
        user: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        },
      }, { status: 200, headers: corsHeaders });
    } catch (error) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      );
    }
  } catch (error) {

    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
