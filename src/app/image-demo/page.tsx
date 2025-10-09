'use client';

import React from 'react';
import { OptimizedImage } from '@/components/optimized-image';
import { AvatarImage } from '@/components/avatar-image';
import { ImageGallery } from '@/components/image-gallery';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const demoImages = [
  {
    src: '/placeholder.jpg',
    alt: 'Demo Image 1',
    caption: 'This is a demo image with WebP optimization',
    width: 800,
    height: 600,
  },
  {
    src: '/placeholder-logo.png',
    alt: 'Demo Image 2',
    caption: 'Logo with optimized loading',
    width: 400,
    height: 300,
  },
  {
    src: '/placeholder.svg',
    alt: 'Demo Image 3',
    caption: 'SVG image with proper handling',
    width: 600,
    height: 400,
  },
];

export default function ImageDemoPage() {
  return (
    <div className='container mx-auto p-6 space-y-8'>
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold'>Image Optimization Demo</h1>
        <p className='text-lg text-muted-foreground'>
          Showcasing WebP support, lazy loading, and responsive images
        </p>
      </div>

      {/* Basic Optimized Images */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Optimized Images</CardTitle>
          <CardDescription>
            Images with automatic WebP conversion and responsive sizing
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Hero Quality (90%)</h3>
              <OptimizedImage
                src='/placeholder.jpg'
                alt='Hero image'
                width={400}
                height={300}
                quality='hero'
                className='rounded-lg'
              />
            </div>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Card Quality (80%)</h3>
              <OptimizedImage
                src='/placeholder.jpg'
                alt='Card image'
                width={400}
                height={300}
                quality='card'
                className='rounded-lg'
              />
            </div>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Thumbnail Quality (70%)</h3>
              <OptimizedImage
                src='/placeholder.jpg'
                alt='Thumbnail image'
                width={400}
                height={300}
                quality='thumbnail'
                className='rounded-lg'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Images */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar Images</CardTitle>
          <CardDescription>
            Optimized avatar images with different sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-4'>
            <div className='text-center space-y-2'>
              <AvatarImage
                src='/placeholder-user.jpg'
                alt='Small avatar'
                size='sm'
              />
              <p className='text-sm text-muted-foreground'>Small (32px)</p>
            </div>
            <div className='text-center space-y-2'>
              <AvatarImage
                src='/placeholder-user.jpg'
                alt='Medium avatar'
                size='md'
              />
              <p className='text-sm text-muted-foreground'>Medium (40px)</p>
            </div>
            <div className='text-center space-y-2'>
              <AvatarImage
                src='/placeholder-user.jpg'
                alt='Large avatar'
                size='lg'
              />
              <p className='text-sm text-muted-foreground'>Large (48px)</p>
            </div>
            <div className='text-center space-y-2'>
              <AvatarImage
                src='/placeholder-user.jpg'
                alt='Extra large avatar'
                size='xl'
              />
              <p className='text-sm text-muted-foreground'>
                Extra Large (64px)
              </p>
            </div>
            <div className='text-center space-y-2'>
              <AvatarImage
                src='/placeholder-user.jpg'
                alt='Custom avatar'
                size={80}
              />
              <p className='text-sm text-muted-foreground'>Custom (80px)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Image Gallery</CardTitle>
          <CardDescription>
            Interactive gallery with thumbnails and fullscreen view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageGallery
            images={demoImages}
            showThumbnails={true}
            autoPlay={false}
          />
        </CardContent>
      </Card>

      {/* Lazy Loading Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Lazy Loading Demo</CardTitle>
          <CardDescription>
            Images that load only when they come into view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-8'>
            <p className='text-muted-foreground'>
              Scroll down to see images load as they come into view...
            </p>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className='space-y-2'>
                <h3 className='font-semibold'>Lazy Loaded Image {i + 1}</h3>
                <OptimizedImage
                  src='/placeholder.jpg'
                  alt={`Lazy loaded image ${i + 1}`}
                  width={600}
                  height={400}
                  quality='card'
                  lazy={true}
                  className='rounded-lg'
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Image Optimization Features</CardTitle>
          <CardDescription>What this implementation provides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Format Support</h3>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>WebP</Badge>
                <Badge variant='secondary'>AVIF</Badge>
                <Badge variant='secondary'>JPEG</Badge>
                <Badge variant='secondary'>PNG</Badge>
                <Badge variant='secondary'>SVG</Badge>
              </div>
            </div>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Optimization Features</h3>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>Lazy Loading</Badge>
                <Badge variant='secondary'>Responsive Sizing</Badge>
                <Badge variant='secondary'>Quality Control</Badge>
                <Badge variant='secondary'>Blur Placeholders</Badge>
              </div>
            </div>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Performance</h3>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>Preloading</Badge>
                <Badge variant='secondary'>Caching</Badge>
                <Badge variant='secondary'>Error Handling</Badge>
                <Badge variant='secondary'>Fallbacks</Badge>
              </div>
            </div>
            <div className='space-y-2'>
              <h3 className='font-semibold'>User Experience</h3>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>Loading States</Badge>
                <Badge variant='secondary'>Smooth Transitions</Badge>
                <Badge variant='secondary'>Keyboard Navigation</Badge>
                <Badge variant='secondary'>Touch Support</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
