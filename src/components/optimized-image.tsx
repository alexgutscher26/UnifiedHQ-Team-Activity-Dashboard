'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  getOptimizedImageProps,
  supportsWebP,
  preloadImage,
} from '@/lib/image-utils';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: 'hero' | 'card' | 'thumbnail' | 'avatar' | number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  lazy?: boolean;
  blur?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 800,
  height = 600,
  quality = 'card',
  priority = false,
  className = '',
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  fallback,
  lazy = true,
  blur = true,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check WebP support on mount
  useEffect(() => {
    supportsWebP().then(setWebpSupported);
  }, []);

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      preloadImage(src);
    }
  }, [priority, src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
    onError?.();
  };

  // Get quality value
  const getQualityValue = () => {
    if (typeof quality === 'number') return quality;

    const qualityMap = {
      hero: 90,
      card: 80,
      thumbnail: 70,
      avatar: 75,
    };

    return qualityMap[quality] || 80;
  };

  // Generate optimized image props
  const imageProps = getOptimizedImageProps(imageSrc, alt, {
    width: fill ? undefined : width,
    height: fill ? undefined : height,
    quality: getQualityValue(),
    priority,
    className: cn(
      'transition-opacity duration-300',
      isLoading && 'opacity-0',
      !isLoading && 'opacity-100',
      className
    ),
    sizes,
  });

  // Add fill prop if specified
  if (fill) {
    imageProps.fill = true;
  }

  // Add style prop if specified
  if (style) {
    imageProps.style = style;
  }

  // Add event handlers
  imageProps.onLoad = handleLoad;
  imageProps.onError = handleError;

  // Show loading placeholder
  if (isLoading && blur) {
    return (
      <div
        className={cn(
          'relative overflow-hidden bg-gray-200 animate-pulse',
          fill ? 'w-full h-full' : '',
          className
        )}
        style={fill ? style : { width, height }}
      >
        <div className='absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse' />
      </div>
    );
  }

  // Show error state
  if (hasError && !fallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          fill ? 'w-full h-full' : '',
          className
        )}
        style={fill ? style : { width, height }}
      >
        <svg
          className='w-8 h-8'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      ref={imgRef}
      {...imageProps}
      loading={lazy && !priority ? 'lazy' : 'eager'}
    />
  );
};

// Export a default version for easier imports
export default OptimizedImage;
