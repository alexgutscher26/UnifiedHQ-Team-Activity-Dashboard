'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ErrorBoundary } from './error-boundary';
import { Bug, AlertTriangle } from 'lucide-react';

/**
 * Component that throws an error for testing error boundaries
 */
function ErrorThrower() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error(
      'This is a test error to verify error boundaries work correctly!'
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Bug className='h-5 w-5' />
          Error Boundary Test
        </CardTitle>
        <CardDescription>
          Click the button below to trigger an error and test the error
          boundary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => setShouldThrow(true)}
          variant='destructive'
          className='w-full'
        >
          <AlertTriangle className='mr-2 h-4 w-4' />
          Throw Test Error
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Test component wrapped with error boundary
 */
export function ErrorBoundaryTest() {
  return (
    <ErrorBoundary>
      <ErrorThrower />
    </ErrorBoundary>
  );
}

/**
 * Async error thrower for testing async error handling
 */
function AsyncErrorThrower() {
  const [isLoading, setIsLoading] = useState(false);

  const throwAsyncError = async () => {
    setIsLoading(true);

    // Simulate async operation that fails
    await new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Async operation failed!'));
      }, 1000);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Bug className='h-5 w-5' />
          Async Error Test
        </CardTitle>
        <CardDescription>
          Test error boundary with async operations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={throwAsyncError}
          disabled={isLoading}
          variant='destructive'
          className='w-full'
        >
          <AlertTriangle className='mr-2 h-4 w-4' />
          {isLoading ? 'Throwing Error...' : 'Throw Async Error'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AsyncErrorBoundaryTest() {
  return (
    <ErrorBoundary>
      <AsyncErrorThrower />
    </ErrorBoundary>
  );
}
