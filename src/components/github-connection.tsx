'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface GitHubConnectionProps {
  onConnectionUpdate?: (connected: boolean) => void;
}

export function GitHubConnection({
  onConnectionUpdate,
}: GitHubConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    login: string;
    avatar_url: string;
  } | null>(null);
  const router = useRouter();

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/github/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.connected) {
          setIsConnected(true);
          onConnectionUpdate?.(true);
          // Dispatch event to update sidebar
          window.dispatchEvent(new CustomEvent('github-connection-changed'));
        } else {
          setIsConnected(false);
          onConnectionUpdate?.(false);
        }
      } else {
        setIsConnected(false);
        onConnectionUpdate?.(false);
      }
    } catch (err) {
      setIsConnected(false);
      onConnectionUpdate?.(false);
    }
  };

  const connectGitHub = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/dashboard',
      });
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      setError('Failed to connect to GitHub. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGitHub = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd have a disconnect endpoint
      // For now, we'll just update the UI state
      setIsConnected(false);
      setUserInfo(null);
      onConnectionUpdate?.(false);
    } catch (err) {
      setError('Failed to disconnect GitHub account');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Check connection status when component becomes visible (after OAuth redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <Card data-github-connection>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='size-5' />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to see real commits and pull requests
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isConnected ? (
          <div className='space-y-4'>
            <Alert className='border-green-200 bg-green-50'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800'>
                GitHub account connected successfully! You can now see real
                activity data.
              </AlertDescription>
            </Alert>

            {userInfo && (
              <div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
                <img
                  src={userInfo.avatar_url}
                  alt={userInfo.login}
                  className='size-8 rounded-full'
                />
                <div>
                  <p className='font-medium'>@{userInfo.login}</p>
                  <p className='text-sm text-muted-foreground'>
                    Connected via GitHub
                  </p>
                </div>
              </div>
            )}

            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={disconnectGitHub}
                disabled={isLoading}
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
              <Button
                variant='outline'
                onClick={() =>
                  window.open(
                    'https://github.com/settings/applications',
                    '_blank'
                  )
                }
              >
                Manage Apps <ExternalLink className='size-4 ml-1' />
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <Alert className='border-orange-200 bg-orange-50'>
              <AlertCircle className='h-4 w-4 text-orange-600' />
              <AlertDescription className='text-orange-800'>
                Connect your GitHub account to see real activity data from your
                repositories.
              </AlertDescription>
            </Alert>

            <div className='space-y-2'>
              <h4 className='font-medium'>What you'll get:</h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Recent commits from your repositories</li>
                <li>• Pull request activity and status</li>
                <li>• Real-time updates in your activity feed</li>
                <li>• Direct links to GitHub commits and PRs</li>
              </ul>
            </div>

            <Button
              onClick={connectGitHub}
              className='w-full'
              disabled={isLoading}
            >
              <Github className='size-4 mr-2' />
              {isLoading ? 'Connecting...' : 'Connect GitHub Account'}
            </Button>

            <p className='text-xs text-muted-foreground text-center'>
              We'll only access your public repository data and activity
            </p>
          </div>
        )}

        {error && (
          <Alert className='border-red-200 bg-red-50'>
            <AlertCircle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
