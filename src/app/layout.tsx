import type React from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from 'react';
import { GlobalErrorBoundary } from '@/components/error-boundaries';
import { MemoryMonitor } from '@/components/memory-monitor';
import { ThemeProvider } from '@/components/theme-provider';
import { CustomThemeProvider } from '@/contexts/theme-context';
import { ToastContainer } from '@/components/toast';
import { RateLimitOverlay } from '@/components/rate-limit';
import { PostHogProvider } from '@/components/posthog-provider';
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
    <html lang='en' suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <PostHogProvider>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <CustomThemeProvider>
              <GlobalErrorBoundary>
                <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              </GlobalErrorBoundary>
              <ToastContainer />
              <RateLimitOverlay />
              <Analytics />
              <MemoryMonitor />
            </CustomThemeProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
