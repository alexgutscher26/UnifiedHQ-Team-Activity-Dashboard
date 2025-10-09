import { useState, useEffect } from 'react';

interface AuthStatus {
  signupMethod: 'github' | 'email' | 'unknown';
  isGitHubConnected: boolean;
  lastLoginMethod: string | null;
  hasEmailPassword: boolean;
  hasGitHub: boolean;
  githubAccount: {
    id: string;
    accountId: string;
    providerId: string;
    createdAt: string;
  } | null;
}

interface UseAuthStatusReturn {
  authStatus: AuthStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAuthStatus(): UseAuthStatusReturn {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/auth-status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAuthStatus(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch auth status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching auth status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  return {
    authStatus,
    isLoading,
    error,
    refetch: fetchAuthStatus,
  };
}
