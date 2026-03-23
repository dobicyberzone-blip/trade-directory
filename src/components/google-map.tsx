'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, AlertCircle } from 'lucide-react';

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

interface BusinessMapProps {
  businesses: Business[];
  onViewCardClick: (business: Business) => void;
  focusedBusiness?: Business | null;
  onFocusedBusinessChange?: (business: Business | null) => void;
  showControls?: boolean;
  showLegend?: boolean;
  showSearch?: boolean;
  enableClustering?: boolean;
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 0.0236, lng: 37.9062 }; // Kenya center
const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: 2, // DROPDOWN_MENU = 2, HORIZONTAL_BAR = 1
    position: 3, // TOP_RIGHT = 3
    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
  },
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

export function BusinessMap({
  businesses,
  onViewCardClick,
  focusedBusiness,
}: BusinessMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'google-map-script',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  const onUnmount = useCallback(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    mapRef.current = null;
  }, []);

  // Place markers whenever map is ready or businesses change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();

    const infoWindow = new google.maps.InfoWindow();
    infoWindowRef.current = infoWindow;

    const validBusinesses = businesses.filter(b => b.latitude !== 0 && b.longitude !== 0);

    // Expose click handler for info window button
    (window as Window & { __gmViewCard?: (id: string) => void }).__gmViewCard = (id: string) => {
      const b = businesses.find(biz => biz.id === id);
      if (b) { infoWindow.close(); onViewCardClick(b); }
    };

    const markers = validBusinesses.map(business => {
      const isVerified = business.verificationStatus === 'VERIFIED';

      // Industry-standard teardrop pin using SVG path
      const pinColor = isVerified ? '#16a34a' : '#6b7280';
      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 26 16 26S32 26.5 32 16C32 7.163 24.837 0 16 0z"
            fill="${pinColor}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="7" fill="white" opacity="0.9"/>
          ${isVerified
            ? `<path d="M11 16l3.5 3.5L21 12" stroke="${pinColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
            : `<circle cx="16" cy="16" r="3" fill="${pinColor}"/>`
          }
        </svg>
      `;
      const encodedSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg);

      const marker = new google.maps.Marker({
        position: { lat: business.latitude, lng: business.longitude },
        map: mapRef.current!,
        title: business.name,
        icon: {
          url: encodedSvg,
          scaledSize: new google.maps.Size(32, 42),
          anchor: new google.maps.Point(16, 42),
        },
      });

      marker.addListener('click', () => {
        const stars = business.rating
          ? '★'.repeat(Math.round(business.rating)) + '☆'.repeat(5 - Math.round(business.rating))
          : '';
        // Google Maps directions URL — uses user's current location as origin automatically
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}&travelmode=driving`;
        infoWindow.setContent(`
          <div style="font-family:sans-serif;max-width:240px;padding:4px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${business.name}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:2px">${business.sector || ''}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${business.location || ''}</div>
            ${stars ? `<div style="color:#f59e0b;font-size:13px;margin-bottom:6px">${stars}</div>` : ''}
            ${isVerified ? '<span style="background:#d1fae5;color:#065f46;font-size:11px;padding:2px 8px;border-radius:9999px;font-weight:600">✓ Verified</span>' : ''}
            <div style="margin-top:10px;display:flex;gap:6px">
              <button
                onclick="window.__gmViewCard && window.__gmViewCard('${business.id}')"
                style="flex:1;background:#16a34a;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600"
              >View Profile</button>
              <a
                href="${directionsUrl}"
                target="_blank"
                rel="noopener noreferrer"
                style="flex:1;background:#1d4ed8;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;text-decoration:none;text-align:center;display:inline-block"
              >📍 Directions</a>
            </div>
          </div>
        `);
        infoWindow.open(mapRef.current, marker);
      });

      return marker;
    });

    markersRef.current = markers;

    // Fit bounds to show all markers
    if (validBusinesses.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validBusinesses.forEach(b => bounds.extend({ lat: b.latitude, lng: b.longitude }));
      mapRef.current!.fitBounds(bounds, 60);
      const listener = google.maps.event.addListenerOnce(mapRef.current!, 'idle', () => {
        if ((mapRef.current!.getZoom() ?? 0) > 14) mapRef.current!.setZoom(14);
      });
      return () => google.maps.event.removeListener(listener);
    }
  }, [mapReady, businesses, onViewCardClick]);

  // Pan to focused business
  useEffect(() => {
    if (!focusedBusiness || !mapRef.current) return;
    mapRef.current.panTo({ lat: focusedBusiness.latitude, lng: focusedBusiness.longitude });
    mapRef.current.setZoom(14);
  }, [focusedBusiness]);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50">
        <div className="text-center p-6">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-800">Google Maps API key not configured</p>
          <p className="text-xs text-amber-600 mt-1">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Failed to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={DEFAULT_CENTER}
      zoom={6}
      options={MAP_OPTIONS}
      onLoad={onLoad}
      onUnmount={onUnmount}
    />
  );
}
