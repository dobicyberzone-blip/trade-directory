'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load the Google Maps component — only downloaded when user clicks "Map" view
const LazyGoogleMap = lazy(() =>
  import('./google-map').then(mod => ({ default: mod.BusinessMap }))
);

interface Business {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location: string;
  sector: string;
  description: string;
  verificationStatus: string;
  rating?: number;
  companyLogoUrl?: string;
}

interface MapViewProps {
  businesses: Business[];
  onViewCardClick: (business: Business) => void;
  focusedBusiness?: Business | null;
  onFocusedBusinessChange?: (business: Business | null) => void;
  showControls?: boolean;
  showLegend?: boolean;
  showSearch?: boolean;
  enableClustering?: boolean;
}

export function MapView({
  businesses,
  onViewCardClick,
  focusedBusiness,
  onFocusedBusinessChange,
  showControls = true,
  showLegend = true,
  showSearch = false,
  enableClustering = true,
}: MapViewProps) {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer — only load Google Maps SDK when map is visible
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTimeout(() => setShouldLoadMap(true), 100);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {shouldLoadMap ? (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
                  <div className="h-3 bg-gray-200 rounded w-24 mx-auto" />
                </div>
                <p className="text-sm text-gray-600 mt-2">Loading map...</p>
              </div>
            </div>
          }
        >
          <LazyGoogleMap
            businesses={businesses}
            onViewCardClick={onViewCardClick}
            focusedBusiness={focusedBusiness}
            onFocusedBusinessChange={onFocusedBusinessChange}
            showControls={showControls}
            showLegend={showLegend}
            showSearch={showSearch}
            enableClustering={enableClustering}
          />
        </Suspense>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-green-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Map</h3>
            <p className="text-sm text-gray-600 mb-4">{businesses.length} business locations</p>
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
              <span className="text-xs text-gray-600">Map loads when visible</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
