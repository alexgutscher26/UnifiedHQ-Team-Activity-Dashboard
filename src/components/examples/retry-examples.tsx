/**
 * Examples of how to use retry mechanisms in React components
 */

import React from 'react';
import { useRetry, useRetryOnMount, useRetryWithDeps, useRetryPolling } from '@/hooks/use-retry';
import { RetryComponent, UseRetryComponent, InlineRetry, RetryButton } from '@/components/retry-component';
import { RetryPresets } from '@/lib/retry-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Example API functions
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }
  return response.json();
}

async function fetchPosts() {
  const response = await fetch('/api/posts');
  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }
  return response.json();
}

async function updateUserProfile(userId: string, data: any) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Example 1: Basic retry with manual execution
 */
export function BasicRetryExample() {
  const retryHook = useRetry(fetchPosts, {
    ...RetryPresets.standard,
    onRetry: (error, attempt, delay) => {
      console.log(`Retrying in ${delay}ms (attempt ${attempt}):`, error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Retry Example</CardTitle>
        <CardDescription>
          Manual retry with standard configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UseRetryComponent
          retryHook={retryHook}
          retryProps={{
            retryText: 'Load Posts',
            errorMessage: 'Failed to load posts. Please try again.',
          }}
        >
          {retryHook.data && (
            <div>
              <h3>Posts loaded successfully!</h3>
              <p>Found {retryHook.data.length} posts</p>
            </div>
          )}
        </UseRetryComponent>
        
        <div className="mt-4">
          <Button onClick={() => retryHook.execute()}>
            Load Posts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: Retry on mount with dependencies
 */
export function RetryOnMountExample({ userId }: { userId: string }) {
  const retryHook = useRetryWithDeps(
    () => fetchUserData(userId),
    [userId], // Re-execute when userId changes
    {
      ...RetryPresets.quick,
      onRetry: (error, attempt, delay) => {
        console.log(`Retrying user fetch in ${delay}ms (attempt ${attempt})`);
      },
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retry on Mount Example</CardTitle>
        <CardDescription>
          Automatically retries when component mounts or dependencies change
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UseRetryComponent
          retryHook={retryHook}
          retryProps={{
            retryText: 'Reload User',
            showAttempts: true,
          }}
        >
          {retryHook.data && (
            <div>
              <h3>User: {retryHook.data.name}</h3>
              <p>Email: {retryHook.data.email}</p>
            </div>
          )}
        </UseRetryComponent>
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Polling with retry
 */
export function PollingRetryExample() {
  const retryHook = useRetryPolling(
    fetchPosts,
    {
      ...RetryPresets.standard,
      interval: 10000, // Poll every 10 seconds
      startImmediately: true,
      stopOnError: false, // Continue polling even on errors
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polling with Retry</CardTitle>
        <CardDescription>
          Automatically polls data with retry on failures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Status: {retryHook.isPolling ? 'Polling' : 'Stopped'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={retryHook.isPolling ? retryHook.stopPolling : retryHook.startPolling}
            >
              {retryHook.isPolling ? 'Stop' : 'Start'} Polling
            </Button>
          </div>

          <UseRetryComponent
            retryHook={retryHook}
            retryProps={{
              retryText: 'Retry Now',
              showAttempts: true,
            }}
          >
            {retryHook.data && (
              <div>
                <h3>Latest Posts ({retryHook.data.length})</h3>
                <p>Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            )}
          </UseRetryComponent>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Optimistic updates with retry
 */
export function OptimisticRetryExample({ userId }: { userId: string }) {
  const [profile, setProfile] = React.useState({ name: '', email: '' });
  
  const retryHook = useRetry(
    (data: any) => updateUserProfile(userId, data),
    {
      ...RetryPresets.standard,
      onRetry: (error, attempt, delay) => {
        console.log(`Retrying profile update in ${delay}ms (attempt ${attempt})`);
      },
    }
  );

  const handleUpdate = async (newData: any) => {
    // Optimistic update
    setProfile(prev => ({ ...prev, ...newData }));
    
    try {
      await retryHook.execute(newData);
      // Success - data is already updated optimistically
    } catch (error) {
      // Revert optimistic update on failure
      setProfile(prev => ({ ...prev, name: '', email: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimistic Updates with Retry</CardTitle>
        <CardDescription>
          Updates UI immediately, reverts on failure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name:</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email:</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <InlineRetry
            error={retryHook.error}
            loading={retryHook.loading}
            onRetry={() => retryHook.execute(profile)}
            errorMessage="Failed to update profile"
            retryText="Retry Update"
          />

          <Button
            onClick={() => handleUpdate(profile)}
            disabled={retryHook.loading}
          >
            Update Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: Custom retry configuration
 */
export function CustomRetryExample() {
  const retryHook = useRetry(fetchPosts, {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
    jitter: true,
    shouldRetry: (error, attempt) => {
      // Only retry on 5xx errors and rate limits
      if (error.status >= 500) return true;
      if (error.status === 429) return true;
      return false;
    },
    onRetry: (error, attempt, delay) => {
      console.log(`Custom retry ${attempt}: ${error.message} (delay: ${delay}ms)`);
    },
    onMaxRetriesExceeded: (error, attempts) => {
      console.error(`Custom retry failed after ${attempts} attempts:`, error);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Retry Configuration</CardTitle>
        <CardDescription>
          Custom retry logic with specific error handling
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UseRetryComponent
          retryHook={retryHook}
          retryProps={{
            retryText: 'Custom Retry',
            showAttempts: true,
            errorMessage: 'Custom error handling failed',
          }}
        >
          {retryHook.data && (
            <div>
              <h3>Custom Retry Success!</h3>
              <p>Attempts: {retryHook.attempts}</p>
              <p>Total time: {retryHook.totalTime}ms</p>
            </div>
          )}
        </UseRetryComponent>

        <div className="mt-4 space-x-2">
          <Button onClick={() => retryHook.execute()}>
            Execute Custom Retry
          </Button>
          <RetryButton
            onRetry={retryHook.retry}
            loading={retryHook.loading}
            disabled={!retryHook.canRetry}
          >
            Retry Button
          </RetryButton>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 6: Retry with circuit breaker
 */
export function CircuitBreakerExample() {
  const [circuitState, setCircuitState] = React.useState('CLOSED');
  
  const retryHook = useRetry(fetchPosts, {
    ...RetryPresets.aggressive,
    onRetry: (error, attempt, delay) => {
      console.log(`Circuit breaker retry ${attempt}: ${error.message}`);
    },
    onMaxRetriesExceeded: (error, attempts) => {
      setCircuitState('OPEN');
      console.error('Circuit breaker opened after max retries');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuit Breaker Example</CardTitle>
        <CardDescription>
          Retry with circuit breaker pattern
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Circuit State:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              circuitState === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {circuitState}
            </span>
          </div>

          <UseRetryComponent
            retryHook={retryHook}
            retryProps={{
              retryText: 'Reset Circuit',
              showAttempts: true,
            }}
          >
            {retryHook.data && (
              <div>
                <h3>Circuit Breaker Success!</h3>
                <p>Data loaded despite circuit breaker</p>
              </div>
            )}
          </UseRetryComponent>

          <div className="space-x-2">
            <Button
              onClick={() => retryHook.execute()}
              disabled={circuitState === 'OPEN'}
            >
              Test Circuit
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCircuitState('CLOSED');
                retryHook.reset();
              }}
            >
              Reset Circuit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main examples component
 */
export function RetryExamples() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Retry Mechanism Examples</h1>
      <p className="text-muted-foreground">
        Examples of how to use retry mechanisms in your React components
      </p>
      
      <div className="grid gap-6">
        <BasicRetryExample />
        <RetryOnMountExample userId="user-123" />
        <PollingRetryExample />
        <OptimisticRetryExample userId="user-123" />
        <CustomRetryExample />
        <CircuitBreakerExample />
      </div>
    </div>
  );
}
