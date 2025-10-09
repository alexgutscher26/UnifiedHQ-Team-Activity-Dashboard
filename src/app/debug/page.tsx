'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * Renders the Debug Page for GitHub Sync debugging.
 *
 * This component manages the state for loading debug information and handles the fetching of debug data from the API.
 * It provides buttons to retrieve debug info and test synchronization, displaying relevant debug information,
 * connection status, selected repositories, stored activities, and test results.
 * The component utilizes toast notifications to inform the user of the success or failure of operations.
 *
 * @returns JSX.Element representing the Debug Page.
 */
export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runDebug = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/github-sync');
      const data = await response.json();
      setDebugInfo(data);

      if (response.ok) {
        toast({
          title: 'Debug Info Retrieved',
          description: 'Check the debug information below',
        });
      } else {
        toast({
          title: 'Debug Error',
          description: data.error || 'Failed to get debug info',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch debug info',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiates a synchronization process with the GitHub integration.
   *
   * This function sets a loading state, makes a POST request to the GitHub sync API, and handles the response.
   * If the sync is successful, it displays a success message and refreshes debug information by calling runDebug().
   * In case of failure, it shows an error message based on the response or a generic failure message.
   * Any errors during the fetch operation are caught and handled by displaying an error toast.
   * Finally, it resets the loading state.
   */
  const testSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/github/sync', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sync Successful',
          description: data.message,
        });
        // Refresh debug info
        await runDebug();
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Failed to sync',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto p-6 max-w-4xl'>
      <Card>
        <CardHeader>
          <CardTitle>GitHub Sync Debug</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Button onClick={runDebug} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Get Debug Info'}
            </Button>
            <Button onClick={testSync} disabled={isLoading} variant='outline'>
              {isLoading ? 'Syncing...' : 'Test Sync'}
            </Button>
          </div>

          {debugInfo && (
            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold mb-2'>Connection Status</h3>
                <p>
                  GitHub Connected:{' '}
                  {debugInfo.hasConnection ? '✅ Yes' : '❌ No'}
                </p>
                {debugInfo.connectionExpiresAt && (
                  <p>
                    Token Expires:{' '}
                    {new Date(debugInfo.connectionExpiresAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <h3 className='font-semibold mb-2'>Selected Repositories</h3>
                <p>Count: {debugInfo.selectedRepositories}</p>
                {debugInfo.selectedRepos &&
                  debugInfo.selectedRepos.length > 0 && (
                    <ul className='list-disc list-inside'>
                      {debugInfo.selectedRepos.map((repo: any) => (
                        <li key={repo.id}>{repo.name}</li>
                      ))}
                    </ul>
                  )}
              </div>

              <div>
                <h3 className='font-semibold mb-2'>Stored Activities</h3>
                <p>Count: {debugInfo.storedActivities}</p>
                {debugInfo.activities && debugInfo.activities.length > 0 && (
                  <ul className='list-disc list-inside'>
                    {debugInfo.activities.map((activity: any) => (
                      <li key={activity.id}>
                        {activity.title} ({activity.eventType}) -{' '}
                        {new Date(activity.timestamp).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className='font-semibold mb-2'>GitHub API Test</h3>
                <p>
                  Status:{' '}
                  {debugInfo.githubTest?.success ? '✅ Success' : '❌ Failed'}
                </p>
                {debugInfo.githubTest?.success && (
                  <p>Username: {debugInfo.githubTest.username}</p>
                )}
                {debugInfo.githubTest?.error && (
                  <p className='text-red-600'>
                    Error: {debugInfo.githubTest.error}
                  </p>
                )}
              </div>

              <div>
                <h3 className='font-semibold mb-2'>Repository Access Test</h3>
                {debugInfo.repoTest ? (
                  <>
                    <p>
                      Status:{' '}
                      {debugInfo.repoTest.success ? '✅ Success' : '❌ Failed'}
                    </p>
                    <p>Repository: {debugInfo.repoTest.repo}</p>
                    {debugInfo.repoTest.success && (
                      <p>Commits Found: {debugInfo.repoTest.commitsCount}</p>
                    )}
                    {debugInfo.repoTest.error && (
                      <p className='text-red-600'>
                        Error: {debugInfo.repoTest.error}
                      </p>
                    )}
                  </>
                ) : (
                  <p>No repositories selected</p>
                )}
              </div>

              <div>
                <h3 className='font-semibold mb-2'>Raw Debug Data</h3>
                <pre className='bg-gray-100 p-4 rounded text-xs overflow-auto'>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
