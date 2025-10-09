'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { OptimizedImage } from './optimized-image';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  interval?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  showThumbnails = true,
  autoPlay = false,
  interval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentImage = images[currentIndex];

  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  /**
   * Decrements the current image index in a circular manner.
   */
  const prevImage = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  /**
   * Sets the current image index.
   */
  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  /**
   * Sets the application to fullscreen mode.
   */
  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  // Auto-play functionality
  React.useEffect(() => {
    if (autoPlay && images.length > 1) {
      const timer = setInterval(nextImage, interval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, interval, images.length]);

  // Keyboard navigation
  React.useEffect(() => {
    /**
     * Handles key down events for fullscreen navigation.
     *
     * This function listens for specific key presses when the application is in fullscreen mode.
     * It checks the pressed key and performs actions such as closing fullscreen on 'Escape',
     * navigating to the previous image on 'ArrowLeft', and moving to the next image on 'ArrowRight'.
     *
     * @param e - The KeyboardEvent object representing the key press event.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case 'Escape':
            closeFullscreen();
            break;
          case 'ArrowLeft':
            prevImage();
            break;
          case 'ArrowRight':
            nextImage();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!images.length) {
    return (
      <div className='flex items-center justify-center h-64 bg-gray-100 rounded-lg'>
        <p className='text-gray-500'>No images to display</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Main Image */}
        <div className='relative group'>
          <OptimizedImage
            src={currentImage.src}
            alt={currentImage.alt}
            width={currentImage.width || 800}
            height={currentImage.height || 600}
            quality='hero'
            className='w-full h-auto rounded-lg cursor-pointer'
            onClick={openFullscreen}
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant='ghost'
                size='icon'
                className='absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
                onClick={prevImage}
              >
                <ChevronLeft className='w-6 h-6' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
                onClick={nextImage}
              >
                <ChevronRight className='w-6 h-6' />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className='absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm'>
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && images.length > 1 && (
          <div className='flex gap-2 mt-4 overflow-x-auto'>
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  width={80}
                  height={80}
                  quality='thumbnail'
                  className='w-full h-full object-cover'
                />
              </button>
            ))}
          </div>
        )}

        {/* Caption */}
        {currentImage.caption && (
          <p className='mt-2 text-sm text-gray-600 text-center'>
            {currentImage.caption}
          </p>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center'>
          <div className='relative max-w-7xl max-h-full p-4'>
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-4 right-4 text-white hover:bg-white/20'
              onClick={closeFullscreen}
            >
              <X className='w-6 h-6' />
            </Button>

            <OptimizedImage
              src={currentImage.src}
              alt={currentImage.alt}
              width={currentImage.width || 1200}
              height={currentImage.height || 800}
              quality='hero'
              className='max-w-full max-h-full object-contain'
            />

            {images.length > 1 && (
              <>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20'
                  onClick={prevImage}
                >
                  <ChevronLeft className='w-8 h-8' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20'
                  onClick={nextImage}
                >
                  <ChevronRight className='w-8 h-8' />
                </Button>
              </>
            )}

            {currentImage.caption && (
              <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded'>
                {currentImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
