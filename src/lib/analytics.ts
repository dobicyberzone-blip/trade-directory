/**
 * Analytics Tracking Library
 * 
 * Tracks user activities in database and sends to Google Analytics
 * Activities: searches, profile views, favorites, inquiries
 */

import prisma from '@/lib/prisma';

// Google Analytics Measurement ID (from environment)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export interface TrackEventParams {
  userId?: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Track user activity in database
 */
export async function trackActivity(params: TrackEventParams): Promise<void> {
  try {
    if (!params.userId) {
      console.log('[Analytics] Skipping activity tracking - no user ID');
      return;
    }

    await prisma.userActivity.create({
      data: {
        userId: params.userId,
        action: params.action,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    console.log(`[Analytics] Tracked activity: ${params.action} for user ${params.userId}`);
  } catch (error) {
    console.error('[Analytics] Error tracking activity:', error);
  }
}

/**
 * Track profile view in database
 */
export async function trackProfileView(params: {
  businessId: string;
  viewerId?: string;
  viewerIp?: string;
  viewerUserAgent?: string;
  source?: string;
}): Promise<void> {
  try {
    await prisma.profileView.create({
      data: {
        businessId: params.businessId,
        viewerId: params.viewerId,
        viewerIp: params.viewerIp,
        viewerUserAgent: params.viewerUserAgent,
        source: params.source || 'directory',
      },
    });

    console.log(`[Analytics] Tracked profile view: business ${params.businessId}`);
  } catch (error) {
    console.error('[Analytics] Error tracking profile view:', error);
  }
}

/**
 * Send event to Google Analytics (client-side)
 */
export function sendGAEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') {
    return; // Server-side, skip
  }

  if (!GA_MEASUREMENT_ID) {
    console.log('[Analytics] Google Analytics not configured');
    return;
  }

  // Check if gtag is available
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
    console.log(`[Analytics] Sent GA event: ${eventName}`, eventParams);
  } else {
    console.log('[Analytics] gtag not available');
  }
}

/**
 * Track search activity (client-side)
 */
export function trackSearch(params: {
  query?: string;
  filters?: Record<string, unknown>;
  resultsCount?: number;
}): void {
  sendGAEvent('search', {
    search_term: params.query,
    filters: JSON.stringify(params.filters),
    results_count: params.resultsCount,
  });
}

/**
 * Track business view (client-side)
 */
export function trackBusinessView(params: {
  businessId: string;
  businessName: string;
  sector?: string;
}): void {
  sendGAEvent('view_business', {
    business_id: params.businessId,
    business_name: params.businessName,
    sector: params.sector,
  });
}

/**
 * Track favorite action (client-side)
 */
export function trackFavorite(params: {
  businessId: string;
  businessName: string;
  action: 'add' | 'remove';
}): void {
  sendGAEvent('favorite', {
    business_id: params.businessId,
    business_name: params.businessName,
    action: params.action,
  });
}

/**
 * Track inquiry sent (client-side)
 */
export function trackInquiry(params: {
  businessId: string;
  businessName: string;
  productId?: string;
}): void {
  sendGAEvent('send_inquiry', {
    business_id: params.businessId,
    business_name: params.businessName,
    product_id: params.productId,
  });
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}
