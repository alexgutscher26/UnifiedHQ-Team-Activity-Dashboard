import type React from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from 'react';
import { GlobalErrorBoundary } from '@/components/error-boundaries';
import './globals.css';

export const metadata: Metadata = {
  title: 'UnifiedHQ - Team Activity Dashboard',
  description: 'One dashboard to see everything your team did today',
  generator: 'v0.app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <GlobalErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </GlobalErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
