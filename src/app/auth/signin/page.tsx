'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Github, Slack } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastMethod, setLastMethod] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get the last used login method
    const lastUsedMethod = authClient.getLastUsedLoginMethod();
    setLastMethod(lastUsedMethod);
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: '/dashboard',
        },
        {
          onSuccess: () => {
            router.push('/dashboard');
          },
          onError: ctx => {
            setError(ctx.error.message);
          },
        }
      );
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'github' | 'slack') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
      });
    } catch (err) {
      setError('Failed to sign in with ' + provider);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl text-center'>Sign In</CardTitle>
          <CardDescription className='text-center'>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Social Sign In */}
          <div className='space-y-2'>
            <div className='relative'>
              <Button
                variant={lastMethod === 'github' ? 'default' : 'outline'}
                className='w-full'
                onClick={() => handleSocialSignIn('github')}
              >
                <Github className='mr-2 h-4 w-4' />
                Continue with GitHub
                {lastMethod === 'github' && (
                  <Badge variant='secondary' className='ml-2'>
                    Last used
                  </Badge>
                )}
              </Button>
            </div>
            <div className='relative'>
              <Button
                variant={lastMethod === 'slack' ? 'default' : 'outline'}
                className='w-full'
                onClick={() => handleSocialSignIn('slack')}
              >
                <Slack className='mr-2 h-4 w-4' />
                Continue with Slack
                {lastMethod === 'slack' && (
                  <Badge variant='secondary' className='ml-2'>
                    Last used
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <Separator className='w-full' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-2 text-muted-foreground'>
                Or continue with
              </span>
            </div>
          </div>

          {/* Email/Password Sign In */}
          <form onSubmit={handleEmailSignIn} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='m@example.com'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className='text-sm text-red-600 bg-red-50 p-2 rounded'>
                {error}
              </div>
            )}
            <div className='relative'>
              <Button
                type='submit'
                variant={lastMethod === 'email' ? 'default' : 'default'}
                className='w-full'
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                {lastMethod === 'email' && (
                  <Badge variant='secondary' className='ml-2'>
                    Last used
                  </Badge>
                )}
              </Button>
            </div>
          </form>

          <div className='text-center text-sm'>
            Don't have an account?{' '}
            <Link href='/auth/signup' className='text-primary hover:underline'>
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
