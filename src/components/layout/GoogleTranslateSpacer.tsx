'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box } from '@mui/material';

/**
 * GoogleTranslateSpacer Component
 * 
 * Production-ready spacer that dynamically adjusts to prevent Google Translate banner
 * from overlapping the header. Uses multiple detection methods and observers for reliability.
 * 
 * Detection Methods:
 * 1. MutationObserver - Watches for DOM changes when Google Translate injects elements
 * 2. ResizeObserver - Tracks banner height changes
 * 3. Multiple selectors - Checks various Google Translate elements
 * 4. Polling fallback - Ensures detection even if observers fail
 * 
 * Features:
 * - Zero height when inactive (no empty gap)
 * - Smooth CSS transitions
 * - SSR-safe (Next.js compatible)
 * - Responsive across all screen sizes
 * - No hardcoded heights
 * - Automatic cleanup
 */

interface GoogleTranslateState {
  isActive: boolean;
  bannerHeight: number;
}

export default function GoogleTranslateSpacer() {
  const [translateState, setTranslateState] = useState<GoogleTranslateState>({
    isActive: false,
    bannerHeight: 0,
  });
  
  const observersRef = useRef<{
    mutation?: MutationObserver;
    resize?: ResizeObserver;
    pollInterval?: NodeJS.Timeout;
  }>({});

  /**
   * Detect if Google Translate is active using multiple methods
   * Returns the banner element if found, null otherwise
   */
  const detectGoogleTranslateBanner = useCallback((): HTMLElement | null => {
    // Method 1: Check for the banner frame (most reliable)
    const bannerFrame = document.querySelector<HTMLElement>('.goog-te-banner-frame');
    if (bannerFrame && bannerFrame.offsetHeight > 0) {
      return bannerFrame;
    }

    // Method 2: Check for skiptranslate class on body
    const hasSkipTranslate = document.body.classList.contains('skiptranslate');
    if (hasSkipTranslate) {
      // Look for any visible iframe that might be the banner
      const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe');
      for (const iframe of iframes) {
        if (iframe.offsetHeight > 0 && iframe.offsetHeight < 100) {
          // Google Translate banner is typically 40-50px
          return iframe;
        }
      }
    }

    // Method 3: Check for translated class
    const isTranslated = document.documentElement.classList.contains('translated-ltr') ||
                        document.documentElement.classList.contains('translated-rtl');
    if (isTranslated) {
      // Find the top-most positioned element that looks like a banner
      const topElements = document.querySelectorAll<HTMLElement>('[style*="position"]');
      for (const el of topElements) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
          const rect = el.getBoundingClientRect();
          if (rect.top === 0 && rect.height > 0 && rect.height < 100) {
            return el;
          }
        }
      }
    }

    // Method 4: Check for Google Translate iframe by src
    const gtIframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="translate.googleapis.com"]');
    for (const iframe of gtIframes) {
      if (iframe.offsetHeight > 0) {
        return iframe;
      }
    }

    return null;
  }, []);

  /**
   * Measure the actual banner height
   */
  const measureBannerHeight = useCallback((banner: HTMLElement | null): number => {
    if (!banner) return 0;

    // Get the actual rendered height
    const height = banner.offsetHeight || banner.clientHeight;
    
    // Add some padding for responsive adjustments
    const screenWidth = window.innerWidth;
    let padding = 0;
    
    if (screenWidth <= 600) {
      padding = 8; // Mobile
    } else if (screenWidth <= 1024) {
      padding = 12; // Tablet
    } else {
      padding = 16; // Desktop
    }

    return height + padding;
  }, []);

  /**
   * Update the translate state
   */
  const updateTranslateState = useCallback(() => {
    const banner = detectGoogleTranslateBanner();
    const isActive = banner !== null;
    const bannerHeight = measureBannerHeight(banner);

    setTranslateState(prev => {
      // Only update if something changed to avoid unnecessary re-renders
      if (prev.isActive !== isActive || prev.bannerHeight !== bannerHeight) {
        return { isActive, bannerHeight };
      }
      return prev;
    });
  }, [detectGoogleTranslateBanner, measureBannerHeight]);

  /**
   * Setup observers and polling
   */
  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined') return;

    // Initial check
    updateTranslateState();

    // Setup MutationObserver to watch for DOM changes
    const mutationObserver = new MutationObserver(() => {
      updateTranslateState();
    });

    // Observe the entire document for changes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    observersRef.current.mutation = mutationObserver;

    // Setup ResizeObserver for the banner (if it exists)
    const setupResizeObserver = () => {
      const banner = detectGoogleTranslateBanner();
      if (banner && 'ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(() => {
          updateTranslateState();
        });
        resizeObserver.observe(banner);
        observersRef.current.resize = resizeObserver;
      }
    };

    setupResizeObserver();

    // Polling fallback (checks every 500ms)
    // This ensures we catch the banner even if observers miss it
    const pollInterval = setInterval(() => {
      updateTranslateState();
      
      // Try to setup resize observer if not already done
      if (!observersRef.current.resize) {
        setupResizeObserver();
      }
    }, 500);

    observersRef.current.pollInterval = pollInterval;

    // Cleanup
    return () => {
      if (observersRef.current.mutation) {
        observersRef.current.mutation.disconnect();
      }
      if (observersRef.current.resize) {
        observersRef.current.resize.disconnect();
      }
      if (observersRef.current.pollInterval) {
        clearInterval(observersRef.current.pollInterval);
      }
    };
  }, [updateTranslateState, detectGoogleTranslateBanner]);

  // Development mode indicator
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <Box
      id="google-translate-spacer"
      aria-hidden={true}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: translateState.isActive ? `${translateState.bannerHeight}px` : 0,
        zIndex: 99998, // Just below Google Translate banner (which is 99999)
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        
        // Responsive adjustments
        '@media (max-width: 600px)': {
          // Mobile: Ensure proper spacing
        },
        '@media (min-width: 601px) and (max-width: 1024px)': {
          // Tablet: Adjust if needed
        },
        '@media (min-width: 1025px)': {
          // Desktop: Standard behavior
        },
      }}
    >
    </Box>
  );
}

/**
 * Hook to get the current Google Translate offset
 * Useful for components that need to adjust their position
 */
export function useGoogleTranslateOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOffset = () => {
      const spacer = document.getElementById('google-translate-spacer');
      if (spacer) {
        setOffset(spacer.offsetHeight);
      }
    };

    // Initial check
    updateOffset();

    // Watch for changes
    const observer = new MutationObserver(updateOffset);
    const spacer = document.getElementById('google-translate-spacer');
    
    if (spacer) {
      observer.observe(spacer, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    // Polling fallback
    const interval = setInterval(updateOffset, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return offset;
}
