import type React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PostHogErrorTester } from '@/components/posthog-error-tester';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DashboardErrorBoundary } from '@/components/error-boundaries';
import { getCurrentUser } from '@/lib/get-user';

export default async function DebugPage() {
  const user = await getCurrentUser();

  return (
    <DashboardErrorBoundary>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant='inset' user={user} />
        <SidebarInset>
          <SiteHeader />
          <div className='flex flex-1 flex-col'>
            <div className='@container/main flex flex-1 flex-col gap-2'>
              <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
                {/* Page Header */}
                <div className='px-4 lg:px-6'>
                  <div className='mb-6'>
                    <h1 className='text-3xl font-bold text-white mb-2'>
                      PostHog Debug & Testing
                    </h1>
                    <p className='text-gray-400 text-lg'>
                      Test PostHog error tracking and debug configuration issues
                    </p>
                  </div>
                </div>

                {/* PostHog Error Tester Component */}
                <div className='px-4 lg:px-6'>
                  <PostHogErrorTester />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardErrorBoundary>
  );
}