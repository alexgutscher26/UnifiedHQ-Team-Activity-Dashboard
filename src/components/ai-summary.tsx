'use client';

import { useState, useEffect } from 'react';
import { AISummaryData } from '@/types/components';
import { IconSparkles } from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading';
import {
  useMemoryLeakPrevention,
  useSafeTimer,
} from '@/lib/memory-leak-prevention';

export function AISummary() {
  const [summary, setSummary] = useState<AISummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memory leak prevention
  useMemoryLeakPrevention('AISummary');
  const { setTimeout, clearTimeout } = useSafeTimer();

  // Simulate AI summary generation
  const generateSummary = async () => {
    try {
      // Simulate API call delay - reduced for faster loading
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 50);
      });

      // Mock summary data
      setSummary({
        highlights: [
          'Engineering team merged 7 pull requests, with authentication flow now complete',
          'Product roadmap updated with 3 new features prioritized for Q1',
          'Design team shared new mockups in Slack, awaiting feedback from stakeholders',
          '156 messages across 8 Slack channels, highest activity in #engineering',
        ],
        actionItems: [
          '2 pull requests awaiting review from senior engineers',
          'Sprint planning notes need capacity estimates from 3 team members',
        ],
        generatedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateSummary();
  }, []);

  return (
    <Card className='bg-gradient-to-br from-primary/5 via-card to-card'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <IconSparkles className='size-5' />
            <CardTitle>AI Daily Summary</CardTitle>
          </div>
          <Badge variant='secondary'>Today</Badge>
        </div>
        <CardDescription>
          Intelligent insights from your team&apos;s activity
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading ? (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <LoadingSkeleton className='h-4 w-24' />
              <div className='space-y-2'>
                <LoadingSkeleton className='h-3 w-full' />
                <LoadingSkeleton className='h-3 w-5/6' />
                <LoadingSkeleton className='h-3 w-4/6' />
                <LoadingSkeleton className='h-3 w-3/4' />
              </div>
            </div>
            <div className='space-y-2'>
              <LoadingSkeleton className='h-4 w-20' />
              <div className='space-y-2'>
                <LoadingSkeleton className='h-3 w-full' />
                <LoadingSkeleton className='h-3 w-4/5' />
              </div>
            </div>
          </div>
        ) : (
          summary && (
            <>
              <div className='space-y-2'>
                <h4 className='font-semibold text-sm'>Key Highlights</h4>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  {summary.highlights.map(
                    (highlight: string, index: number) => (
                      <li key={index} className='flex items-start gap-2'>
                        <span className='mt-1 size-1.5 rounded-full bg-primary flex-shrink-0' />
                        <span>{highlight}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className='space-y-2'>
                <h4 className='font-semibold text-sm'>Action Items</h4>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  {summary.actionItems.map((item: string, index: number) => (
                    <li key={index} className='flex items-start gap-2'>
                      <span className='mt-1 size-1.5 rounded-full bg-orange-500 flex-shrink-0' />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='pt-2 border-t'>
                <p className='text-xs text-muted-foreground'>
                  Summary generated at {summary.generatedAt} • Updates every 30
                  minutes
                </p>
              </div>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
