import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendRegistrationEmail } from '@/lib/email-templates';

// Use centralized Prisma client for Vercel serverless
import prisma from '@/lib/prisma';

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

const registerSchema = z.object({
  // Account credentials
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phoneNumber: z.string().optional(),
  role: z.enum(['ADMIN', 'EXPORTER', 'BUYER']).default('BUYER'),
  partnerType: z.string().optional(),

  // Business info (exporter)
  businessName: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  dateOfIncorporation: z.string().optional(),
  legalStructure: z.string().optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  productServices: z.array(z.string()).optional(),
  productCategory: z.string().optional(), // legacy alias

  // Location
  fullAddress: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  businessLocation: z.string().optional(), // legacy alias

  // Primary contact
  primaryContactFirstName: z.string().optional(),
  primaryContactLastName: z.string().optional(),
  primaryContactEmail: z.string().optional(),
  primaryContactPhone: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please use a different email or sign in to your existing account.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phoneNumber: validatedData.phoneNumber,
        role: validatedData.role,
        partnerType: validatedData.partnerType ?? null,
        isVerified: false,
      } as Parameters<typeof prisma.user.create>[0]['data'],
    });

    // Create business if role is EXPORTER and business name provided
    let business = null;
    if (validatedData.role === 'EXPORTER' && validatedData.businessName) {
      const resolvedSector = validatedData.sector || validatedData.productCategory || 'General';
      const resolvedLocation = validatedData.city || validatedData.businessLocation || validatedData.county || '';
      const productServicesStr = Array.isArray(validatedData.productServices)
        ? validatedData.productServices.join(', ')
        : undefined;

      business = await prisma.business.create({
        data: {
          name: validatedData.businessName,
          location: resolvedLocation,
          sector: resolvedSector,
          industry: validatedData.industry,
          legalStructure: validatedData.legalStructure,
          dateOfIncorporation: validatedData.dateOfIncorporation,
          registrationNumber: validatedData.businessRegistrationNumber,
          physicalAddress: validatedData.fullAddress,
          county: validatedData.county,
          town: validatedData.city,
          city: validatedData.city,
          country: validatedData.country || 'Kenya',
          contactEmail: validatedData.companyEmail || validatedData.email,
          companyEmail: validatedData.companyEmail || validatedData.email,
          contactPhone: validatedData.companyPhone,
          primaryContactFirstName: validatedData.primaryContactFirstName,
          primaryContactLastName: validatedData.primaryContactLastName,
          primaryContactEmail: validatedData.primaryContactEmail,
          primaryContactPhone: validatedData.primaryContactPhone,
          productCatalog: productServicesStr,
          ownerId: user.id,
          verificationStatus: 'PENDING',
        },
      });
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    // Send registration email (async, don't wait)
    void sendRegistrationEmail(
      user.email,
      user.firstName,
      user.lastName,
      user.role
    ).catch(err => console.error('[Registration] Failed to send email:', err));

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        ...userWithoutPassword,
        business: business,
      },
    }, { status: 200, headers: corsHeaders });

  } catch (error) {

    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return NextResponse.json(
        { error: `Invalid input: ${fieldErrors}` },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
