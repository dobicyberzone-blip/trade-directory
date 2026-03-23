'use client';

import { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  businessName: string;
  onMapClick?: () => void;
}

/**
 * Mini map using OpenStreetMap embed — free, no API key, always works.
 * Falls back to a styled placeholder if coords are invalid.
 */
export function MiniMap({ latitude, longitude, businessName, onMapClick }: MiniMapProps) {
  const [iframeError, setIframeError] = useState(false);

  const hasValidCoords = latitude !== 0 && longitude !== 0 && !isNaN(latitude) && !isNaN(longitude);

  if (!hasValidCoords || iframeError) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 cursor-pointer select-none"
        onClick={onMapClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onMapClick?.()}
        aria-label={`View ${businessName} on map`}
      >
        <MapPin className="h-8 w-8 text-green-600 mb-1" />
        <span className="text-xs font-semibold text-green-800 text-center px-2 line-clamp-2">{businessName}</span>
        <span className="text-[10px] text-green-600 mt-1">Location not available</span>
      </div>
    );
  }

  // OpenStreetMap embed — free, no API key required
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.02}%2C${latitude - 0.02}%2C${longitude + 0.02}%2C${latitude + 0.02}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;

  return (
    <div
      className="w-full h-full relative overflow-hidden cursor-pointer group"
      onClick={onMapClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onMapClick?.()}
      aria-label={`View ${businessName} on map`}
    >
      <iframe
        src={osmSrc}
        className="w-full h-full border-0 pointer-events-none"
        title={`Map showing location of ${businessName}`}
        loading="lazy"
        onError={() => setIframeError(true)}
        sandbox="allow-scripts allow-same-origin"
      />
      {/* Click overlay — captures clicks since iframe is pointer-events-none */}
      <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
      {/* Bottom label */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-semibold text-gray-700 flex items-center gap-1">
          <MapPin className="h-3 w-3 text-green-600" />
          {businessName.length > 20 ? businessName.slice(0, 20) + '…' : businessName}
        </div>
        <a
          href={osmLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="bg-white/90 backdrop-blur-sm p-1 rounded-md text-gray-500 hover:text-green-600 transition-colors"
          aria-label="Open in OpenStreetMap"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
