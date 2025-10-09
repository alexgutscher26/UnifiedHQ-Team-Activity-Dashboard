'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, ExternalLink, CheckCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface GitHubConnectionPromptProps {
  onConnectionUpdate?: (connected: boolean) => void;
}

export function GitHubConnectionPrompt({
  onConnectionUpdate,
}: GitHubConnectionPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectGitHub = () => {
    setIsLoading(true);
    setError(null);

    console.log('Initiating GitHub OAuth for activity syncing...');
    // Use the authClient method but don't await it
    // This will cause a redirect to GitHub
    authClient
      .linkSocial({
        provider: 'github',
        callbackURL: '/dashboard',
      })
      .catch(error => {
        // Only handle errors that aren't redirects
        if (
          error.name !== 'AbortError' &&
          !error.message.includes('redirect')
        ) {
          console.error('GitHub OAuth error:', error);
          setError('Failed to connect to GitHub. Please try again.');
          setIsLoading(false);
        }
      });
  };

  return (
    <Card className='border-blue-200 bg-blue-50/50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-blue-900'>
          <Github className='size-5' />
          Connect GitHub for Activity Sync
        </CardTitle>
        <CardDescription className='text-blue-700'>
          Sync your GitHub activity to see real commits, pull requests, and
          repository updates in your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Alert className='border-blue-200 bg-blue-100'>
          <CheckCircle className='h-4 w-4 text-blue-600' />
          <AlertDescription className='text-blue-800'>
            <strong>What you'll get:</strong> Real-time GitHub activity, commit
            history, pull request updates, and repository insights directly in
            your dashboard.
          </AlertDescription>
        </Alert>

        <div className='space-y-2'>
          <h4 className='font-medium text-blue-900'>Features you'll unlock:</h4>
          <ul className='text-sm text-blue-700 space-y-1'>
            <li>• Recent commits from your repositories</li>
            <li>• Pull request activity and status updates</li>
            <li>• Real-time activity feed with GitHub data</li>
            <li>• Direct links to GitHub commits and PRs</li>
            <li>• Repository selection and management</li>
          </ul>
        </div>

        <div className='flex gap-2'>
          <Button
            onClick={connectGitHub}
            className='flex-1 bg-blue-600 hover:bg-blue-700'
            disabled={isLoading}
          >
            <Github className='size-4 mr-2' />
            {isLoading ? 'Connecting...' : 'Connect GitHub Account'}
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              window.open('https://github.com/settings/applications', '_blank')
            }
          >
            Manage Apps <ExternalLink className='size-4 ml-1' />
          </Button>
        </div>

        <p className='text-xs text-blue-600 text-center'>
          We'll only access your public repository data and activity
        </p>

        {error && (
          <Alert className='border-red-200 bg-red-50'>
            <AlertDescription className='text-red-800'>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
