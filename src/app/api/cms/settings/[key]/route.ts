import { NextRequest, NextResponse } from 'next/server';

// CMS Settings - Dynamic endpoint for site settings
// Returns null for now (CMS settings feature not implemented yet)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  
  // Return null to indicate setting not found
  // The frontend will fall back to default behavior
  return NextResponse.json({ 
    key,
    value: null,
    message: 'CMS settings not configured. Using default values.'
  });
}
