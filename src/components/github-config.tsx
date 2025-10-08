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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface GitHubConfigProps {
  onConfigUpdate?: (config: {
    owner: string;
    repo: string;
    token: string;
  }) => void;
}

export function GitHubConfig({ onConfigUpdate }: GitHubConfigProps) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const validateConfig = async () => {
    if (!owner || !repo || !token) {
      setValidationResult({
        success: false,
        message: 'Please fill in all fields',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch(
        `/api/github?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&token=${encodeURIComponent(token)}`
      );

      if (response.ok) {
        const data = await response.json();
        setValidationResult({
          success: true,
          message: `Successfully connected to ${owner}/${repo}. Found ${data.data.commits} commits and ${data.data.pullRequests} pull requests.`,
        });
        onConfigUpdate?.({ owner, repo, token });
      } else {
        const error = await response.json();
        setValidationResult({
          success: false,
          message: error.details || 'Failed to connect to GitHub repository',
        });
      }
    } catch (error) {
      setValidationResult({
        success: false,
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='size-5' />
          GitHub Integration Setup
        </CardTitle>
        <CardDescription>
          Connect your GitHub repository to see real commits and pull requests
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='owner'>Repository Owner</Label>
            <Input
              id='owner'
              placeholder='your-username'
              value={owner}
              onChange={e => setOwner(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='repo'>Repository Name</Label>
            <Input
              id='repo'
              placeholder='your-repository'
              value={repo}
              onChange={e => setRepo(e.target.value)}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='token'>Personal Access Token</Label>
          <Input
            id='token'
            type='password'
            placeholder='ghp_xxxxxxxxxxxxxxxxxxxx'
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <p className='text-xs text-muted-foreground'>
            Create a token at{' '}
            <a
              href='https://github.com/settings/tokens'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline inline-flex items-center gap-1'
            >
              GitHub Settings <ExternalLink className='size-3' />
            </a>{' '}
            with repo access
          </p>
        </div>

        {validationResult && (
          <Alert
            className={
              validationResult.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            {validationResult.success ? (
              <CheckCircle className='h-4 w-4 text-green-600' />
            ) : (
              <AlertCircle className='h-4 w-4 text-red-600' />
            )}
            <AlertDescription
              className={
                validationResult.success ? 'text-green-800' : 'text-red-800'
              }
            >
              {validationResult.message}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={validateConfig}
          disabled={isValidating || !owner || !repo || !token}
          className='w-full'
        >
          {isValidating ? 'Validating...' : 'Test Connection'}
        </Button>

        <div className='text-xs text-muted-foreground space-y-1'>
          <p>
            <strong>Note:</strong> This configuration is stored locally in your
            browser.
          </p>
          <p>For production use, set these as environment variables:</p>
          <ul className='list-disc list-inside ml-2 space-y-1'>
            <li>
              <code>NEXT_PUBLIC_GITHUB_OWNER</code>
            </li>
            <li>
              <code>NEXT_PUBLIC_GITHUB_REPO</code>
            </li>
            <li>
              <code>GITHUB_TOKEN</code>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
