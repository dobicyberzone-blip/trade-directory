'use client';

import { useEffect } from 'react';

// Core Web Vitals reporting utility
// Note: This component reports to Google Analytics when available
// The web-vitals library can be installed with: npm install web-vitals

export function WebVitalsReporter() {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Report to Google Analytics if available
    const reportWebVitals = (metric: { name: string; value: number; id: string }) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${metric.name}:`, metric.value);
      }

      // Send to Google Analytics
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }
    };

    // Try to load web-vitals library dynamically
    const initWebVitals = () => {
      // Use eval to dynamically require the module (works with Next.js)
      try {
        // @ts-ignore - web-vitals may not be installed
        const webVitals = require('web-vitals');
        if (webVitals && typeof webVitals.onCLS === 'function') {
          webVitals.onCLS(reportWebVitals);
          webVitals.onFID(reportWebVitals);
          webVitals.onLCP(reportWebVitals);
          webVitals.onFCP(reportWebVitals);
          webVitals.onTTFB(reportWebVitals);
        }
      } catch {
        // web-vitals not installed, skip reporting
        // Run: npm install web-vitals to enable
      }
    };

    // Delay initialization to after page load
    if (document.readyState === 'complete') {
      initWebVitals();
    } else {
      window.addEventListener('load', initWebVitals);
    }

    return () => {
      window.removeEventListener('load', initWebVitals);
    };
  }, []);

  return null;
}

// Preconnect to external domains
export function PreconnectResources() {
  return (
    <>
      <link rel="preconnect" href="https://www.keproba.go.ke" />
      <link rel="dns-prefetch" href="https://www.keproba.go.ke" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
    </>
  );
}

// Script for lazy loading images with Intersection Observer
export function LazyLoadImagesScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Progressive enhancement for lazy loading
          if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const img = entry.target;
                  if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                  }
                }
              });
            }, {
              rootMargin: '50px 0px',
              threshold: 0.01
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
              imageObserver.observe(img);
            });
          } else {
            // Fallback: load all images immediately
            document.querySelectorAll('img[data-src]').forEach(img => {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            });
          }
        `,
      }}
    />
  );
}

// Performance tips for developers
export function PerformanceMetrics({ 
  showInDev = true 
}: { 
  showInDev?: boolean 
}) {
  useEffect(() => {
    if (!showInDev || process.env.NODE_ENV !== 'development') return;

    // Measure page load time
    const perfData = window.performance;
    if (perfData) {
      const timing = perfData.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      console.log(`%c⚡ Performance Metrics:`, 'color: #10b981; font-weight: bold;');
      console.log(`  Page Load: ${pageLoadTime}ms`);
      console.log(`  DOM Ready: ${domReady}ms`);
      
      if (pageLoadTime > 3000) {
        console.warn('⚠️ Page load time exceeds 3 seconds!');
      }
    }
  }, [showInDev]);

  return null;
}

// Viewport meta helper for mobile optimization
export const viewportMeta = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
