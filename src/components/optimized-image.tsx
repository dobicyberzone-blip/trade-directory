'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder-image.png',
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`} style={{ overflow: 'hidden' }}>
      {/* Blur placeholder - shows while loading */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
      
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
      
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// Avatar component with fallback
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function OptimizedAvatar({ 
  src, 
  alt, 
  size = 40, 
  className = '' 
}: OptimizedAvatarProps) {
  const [error, setError] = useState(false);

  const initials = alt
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div 
      className={`relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {!error && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${size}px`}
          onError={() => setError(true)}
        />
      ) : (
        <span 
          className="text-gray-500 font-medium"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

// Thumbnail component for grids
interface ThumbnailProps {
  src?: string | null;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  className?: string;
}

export function Thumbnail({ 
  src, 
  alt, 
  aspectRatio = 'square',
  className = '' 
}: ThumbnailProps) {
  const [error, setError] = useState(false);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }[aspectRatio];

  return (
    <div className={`relative ${aspectRatioClass} ${className} overflow-hidden rounded-md bg-gray-100`}>
      {src && !error ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-12 h-12 text-gray-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
}
