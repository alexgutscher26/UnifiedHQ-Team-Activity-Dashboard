'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAccessibilityAudit,
  useAriaLiveAnnouncer,
  useScreenReaderSupport,
} from '@/hooks/use-accessibility';
import {
  IconEye,
  IconEyeOff,
  IconKeyboard,
  IconVolume,
  IconAlertTriangle,
  IconCheckCircle,
} from '@tabler/icons-react';

interface AccessibilityTestResult {
  component: string;
  issues: string[];
  score: number;
  recommendations: string[];
}

/**
 * AccessibilityTester component for auditing accessibility compliance in a React application.
 *
 * This component manages the state for test results, overall score, and running status. It utilizes hooks to perform accessibility audits on various components, generates recommendations based on identified issues, and displays the results in a user-friendly interface. The component also provides visual feedback on the overall accessibility score and the status of screen reader detection.
 *
 * @returns A JSX element representing the accessibility testing dashboard.
 */
export const AccessibilityTester: React.FC = () => {
  const [testResults, setTestResults] = useState<AccessibilityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const { auditComponent } = useAccessibilityAudit();
  const { announce } = useAriaLiveAnnouncer();
  const { isScreenReaderActive } = useScreenReaderSupport();

  /**
   * Runs an accessibility audit on predefined components and sets the results.
   */
  const testComponents = () => {
    setIsRunning(true);
    announce('Starting accessibility audit');

    const results: AccessibilityTestResult[] = [];

    // Test various components
    const components = [
      'main-content',
      'navigation',
      'forms',
      'buttons',
      'images',
      'modals',
      'tables',
    ];

    components.forEach(componentId => {
      const element = document.getElementById(componentId);
      if (element) {
        const issues = auditComponent(element);
        const score = Math.max(0, 100 - issues.length * 10);
        const recommendations = generateRecommendations(issues);

        results.push({
          component: componentId,
          issues,
          score,
          recommendations,
        });
      }
    });

    setTestResults(results);

    const averageScore =
      results.length > 0
        ? results.reduce((sum, result) => sum + result.score, 0) /
          results.length
        : 0;
    setOverallScore(averageScore);

    setIsRunning(false);
    announce(
      `Accessibility audit completed. Overall score: ${averageScore.toFixed(1)}%`
    );
  };

  /**
   * Generates a list of recommendations based on identified issues.
   *
   * The function iterates over an array of issues, checking for specific keywords related to accessibility.
   * For each keyword found, a corresponding recommendation is added to the recommendations array.
   * Finally, it returns a unique set of recommendations to avoid duplicates.
   *
   * @param {string[]} issues - An array of issues to analyze for generating recommendations.
   */
  const generateRecommendations = (issues: string[]): string[] => {
    const recommendations: string[] = [];

    issues.forEach(issue => {
      if (issue.includes('alt text')) {
        recommendations.push('Add descriptive alt text to all images');
      }
      if (issue.includes('label')) {
        recommendations.push('Ensure all form inputs have associated labels');
      }
      if (issue.includes('heading')) {
        recommendations.push('Use proper heading hierarchy (h1, h2, h3, etc.)');
      }
      if (issue.includes('accessible name')) {
        recommendations.push(
          'Provide accessible names for interactive elements'
        );
      }
    });

    return [...new Set(recommendations)];
  };

  /**
   * Determines the color class based on the given score.
   *
   * The function evaluates the score and returns a corresponding color class string.
   * If the score is 90 or above, it returns 'text-green-600'. If the score is between
   * 70 and 89, it returns 'text-yellow-600'. For scores below 70, it returns
   * 'text-red-600'.
   *
   * @param score - The numeric score to evaluate.
   */
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Determines the score badge based on the provided score.
   *
   * The function evaluates the score and returns an object containing a variant and text description.
   * If the score is 90 or above, it returns an 'Excellent' badge. For scores between 70 and 89, it returns a 'Good' badge.
   * Any score below 70 results in a 'Needs Work' badge.
   *
   * @param score - The numeric score used to determine the badge.
   */
  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, text: 'Excellent' };
    if (score >= 70) return { variant: 'secondary' as const, text: 'Good' };
    return { variant: 'destructive' as const, text: 'Needs Work' };
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconEye className='size-5' />
            Accessibility Testing Dashboard
          </CardTitle>
          <CardDescription>
            Test and monitor accessibility compliance across your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Overall Score */}
            <div className='text-center space-y-2'>
              <div className='text-4xl font-bold'>
                <span className={getScoreColor(overallScore)}>
                  {overallScore.toFixed(1)}%
                </span>
              </div>
              <Badge {...getScoreBadge(overallScore)}>
                {getScoreBadge(overallScore).text}
              </Badge>
              <Progress
                value={overallScore}
                className='w-full max-w-md mx-auto'
              />
            </div>

            {/* Screen Reader Status */}
            <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
              <IconVolume className='size-4' />
              Screen Reader:{' '}
              {isScreenReaderActive ? 'Detected' : 'Not Detected'}
            </div>

            {/* Test Button */}
            <div className='text-center'>
              <Button
                onClick={testComponents}
                disabled={isRunning}
                className='min-w-32'
              >
                {isRunning ? 'Testing...' : 'Run Accessibility Test'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Detailed accessibility audit results for each component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='overview' className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger value='issues'>Issues</TabsTrigger>
                <TabsTrigger value='recommendations'>
                  Recommendations
                </TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {testResults.map(result => (
                    <Card key={result.component}>
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between mb-2'>
                          <h3 className='font-medium capitalize'>
                            {result.component.replace('-', ' ')}
                          </h3>
                          <Badge {...getScoreBadge(result.score)}>
                            {result.score.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={result.score} className='mb-2' />
                        <div className='text-sm text-muted-foreground'>
                          {result.issues.length} issue
                          {result.issues.length !== 1 ? 's' : ''} found
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value='issues' className='space-y-4'>
                {testResults.map(result => (
                  <Card key={result.component}>
                    <CardHeader>
                      <CardTitle className='text-lg capitalize'>
                        {result.component.replace('-', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.issues.length > 0 ? (
                        <div className='space-y-2'>
                          {result.issues.map((issue, index) => (
                            <div
                              key={index}
                              className='flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md'
                            >
                              <IconAlertTriangle className='size-4 text-red-600 mt-0.5 flex-shrink-0' />
                              <span className='text-sm text-red-800'>
                                {issue}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md'>
                          <IconCheckCircle className='size-4 text-green-600' />
                          <span className='text-sm text-green-800'>
                            No accessibility issues found
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value='recommendations' className='space-y-4'>
                <div className='space-y-4'>
                  {testResults.map(result => (
                    <Card key={result.component}>
                      <CardHeader>
                        <CardTitle className='text-lg capitalize'>
                          {result.component.replace('-', ' ')} Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {result.recommendations.length > 0 ? (
                          <div className='space-y-2'>
                            {result.recommendations.map(
                              (recommendation, index) => (
                                <div
                                  key={index}
                                  className='flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md'
                                >
                                  <IconCheckCircle className='size-4 text-blue-600 mt-0.5 flex-shrink-0' />
                                  <span className='text-sm text-blue-800'>
                                    {recommendation}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className='text-sm text-muted-foreground'>
                            No specific recommendations for this component.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Accessibility Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Guidelines</CardTitle>
          <CardDescription>
            Key principles for creating accessible user interfaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <h4 className='font-medium text-green-800'>✅ Best Practices</h4>
              <ul className='space-y-2 text-sm'>
                <li className='flex items-start gap-2'>
                  <IconCheckCircle className='size-4 text-green-600 mt-0.5 flex-shrink-0' />
                  <span>Provide descriptive alt text for all images</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconCheckCircle className='size-4 text-green-600 mt-0.5 flex-shrink-0' />
                  <span>Use proper heading hierarchy (h1, h2, h3)</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconCheckCircle className='size-4 text-green-600 mt-0.5 flex-shrink-0' />
                  <span>Ensure sufficient color contrast (4.5:1 minimum)</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconCheckCircle className='size-4 text-green-600 mt-0.5 flex-shrink-0' />
                  <span>Make all interactive elements keyboard accessible</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconCheckCircle className='size-4 text-green-600 mt-0.5 flex-shrink-0' />
                  <span>Provide clear focus indicators</span>
                </li>
              </ul>
            </div>

            <div className='space-y-4'>
              <h4 className='font-medium text-red-800'>❌ Common Issues</h4>
              <ul className='space-y-2 text-sm'>
                <li className='flex items-start gap-2'>
                  <IconAlertTriangle className='size-4 text-red-600 mt-0.5 flex-shrink-0' />
                  <span>Missing or empty alt text on images</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconAlertTriangle className='size-4 text-red-600 mt-0.5 flex-shrink-0' />
                  <span>Form inputs without labels</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconAlertTriangle className='size-4 text-red-600 mt-0.5 flex-shrink-0' />
                  <span>Buttons without accessible names</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconAlertTriangle className='size-4 text-red-600 mt-0.5 flex-shrink-0' />
                  <span>Poor color contrast ratios</span>
                </li>
                <li className='flex items-start gap-2'>
                  <IconAlertTriangle className='size-4 text-red-600 mt-0.5 flex-shrink-0' />
                  <span>Missing ARIA labels and roles</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
