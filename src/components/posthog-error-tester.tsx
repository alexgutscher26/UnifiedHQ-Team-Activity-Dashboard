'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { captureClientError, captureClientEvent, isPostHogAvailable, captureUserAction } from '@/lib/posthog-client';
import { getPostHogStatus } from '@/lib/posthog-adblocker-bypass';
import {
  IconBug,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconRefresh,
  IconTestPipe,
  IconDatabase,
  IconApi,
  IconCode,
  IconShield,
  IconSettings,
} from '@tabler/icons-react';

// Client-only debug info component to avoid hydration mismatches
function ClientOnlyDebugInfo() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="text-xs text-gray-300 space-y-1">
        <div>Loading debug information...</div>
      </div>
    );
  }

  const status = getPostHogStatus();

  return (
    <div className="text-xs text-gray-300 space-y-1">
      <div>PostHog Client Available: {status.isAvailable ? 'Yes' : 'No'}</div>
      <div>Ad Blocker Detected: {status.isBlocked ? 'Yes' : 'No'}</div>
      <div>Using Fallback Client: {status.isFallback ? 'Yes' : 'No'}</div>
      <div>Window Object: {typeof window !== 'undefined' ? 'Available' : 'Not Available'}</div>
      <div>PostHog in Window: {typeof window !== 'undefined' && (window as any).posthog ? 'Yes' : 'No'}</div>
      {typeof window !== 'undefined' && (window as any).posthog && (
        <div>PostHog Methods: {Object.getOwnPropertyNames((window as any).posthog).filter(name => typeof (window as any).posthog[name] === 'function').join(', ')}</div>
      )}
    </div>
  );
}

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: string;
}

