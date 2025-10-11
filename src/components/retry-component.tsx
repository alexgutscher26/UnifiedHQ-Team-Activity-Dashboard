/**
 * Retry component for displaying retry states and handling user-initiated retries
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export interface RetryComponentProps {
  /** Current retry state */
  state: {
    loading: boolean;
    error: Error | null;
    attempts: number;
    retrying: boolean;
    canRetry: boolean;
  };
  /** Retry function */
  onRetry: () => void;
  /** Reset function */
  onReset?: () => void;
  /** Custom retry button text */
  retryText?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to show attempt count */
  showAttempts?: boolean;
  /** Whether to show success state */
  showSuccess?: boolean;
  /** Success message */
  successMessage?: string;
  /** Custom className */
  className?: string;
  /** Children to render when not in error state */
  children?: React.ReactNode;
}

export function RetryComponent({
  state,
  onRetry,
  onReset,
  retryText = 'Retry',
  errorMessage,
  showAttempts = true,
  showSuccess = false,
  successMessage = 'Operation completed successfully',
  className = '',
  children,
}: RetryComponentProps) {
  const { loading, error, attempts, retrying, canRetry } = state;

  // Show success state
  if (showSuccess && !loading && !error) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">{successMessage}</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <div>
            {errorMessage || error.message}
            {showAttempts && attempts > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                (Attempt {attempts})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={!canRetry || retrying}
              className="h-8"
            >
              {retrying ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {retryText}
                </>
              )}
            </Button>
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8"
              >
                Reset
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">
          {retrying ? 'Retrying...' : 'Loading...'}
        </span>
        {showAttempts && attempts > 0 && (
          <span className="text-xs text-muted-foreground">
            (Attempt {attempts})
          </span>
        )}
      </div>
    );
  }

  // Show children or default content
  return <div className={className}>{children}</div>;
}

/**
 * Hook-based retry component that uses the retry hook
 */
export interface UseRetryComponentProps<T = any> {
  /** Retry hook return value */
  retryHook: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    attempts: number;
    retrying: boolean;
    canRetry: boolean;
    retry: () => Promise<T>;
    reset: () => void;
  };
  /** Custom props for the retry component */
  retryProps?: Partial<RetryComponentProps>;
  /** Children to render when not in error state */
  children?: React.ReactNode;
}

export function UseRetryComponent<T = any>({
  retryHook,
  retryProps = {},
  children,
}: UseRetryComponentProps<T>) {
  return (
    <RetryComponent
      state={{
        loading: retryHook.loading,
        error: retryHook.error,
        attempts: retryHook.attempts,
        retrying: retryHook.retrying,
        canRetry: retryHook.canRetry,
      }}
      onRetry={retryHook.retry}
      onReset={retryHook.reset}
      {...retryProps}
    >
      {children}
    </RetryComponent>
  );
}

/**
 * Inline retry component for simple use cases
 */
export interface InlineRetryProps {
  /** Error state */
  error?: Error | null;
  /** Loading state */
  loading?: boolean;
  /** Retry function */
  onRetry?: () => void;
  /** Custom error message */
  errorMessage?: string;
  /** Custom retry text */
  retryText?: string;
  /** Whether to show as inline text */
  inline?: boolean;
}

export function InlineRetry({
  error,
  loading = false,
  onRetry,
  errorMessage,
  retryText = 'Retry',
  inline = false,
}: InlineRetryProps) {
  if (loading) {
    return (
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </span>
    );
  }

  if (error) {
    return (
      <span className={`flex items-center gap-2 text-sm text-destructive ${inline ? 'inline-flex' : 'flex'}`}>
        <AlertCircle className="h-3 w-3" />
        <span>{errorMessage || error.message}</span>
        {onRetry && (
          <Button
            variant="link"
            size="sm"
            onClick={onRetry}
            className="h-auto p-0 text-destructive hover:text-destructive/80"
          >
            {retryText}
          </Button>
        )}
      </span>
    );
  }

  return null;
}

/**
 * Retry button component
 */
export interface RetryButtonProps {
  /** Retry function */
  onRetry: () => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Custom text */
  children?: React.ReactNode;
  /** Custom className */
  className?: string;
}

export function RetryButton({
  onRetry,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  children = 'Retry',
  className = '',
}: RetryButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onRetry}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          <RefreshCw className="h-3 w-3 mr-1" />
          {children}
        </>
      )}
    </Button>
  );
}
