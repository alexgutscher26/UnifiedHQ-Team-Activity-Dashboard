'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function PostHogTestPage() {
  const [posthogStatus, setPosthogStatus] = useState<'loading' | 'success' | 'error' | 'not-found'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Check if PostHog is available
    const checkPostHog = () => {
      try {
        if (typeof window !== 'undefined') {
          // Check if PostHog is loaded
          const posthog = (window as any).posthog;
          if (posthog && posthog.__loaded) {
            setPosthogStatus('success');
            console.log('PostHog is loaded and ready');
          } else {
            setPosthogStatus('not-found');
            setErrorMessage('PostHog is not loaded');
          }
        }
      } catch (error) {
        setPosthogStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Check after a short delay to allow PostHog to initialize
    const timeout = setTimeout(checkPostHog, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const testPostHogCapture = () => {
    try {
      if (typeof window !== 'undefined') {
        const posthog = (window as any).posthog;
        if (posthog) {
          posthog.capture('test_event', {
            test_property: 'test_value',
            timestamp: new Date().toISOString(),
          });
          console.log('Test event captured successfully');
        }
      }
    } catch (error) {
      console.error('Failed to capture test event:', error);
    }
  };

  const getStatusIcon = () => {
    switch (posthogStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'not-found':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (posthogStatus) {
      case 'success':
        return 'PostHog is loaded and ready';
      case 'error':
        return `Error: ${errorMessage}`;
      case 'not-found':
        return 'PostHog not found';
      default:
        return 'Checking PostHog status...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            PostHog Test
          </CardTitle>
          <CardDescription>
            Test PostHog initialization and functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Status:</p>
            <p className="text-sm text-muted-foreground">{getStatusText()}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Environment Variables:</p>
            <div className="text-xs space-y-1">
              <p>POSTHOG_KEY: {process.env.NEXT_PUBLIC_POSTHOG_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p>POSTHOG_HOST: {process.env.NEXT_PUBLIC_POSTHOG_HOST ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>

          <Button 
            onClick={testPostHogCapture} 
            disabled={posthogStatus !== 'success'}
            className="w-full"
          >
            Test Event Capture
          </Button>

          <div className="text-xs text-muted-foreground">
            <p>Check the browser console for detailed logs.</p>
            <p>If PostHog is working, you should see "PostHog loaded in offline mode" in the console.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