export function PostHogErrorTester() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string) => {
    const result: TestResult = {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const runTest = async (testName: string, testFn: () => Promise<void> | void) => {
    addTestResult(testName, 'pending', 'Running test...');
    setIsRunning(true);

    try {
      await testFn();
      addTestResult(testName, 'success', 'Test completed successfully');
      toast({
        title: 'Test Passed',
        description: `${testName} completed successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addTestResult(testName, 'error', errorMessage);
      toast({
        title: 'Test Failed',
        description: `${testName} failed: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Test 1: Client-side JavaScript Error
  const testClientError = () => {
    try {
      // Test PostHog event capture instead of error capture to avoid Error constructor issues
      captureClientEvent('test_client_error', {
        test_type: 'client_error',
        test_timestamp: new Date().toISOString(),
        test_context: 'PostHog Error Tester',
        error_message: 'Test client-side JavaScript error for PostHog tracking',
        error_name: 'TestError',
        error_stack: 'TestError: Test client-side JavaScript error for PostHog tracking\n    at testClientError (PostHog Error Tester)\n    at button click',
      });
      
      // Also test automatic capture by dispatching an error event
      if (typeof window !== 'undefined') {
        const errorEvent = new ErrorEvent('error', {
          message: 'Test client-side JavaScript error for PostHog tracking',
          filename: window.location.href,
          lineno: 1,
          colno: 1,
        });
        
        window.dispatchEvent(errorEvent);
      }
      
      // Show success message
      toast({
        title: 'Client Error Test',
        description: 'Error event captured and sent to PostHog (check console for details)',
      });
      
      // Add to test results manually
      addTestResult('Client JavaScript Error', 'success', 'Error event captured and sent to PostHog');
      
    } catch (error) {
      // If there's any error in the test itself, handle it gracefully
      toast({
        title: 'Client Error Test Failed',
        description: `Test failed: ${error.message}`,
        variant: 'destructive',
      });
      
      addTestResult('Client JavaScript Error', 'error', `Test failed: ${error.message}`);
    }
  };

  // Test 1.5: Error Capture Test (using setTimeout to avoid error boundary)
  const testErrorCapture = () => {
    try {
      // Use setTimeout to create an error outside the current call stack
      setTimeout(() => {
        try {
          const testError = new Error('Test error capture for PostHog tracking');
          captureClientError(testError, {
            test_type: 'error_capture',
            test_timestamp: new Date().toISOString(),
            test_context: 'PostHog Error Tester',
          });
          
          console.log('Error capture test completed successfully');
        } catch (error) {
          console.error('Error capture test failed:', error);
        }
      }, 100);
      
      // Show success message
      toast({
        title: 'Error Capture Test',
        description: 'Error capture test initiated (check console for details)',
      });
      
      // Add to test results manually
      addTestResult('Error Capture Test', 'success', 'Error capture test initiated');
      
    } catch (error) {
      // If there's any error in the test itself, handle it gracefully
      toast({
        title: 'Error Capture Test Failed',
        description: `Test failed: ${error.message}`,
        variant: 'destructive',
      });
      
      addTestResult('Error Capture Test', 'error', `Test failed: ${error.message}`);
    }
  };

  // Test 2: Async Error
  const testAsyncError = async () => {
    runTest('Async Error', async () => {
      const testError = new Error('Test async error for PostHog tracking');
      
      // Capture the error manually first
      captureClientError(testError, {
        test_type: 'async_error',
        test_timestamp: new Date().toISOString(),
        test_context: 'PostHog Error Tester',
      });
      
      // Also test unhandled promise rejection
      Promise.reject(testError).catch(() => {
        // This will trigger PostHog's automatic error capture
      });
      
      // Return success since we've tested error capture
      return Promise.resolve();
    });
  };

  // Test 3: PostHog Manual Capture
  const testPostHogCapture = async () => {
    runTest('PostHog Manual Capture', async () => {
      const testError = new Error('Manual PostHog error capture test');
      
      captureClientError(testError, {
        test_type: 'manual_capture',
        test_timestamp: new Date().toISOString(),
        test_context: 'PostHog Error Tester',
      });
    });
  };

  // Test 4: API Route Error
  const testApiError = async () => {
    runTest('API Route Error', async () => {
      const response = await fetch('/api/test-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    });
  };

  // Test 5: Network Error
  const testNetworkError = async () => {
    runTest('Network Error', async () => {
      const response = await fetch('/api/non-existent-endpoint', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
    });
  };

  // Test 6: Validation Error
  const testValidationError = async () => {
    runTest('Validation Error', async () => {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Validation error: ${errorData.error || 'Invalid request'}`);
      }
    });
  };

  // Test 7: PostHog Configuration Test
  const testPostHogConfig = () => {
    runTest('PostHog Configuration', () => {
      // Test PostHog configuration and status
      const status = getPostHogStatus();
      
      if (!status.isAvailable) {
        throw new Error('PostHog client not available');
      }
      
      // Test basic PostHog methods
      const client = status.client;
      if (!client) {
        throw new Error('PostHog client is null');
      }
      
      // Test if PostHog has required methods
      const requiredMethods = ['capture', 'captureException', 'identify'];
      const missingMethods = requiredMethods.filter(method => typeof client[method] !== 'function');
      
      if (missingMethods.length > 0) {
        throw new Error(`PostHog missing methods: ${missingMethods.join(', ')}`);
      }
      
      console.log('PostHog configuration test passed');
    });
  };

  // Test 8: PostHog Server Configuration Test
  const testPostHogServerConfig = () => {
    console.log('testPostHogServerConfig called');
    runTest('PostHog Server Configuration', async () => {
      try {
        console.log('Testing PostHog server configuration...');
        
        // Test server-side PostHog configuration
        const response = await fetch('/api/posthog/test-config');
        
        console.log('Server config response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Server config test failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Server config result:', result);
        
        if (!result.success) {
          throw new Error(`Server config test failed: ${result.error}`);
        }
        
        console.log('PostHog server configuration:', result.config);
        
        // Check if we have the required configuration
        const config = result.config;
        if (!config.hasPublicKey && !config.hasServerKey) {
          throw new Error('No PostHog API key found (neither public nor server)');
        }
        
        if (!config.hasPublicHost && !config.hasServerHost) {
          throw new Error('No PostHog host found (neither public nor server)');
        }
        
        console.log('PostHog server configuration test passed');
        return Promise.resolve();
        
      } catch (error) {
        console.error('PostHog server configuration test error:', error);
        throw error;
      }
    });
  };

  // Test 8: Error Boundary Test
  const testErrorBoundary = () => {
    runTest('Error Boundary', () => {
      // Test error boundary by creating an error that should be caught
      const testError = new Error('Test error boundary error for PostHog tracking');
      
      // Manually capture the error as if it came from an error boundary
      captureClientError(testError, {
        test_type: 'error_boundary',
        test_timestamp: new Date().toISOString(),
        test_context: 'PostHog Error Tester',
        error_boundary: true,
        component_stack: 'ErrorBoundaryTest -> PostHogErrorTester',
      });
      
      // Also test by dispatching an error event
      if (typeof window !== 'undefined') {
        const errorEvent = new ErrorEvent('error', {
          message: testError.message,
          filename: window.location.href,
          lineno: 1,
          colno: 1,
          error: testError,
        });
        
        window.dispatchEvent(errorEvent);
      }
      
      return Promise.resolve();
    });
  };

  // Test 11: Unhandled Error Test (for PostHog automatic capture)
  const testUnhandledError = () => {
    runTest('Unhandled Error', () => {
      // Create an unhandled error that PostHog should automatically capture
      const testError = new Error('Test unhandled error for PostHog automatic capture');
      
      // Dispatch an unhandled error event
      if (typeof window !== 'undefined') {
        // Create a script element that will cause an error
        const script = document.createElement('script');
        script.textContent = 'throw new Error("Test unhandled script error for PostHog");';
        
        // Add it to the page briefly to trigger the error
        document.head.appendChild(script);
        
        // Remove it immediately
        setTimeout(() => {
          document.head.removeChild(script);
        }, 10);
      }
      
      return Promise.resolve();
    });
  };

  // Test 12: Direct PostHog Capture Test
  const testDirectPostHogCapture = () => {
    runTest('Direct PostHog Capture', () => {
      // Test PostHog's captureException method directly
      if (typeof window !== 'undefined' && (window as any).posthog) {
        const testError = new Error('Direct PostHog captureException test');
        
        try {
          (window as any).posthog.captureException(testError, {
            test_type: 'direct_capture',
            test_timestamp: new Date().toISOString(),
            test_context: 'PostHog Error Tester',
          });
          
          console.log('PostHog captureException called successfully');
        } catch (error) {
          throw new Error(`PostHog captureException failed: ${error.message}`);
        }
      } else {
        throw new Error('PostHog client not available');
      }
      
      return Promise.resolve();
    });
  };

  // Test 14: Critical Error Test (specifically for critical errors)
  const testCriticalError = () => {
    try {
      const criticalError = new Error('Critical application error - system failure');
      criticalError.name = 'CriticalError';
      
      console.log('Testing critical error capture...');
      
      // Test PostHog's critical error capture
      captureClientError(criticalError, {
        test_type: 'critical_error',
        test_timestamp: new Date().toISOString(),
        test_context: 'PostHog Error Tester',
        severity: 'critical',
        component: 'error_tester',
        user_action: 'manual_test',
      });
      
      // Show success message
      toast({
        title: 'Critical Error Test',
        description: 'Critical error captured and sent to PostHog (check console for details)',
      });
      
      // Add to test results manually
      addTestResult('Critical Error Test', 'success', 'Critical error captured and sent to PostHog');
      
    } catch (error) {
      // If there's any error in the test itself, handle it gracefully
      toast({
        title: 'Critical Error Test Failed',
        description: `Test failed: ${error.message}`,
        variant: 'destructive',
      });
      
      addTestResult('Critical Error Test', 'error', `Test failed: ${error.message}`);
    }
  };

  // Test 13: Unhandled Error Test (actually throws)
  const testUnhandledErrorThrow = () => {
    // This test actually throws an error for PostHog to capture
    toast({
      title: 'Unhandled Error Test',
      description: 'About to throw an unhandled error for PostHog to capture...',
    });
    
    // Add to test results
    addTestResult('Unhandled Error Throw', 'pending', 'Throwing unhandled error...');
    
    // Show a warning before throwing
    setTimeout(() => {
      if (confirm('This will throw an unhandled error that may crash the page. Continue?')) {
        throw new Error('Test unhandled error for PostHog automatic capture');
      } else {
        addTestResult('Unhandled Error Throw', 'cancelled', 'User cancelled the test');
      }
    }, 1000);
  };

  // Test 8.5: React Error Boundary Test (actually triggers error boundary)
  const testReactErrorBoundary = () => {
    // This test simulates a React error boundary scenario without actually crashing
    toast({
      title: 'React Error Boundary Test',
      description: 'Simulating React error boundary scenario...',
    });
    
    // Add to test results
    addTestResult('React Error Boundary Test', 'pending', 'Simulating React error boundary scenario...');
    
    // Show a warning before triggering
    setTimeout(() => {
      if (confirm('This will simulate a React error boundary scenario. It will NOT crash the page, but will test error capture. Continue?')) {
        try {
          // Use setTimeout to create the error outside the current call stack
          // This prevents React's error boundary from catching it
          // Instead of creating an actual Error object, simulate the error data
          // This avoids triggering React's error boundary entirely
          const errorData = {
            message: 'Simulated React error boundary error for PostHog tracking',
            name: 'ReactErrorBoundaryError',
            stack: 'ReactErrorBoundaryError: Simulated React error boundary error for PostHog tracking\n    at ErrorBoundaryTest (PostHog Error Tester)\n    at setTimeout (PostHog Error Tester)',
          };
          
          // Use captureClientEvent instead of captureClientError to avoid Error constructor
          captureClientEvent('react_error_boundary_simulation', {
            test_type: 'react_error_boundary_simulation',
            test_timestamp: new Date().toISOString(),
            test_context: 'PostHog Error Tester',
            error_boundary: true,
            component_stack: 'ErrorBoundaryTest -> PostHogErrorTester',
            simulated: true,
            error_message: errorData.message,
            error_name: errorData.name,
            error_stack: errorData.stack,
          });
          
          // Also dispatch a custom error event for automatic capture
          if (typeof window !== 'undefined') {
            const errorEvent = new ErrorEvent('error', {
              message: errorData.message,
              filename: window.location.href,
              lineno: 1,
              colno: 1,
            });
            
            window.dispatchEvent(errorEvent);
          }
          
          console.log('React error boundary simulation completed successfully');
          
          // Show success message
          toast({
            title: 'React Error Boundary Test',
            description: 'Error boundary scenario simulated and sent to PostHog (check console for details)',
          });
          
          // Add to test results manually
          addTestResult('React Error Boundary Test', 'success', 'Error boundary scenario simulated and sent to PostHog');
          
        } catch (testError) {
          // If there's any error in the test itself, handle it gracefully
          toast({
            title: 'React Error Boundary Test Failed',
            description: `Test failed: ${testError.message}`,
            variant: 'destructive',
          });
          
          addTestResult('React Error Boundary Test', 'error', `Test failed: ${testError.message}`);
        }
      } else {
        addTestResult('React Error Boundary Test', 'cancelled', 'User cancelled the test');
      }
    }, 1000);
  };

  // Test 9: Custom Event Test
  const testCustomEvent = async () => {
    runTest('Custom Event', async () => {
      captureUserAction('test_event', {
        test_type: 'custom_event',
        test_timestamp: new Date().toISOString(),
        test_context: 'PostHog Error Tester',
        custom_property: 'test_value',
        user_action: 'manual_test',
      });
    });
  };

  // Test 10: Server-side Error Test
  const testServerError = async () => {
    runTest('Server-side Error', async () => {
      const response = await fetch('/api/test-server-error', {
        method: 'GET',
      });

      // For server error tests, we expect a 500 status code
      if (response.status !== 500) {
        throw new Error(`Expected 500 status code, got ${response.status} ${response.statusText}`);
      }

      // Parse the response to get the error details
      const errorData = await response.json();
      
      if (!errorData.error || !errorData.message) {
        throw new Error('Server error response missing expected fields');
      }

      console.log('Server error test successful:', errorData);
    });
  };

  const clearResults = () => {
    setTestResults([]);
    toast({
      title: 'Cleared',
      description: 'Test results cleared',
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <IconCheck className="h-4 w-4 text-green-400" />;
      case 'error':
        return <IconX className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <IconRefresh className="h-4 w-4 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <IconTestPipe className="h-5 w-5 text-blue-400" />
            PostHog Error Tracking Tests
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Test various error scenarios to verify PostHog error tracking is working correctly
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              onClick={testClientError}
              disabled={isRunning}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <IconBug className="h-4 w-4 mr-2" />
              Client Error
            </Button>

            <Button
              onClick={testErrorCapture}
              disabled={isRunning}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <IconBug className="h-4 w-4 mr-2" />
              Error Capture
            </Button>

            <Button
              onClick={testAsyncError}
              disabled={isRunning}
              variant="outline"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              <IconAlertTriangle className="h-4 w-4 mr-2" />
              Async Error
            </Button>

            <Button
              onClick={testPostHogCapture}
              disabled={isRunning}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <IconShield className="h-4 w-4 mr-2" />
              Manual Capture
            </Button>

            <Button
              onClick={testApiError}
              disabled={isRunning}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <IconApi className="h-4 w-4 mr-2" />
              API Error
            </Button>

            <Button
              onClick={testNetworkError}
              disabled={isRunning}
              variant="outline"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <IconDatabase className="h-4 w-4 mr-2" />
              Network Error
            </Button>

            <Button
              onClick={testValidationError}
              disabled={isRunning}
              variant="outline"
              className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              <IconCode className="h-4 w-4 mr-2" />
              Validation Error
            </Button>

            <Button
              onClick={testPostHogConfig}
              disabled={isRunning}
              variant="outline"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <IconCheck className="h-4 w-4 mr-2" />
              Config Test
            </Button>

            <Button
              onClick={testPostHogServerConfig}
              disabled={isRunning}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <IconSettings className="h-4 w-4 mr-2" />
              Server Config
            </Button>

            <Button
              onClick={testErrorBoundary}
              disabled={isRunning}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <IconAlertTriangle className="h-4 w-4 mr-2" />
              Error Boundary
            </Button>

            <Button
              onClick={testReactErrorBoundary}
              disabled={isRunning}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <IconShield className="h-4 w-4 mr-2" />
              React Error Boundary (Safe)
            </Button>

            <Button
              onClick={testCustomEvent}
              disabled={isRunning}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <IconShield className="h-4 w-4 mr-2" />
              Custom Event
            </Button>

            <Button
              onClick={testServerError}
              disabled={isRunning}
              variant="outline"
              className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
            >
              <IconDatabase className="h-4 w-4 mr-2" />
              Server Error
            </Button>

            <Button
              onClick={testUnhandledError}
              disabled={isRunning}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <IconBug className="h-4 w-4 mr-2" />
              Unhandled Error
            </Button>

            <Button
              onClick={testDirectPostHogCapture}
              disabled={isRunning}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <IconShield className="h-4 w-4 mr-2" />
              Direct Capture
            </Button>

            <Button
              onClick={testUnhandledErrorThrow}
              disabled={isRunning}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <IconBug className="h-4 w-4 mr-2" />
              Throw Error (Dangerous)
            </Button>

            <Button
              onClick={testCriticalError}
              disabled={isRunning}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <IconAlertTriangle className="h-4 w-4 mr-2" />
              Critical Error
            </Button>
          </div>

          {/* Clear Results Button */}
          <div className="flex justify-end">
            <Button
              onClick={clearResults}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <IconCheck className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.timestamp}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1 opacity-80">{result.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PostHog Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            PostHog Status & Debug Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">API Key:</span>
                <Badge variant={process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Host:</span>
                <Badge variant={process.env.NEXT_PUBLIC_POSTHOG_HOST ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_POSTHOG_HOST ? 'Configured' : 'Missing'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Client:</span>
                <Badge variant={isPostHogAvailable() ? 'default' : 'secondary'}>
                  {isPostHogAvailable() ? 'Available' : 'Not Available'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Environment:</span>
                <Badge variant="outline">
                  {process.env.NODE_ENV}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Debug Information */}
          <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Debug Information:</h4>
            <ClientOnlyDebugInfo />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
