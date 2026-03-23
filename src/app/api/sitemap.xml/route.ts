import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keproba.go.ke';
    const currentDate = new Date().toISOString();

    // Static pages
    const staticUrls: SitemapUrl[] = [
      { loc: baseUrl, lastmod: currentDate, changefreq: 'daily', priority: 1.0 },
      { loc: `${baseUrl}/about`, lastmod: currentDate, changefreq: 'monthly', priority: 0.8 },
      { loc: `${baseUrl}/contact`, lastmod: currentDate, changefreq: 'monthly', priority: 0.7 },
      { loc: `${baseUrl}/directory`, lastmod: currentDate, changefreq: 'daily', priority: 0.9 },
      { loc: `${baseUrl}/products`, lastmod: currentDate, changefreq: 'daily', priority: 0.9 },
      { loc: `${baseUrl}/search`, lastmod: currentDate, changefreq: 'daily', priority: 0.8 },
      { loc: `${baseUrl}/map`, lastmod: currentDate, changefreq: 'weekly', priority: 0.7 },
      { loc: `${baseUrl}/categories`, lastmod: currentDate, changefreq: 'weekly', priority: 0.8 },
      { loc: `${baseUrl}/faq`, lastmod: currentDate, changefreq: 'monthly', priority: 0.6 },
      { loc: `${baseUrl}/login`, lastmod: currentDate, changefreq: 'yearly', priority: 0.3 },
      { loc: `${baseUrl}/register`, lastmod: currentDate, changefreq: 'yearly', priority: 0.3 },
      { loc: `${baseUrl}/privacy-policy`, lastmod: currentDate, changefreq: 'yearly', priority: 0.4 },
      { loc: `${baseUrl}/terms-and-conditions`, lastmod: currentDate, changefreq: 'yearly', priority: 0.4 },
    ];

    // Get verified businesses for dynamic pages
    const businesses = await prisma.business.findMany({
      where: {
        verificationStatus: 'VERIFIED',
      },
      select: {
        id: true,
        updatedAt: true,
        name: true,
      },
      take: 10000, // Limit to 10000 businesses for performance
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Generate business profile URLs
    const businessUrls: SitemapUrl[] = businesses.map((business) => ({
      loc: `${baseUrl}/directory/${business.id}`,
      lastmod: business.updatedAt?.toISOString() || currentDate,
      changefreq: 'weekly' as const,
      priority: 0.7,
    }));

    // Get products
    const products = await prisma.product.findMany({
      where: {
        verified: true,
      },
      select: {
        id: true,
        updatedAt: true,
        name: true,
      },
      take: 5000,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Generate product URLs
    const productUrls: SitemapUrl[] = products.map((product) => ({
      loc: `${baseUrl}/products/${product.id}`,
      lastmod: product.updatedAt?.toISOString() || currentDate,
      changefreq: 'weekly' as const,
      priority: 0.6,
    }));

    // Get categories
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        updatedAt: true,
        name: true,
      },
    });

    // Generate category URLs
    const categoryUrls: SitemapUrl[] = categories.map((category) => ({
      loc: `${baseUrl}/categories/${category.id}`,
      lastmod: category.updatedAt?.toISOString() || currentDate,
      changefreq: 'weekly' as const,
      priority: 0.7,
    }));

    // Combine all URLs
    const allUrls = [...staticUrls, ...businessUrls, ...productUrls, ...categoryUrls];

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:xhtml="http://www.w3.org/1999/xhtml"
         xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
         xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
         xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allUrls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || currentDate}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || 0.5}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap on error
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keproba.go.ke';
    const currentDate = new Date().toISOString();
    
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/directory</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    return new NextResponse(basicSitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
