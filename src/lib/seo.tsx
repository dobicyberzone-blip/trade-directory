import { Metadata } from 'next';

interface SeoConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile' | 'business.business';
  structuredData?: Record<string, any>;
  noIndex?: boolean;
}

interface BusinessSeoData {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  town?: string | null;
  county?: string | null;
  sector?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  phoneNumber?: string | null;
  verificationStatus?: string | null;
}

interface ProductSeoData {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  category?: string | null;
}

// Base URL for the application
const getBaseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keproba.go.ke';

// Default SEO configuration
export const defaultSeo: SeoConfig = {
  title: 'KEPROBA - Kenya Export Trade Directory',
  description: 'Discover verified Kenyan exporters and their products. KEPROBA connects international buyers with trusted Kenyan suppliers.',
  ogType: 'website',
};

// Generate dynamic metadata for a page
export function generateMetadata(config: SeoConfig): Metadata {
  const baseUrl = getBaseUrl();
  const canonical = config.canonical || baseUrl;
  
  return {
    title: config.title,
    description: config.description,
    robots: config.noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: canonical,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
      siteName: 'KEPROBA - Kenya Export Promotion Council',
      images: config.ogImage ? [
        {
          url: config.ogImage,
          width: 1200,
          height: 630,
          alt: config.title,
        }
      ] : [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'KEPROBA - Kenya Export Trade Directory',
        }
      ],
      locale: 'en_US',
      type: config.ogType as 'website' | 'article' | 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.ogImage ? [config.ogImage] : [`${baseUrl}/og-image.png`],
      site: '@keproba',
    },
    other: {
      'geo.region': 'KE',
      'geo.placename': 'Kenya',
      'og:country-name': 'Kenya',
    },
  };
}

// Generate JSON-LD structured data for a local business
export function generateLocalBusinessSchema(business: BusinessSeoData): string {
  const baseUrl = getBaseUrl();
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/directory/${business.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: business.name,
    description: business.description || undefined,
    image: business.logoUrl || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.town || undefined,
      addressRegion: business.county || undefined,
      addressCountry: 'KE',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Kenya',
    },
    ...(business.website && { url: business.website }),
    ...(business.contactEmail && { email: business.contactEmail }),
    ...(business.phoneNumber && { telephone: business.phoneNumber }),
    priceRange: '$$',
    ...(business.sector && { 
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Sector',
        value: business.sector,
      }
    }),
    ...(business.verificationStatus === 'VERIFIED' && {
      identifier: [
        {
          '@type': 'PropertyValue',
          name: 'verificationStatus',
          value: 'Verified',
        }
      ],
    }),
  };

  return JSON.stringify(schema);
}

// Generate JSON-LD structured data for a product
export function generateProductSchema(product: ProductSeoData, businessName: string): string {
  const baseUrl = getBaseUrl();
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.imageUrl || undefined,
    offers: {
      '@type': 'Offer',
      price: product.price || 0,
      priceCurrency: product.currency || 'KES',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: businessName,
      },
    },
    ...(product.category && {
      category: product.category,
    }),
  };

  return JSON.stringify(schema);
}

// Generate JSON-LD structured data for the directory/organization
export function generateOrganizationSchema(): string {
  const baseUrl = getBaseUrl();
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    '@id': baseUrl,
    name: 'Kenya Export Promotion Council (KEPROBA)',
    alternateName: 'KEPROBA',
    description: 'Kenya Export Promotion Council - Connecting international buyers with Kenyan exporters',
    url: baseUrl,
    logo: `${baseUrl}/Keproba-logo.png`,
    image: `${baseUrl}/Keproba-logo.png`,
    foundingDate: '2015',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Kenya Utalii Building, Utalii Lane',
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi County',
      postalCode: '00100',
      addressCountry: 'KE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+254-20-XXX-XXXX',
      contactType: 'customer service',
      email: 'export@keproba.go.ke',
      availableLanguage: ['English', 'Swahili'],
    },
    sameAs: [
      'https://www.facebook.com/keproba',
      'https://twitter.com/keproba',
      'https://www.linkedin.com/company/keproba',
      'https://www.instagram.com/keproba',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Kenya',
    },
    serviceType: ['Export Promotion', 'Business Matching', 'Trade Information'],
  };

  return JSON.stringify(schema);
}

// Generate JSON-LD structured data for breadcrumbs
export function generateBreadcrumbSchema(items: { name: string; url: string }[]): string {
  const baseUrl = getBaseUrl();
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return JSON.stringify(schema);
}

// Generate JSON-LD for FAQ
export function generateFaqSchema(faqs: { question: string; answer: string }[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return JSON.stringify(schema);
}

// SEO component for adding structured data to pages
export function SeoStructuredData({ data }: { data: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}

// Generate metadata for business profile pages
export function generateBusinessMetadata(business: BusinessSeoData): Metadata {
  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/directory/${business.name.replace(/\s+/g, '-').toLowerCase()}`;
  
  const title = `${business.name} - Export Directory | KEPROBA`;
  const description = business.description 
    ? `${business.name} - ${business.description.substring(0, 150)}...`
    : `Discover ${business.name}, a verified Kenyan exporter in ${business.sector || 'the export directory'}. Find contact information, products, and certifications.`;
  
  return generateMetadata({
    title,
    description,
    canonical,
    ogImage: business.logoUrl || undefined,
    ogType: 'business.business',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      description: business.description || undefined,
      image: business.logoUrl || undefined,
    },
  });
}

// Generate metadata for product pages
export function generateProductMetadata(product: ProductSeoData, businessName: string): Metadata {
  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/products/${product.name.replace(/\s+/g, '-').toLowerCase()}`;
  
  const title = `${product.name} - ${businessName} | KEPROBA`;
  const description = product.description 
    ? product.description.substring(0, 150)
    : `Discover ${product.name} from ${businessName}. ${product.category ? `Category: ${product.category}.` : ''} ${product.price ? `Price: ${product.price} ${product.currency || 'KES'}.` : ''}`;
  
  return generateMetadata({
    title,
    description,
    canonical,
    ogImage: product.imageUrl || undefined,
    ogType: 'website',
  });
}
