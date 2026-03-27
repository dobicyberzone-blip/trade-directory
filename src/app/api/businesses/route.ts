import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Allow Next.js edge cache: stale-while-revalidate 30s, fresh for 60s
// This means the FIRST user after 60s waits for fresh data; everyone else gets instant cached response
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// CDN/browser cache headers — 60s fresh, 120s stale-while-revalidate
const cacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

// No-cache for filtered/searched results (personalised)
const noCacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector    = searchParams.get('sector');
    const location  = searchParams.get('location');
    const verified  = searchParams.get('verified');
    const search    = searchParams.get('search');
    const page      = parseInt(searchParams.get('page') || '0');
    const limit     = Math.min(parseInt(searchParams.get('limit') || '51'), 100); // cap at 100
    const filtersJson = searchParams.get('filters');

    let filters: Record<string, string[]> = {};
    if (filtersJson) {
      try { filters = JSON.parse(filtersJson); } catch { /* ignore */ }
    }

    const isDefaultQuery = page === 0 && !search && !sector && !location && !verified && Object.keys(filters).length === 0;

    // ─── Build WHERE clause ───────────────────────────────────────────────────
    const where: Record<string, unknown> = {
      published: true, // only show published businesses in the public directory
    };

    if (sector)   where.sector   = sector;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (verified === 'true') where.verificationStatus = 'VERIFIED';

    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sector:      { contains: search, mode: 'insensitive' } },
        { location:    { contains: search, mode: 'insensitive' } },
      ];
    }

    if (Object.keys(filters).length > 0) {
      const conditions: Record<string, unknown>[] = [];

      if (filters.county?.length) {
        conditions.push({
          OR: filters.county.map(c => ({
            OR: [
              { county:   { equals: c, mode: 'insensitive' } },
              { location: { contains: c, mode: 'insensitive' } },
            ],
          })),
        });
      }

      if (filters.sector?.length) {
        conditions.push({ OR: filters.sector.map(s => ({ sector: { contains: s, mode: 'insensitive' } })) });
      }

      if (filters.industry?.length) {
        conditions.push({ OR: filters.industry.map(i => ({ industry: { contains: i, mode: 'insensitive' } })) });
      }

      if (filters.productHsCode?.length) {
        conditions.push({ OR: filters.productHsCode.map(h => ({ productHsCode: { contains: h.split(' - ')[0].trim(), mode: 'insensitive' } })) });
      }

      if (filters.serviceOffering?.length) {
        conditions.push({ OR: filters.serviceOffering.map(s => ({ serviceOffering: { contains: s, mode: 'insensitive' } })) });
      }

      if (filters.typeOfBusiness?.length) {
        conditions.push({ OR: filters.typeOfBusiness.map(t => ({ typeOfBusiness: { equals: t, mode: 'insensitive' } })) });
      }

      if (filters.businessUserOrganisation?.length) {
        conditions.push({ OR: filters.businessUserOrganisation.map(o => ({ businessUserOrganisation: { contains: o, mode: 'insensitive' } })) });
      }

      if (filters.exportMarkets?.length) {
        conditions.push({
          OR: filters.exportMarkets.map(m => ({ currentExportMarkets: { contains: m, mode: 'insensitive' } })),
        });
      }

      if (filters.numberOfEmployees?.length) {
        const rangeConds = filters.numberOfEmployees.flatMap(range => {
          switch (range) {
            case '1-49':    return [{ numberOfEmployees: { gte: '1',    lte: '49'   } }];
            case '50-100':  return [{ numberOfEmployees: { gte: '50',   lte: '100'  } }];
            case '101-200': return [{ numberOfEmployees: { gte: '101',  lte: '200'  } }];
            case '201-500': return [{ numberOfEmployees: { gte: '201',  lte: '500'  } }];
            case '501-1000':return [{ numberOfEmployees: { gte: '501',  lte: '1000' } }];
            case '1000+':   return [{ numberOfEmployees: { gte: '1001'              } }];
            default:        return [];
          }
        });
        if (rangeConds.length) conditions.push({ OR: rangeConds });
      }

      if (filters.certification?.length) {
        conditions.push({
          certifications: {
            some: { OR: filters.certification.map(c => ({ name: { contains: c, mode: 'insensitive' } })) },
          },
        });
      }

      if (filters.product?.length) {
        conditions.push({
          products: {
            some: { OR: filters.product.map(p => ({ name: { contains: p, mode: 'insensitive' } })) },
          },
        });
      }

      if (conditions.length) {
        if (where.OR) {
          where.AND = [{ OR: where.OR as unknown[] }, ...conditions];
          delete where.OR;
        } else {
          where.AND = conditions;
        }
      }
    }

    // ─── Slim SELECT — only fields the grid card actually renders ─────────────
    const select = {
      id: true,
      name: true,
      description: true,
      location: true,
      county: true,
      town: true,
      coordinates: true,
      sector: true,
      industry: true,
      contactEmail: true,
      contactPhone: true,
      companyEmail: true,
      mobileNumber: true,
      whatsappNumber: true,
      website: true,
      physicalAddress: true,
      typeOfBusiness: true,
      legalStructure: true,
      companySize: true,
      numberOfEmployees: true,
      dateOfIncorporation: true,
      kraPin: true,
      registrationNumber: true,
      currentExportMarkets: true,
      exportVolumePast3Years: true,
      productionCapacityPast3: true,
      companyStory: true,
      logoUrl: true,
      twitterUrl: true,
      instagramUrl: true,
      registrationCertificateUrl: true,
      pinCertificateUrl: true,
      verificationStatus: true,
      profileComplete: true,
      featured: true,
      featuredAt: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
      productHsCode: true,
      serviceOffering: true,
      businessUserOrganisation: true,
      // Nested — minimal fields only
      products: {
        take: 4,
        where: { availability: true },
        select: { id: true, name: true, category: true, imageUrl: true },
        orderBy: { createdAt: 'desc' as const },
      },
      certifications: {
        take: 4,
        select: { id: true, name: true, issuer: true, imageUrl: true, logoUrl: true, validUntil: true },
      },
      _count: { select: { ratings: true } },
    };

    // ─── Run main query + count in parallel, then ratings using known IDs ───────
    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        take: limit,
        skip: page * limit,
        select,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.business.count({ where }),
    ]);

    // Fetch ratings only for the IDs we already have — single targeted query
    const businessIds = businesses.map(b => b.id);
    const ratingsRaw = businessIds.length > 0
      ? await prisma.rating.groupBy({
          by: ['businessId'],
          _avg: { rating: true },
          where: { businessId: { in: businessIds } },
        })
      : [];

    const ratingsMap = new Map(ratingsRaw.map(r => [r.businessId, r._avg.rating ?? null]));

    const businessesWithRatings = businesses.map(({ _count, ...b }) => ({
      ...b,
      rating:       ratingsMap.has(b.id) ? Number((ratingsMap.get(b.id)!).toFixed(1)) : null,
      totalRatings: _count.ratings,
    }));

    const response = {
      businesses: businessesWithRatings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      },
    };

    // Use CDN cache headers for default (unfiltered) queries
    const headers = isDefaultQuery ? cacheHeaders : noCacheHeaders;
    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const business = await prisma.business.create({
      data: { ...body, verificationStatus: 'PENDING' },
      include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    return NextResponse.json({ business, message: 'Business created successfully' }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500, headers: corsHeaders });
  }
}
