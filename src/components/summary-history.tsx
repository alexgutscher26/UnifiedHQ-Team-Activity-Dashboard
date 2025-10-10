'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  IconHistory,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconTrendingUp,
  IconClock,
  IconCircleCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

interface SummaryHistoryItem {
  id: string;
  title: string;
  keyHighlights: string[];
  actionItems: string[];
  insights: string[];
  generatedAt: string;
  timeRange: {
    start: string;
    end: string;
  };
  metadata: {
    activityCount: number;
    sourceBreakdown: Record<string, number>;
    model: string;
    tokensUsed: number;
  };
}

interface SummaryHistoryProps {
  className?: string;
  onSummarySelect?: (summary: SummaryHistoryItem) => void;
}

export function SummaryHistory({ className, onSummarySelect }: SummaryHistoryProps) {
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<SummaryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, timeRange]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/ai-summary/history?page=${pagination.page}&limit=${pagination.limit}&timeRange=${timeRange}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch summary history`);
      }

      const data = await response.json();
      setSummaries(data.summaries || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } catch (error) {
      console.error('Error fetching summary history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load history';
      setError(errorMessage);
      
      // Don't show toast for authentication errors
      if (!errorMessage.includes('401') && !errorMessage.includes('Unauthorized')) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSummaryClick = (summary: SummaryHistoryItem) => {
    if (onSummarySelect) {
      onSummarySelect(summary);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <IconHistory className='size-5 text-white' />
              <h3 className='text-lg font-semibold text-white'>
                Summary History
              </h3>
            </div>
            <Skeleton className='h-6 w-20' />
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {[1, 2, 3].map(i => (
            <div key={i} className='p-4 border border-slate-700 rounded-lg'>
              <div className='flex items-center justify-between mb-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-20' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-3/4' />
              </div>
              <div className='flex gap-2 mt-3'>
                <Skeleton className='h-5 w-16' />
                <Skeleton className='h-5 w-12' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <IconHistory className='size-5 text-white' />
            <h3 className='text-lg font-semibold text-white'>
              Summary History
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <IconAlertCircle className='size-12 text-red-500 mx-auto mb-4' />
            <h4 className='text-lg font-medium text-white mb-2'>
              Failed to Load History
            </h4>
            <p className='text-gray-400 mb-4'>
              {error.includes('401') || error.includes('Unauthorized') 
                ? 'Please log in to view your summary history' 
                : error}
            </p>
            <Button onClick={fetchHistory} variant='outline'>
              <IconClock className='size-4 mr-2' />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <IconHistory className='size-5 text-white' />
            <h3 className='text-lg font-semibold text-white'>
              Summary History
            </h3>
          </div>
          <div className='flex items-center gap-2'>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className='bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-600'
            >
              <option value='7d'>Last 7 days</option>
              <option value='30d'>Last 30 days</option>
              <option value='90d'>Last 90 days</option>
            </select>
          </div>
        </div>
        <p className='text-sm text-gray-400'>
          {pagination.totalCount} summaries found
        </p>
      </CardHeader>

      <CardContent className='space-y-4'>
        {summaries.length === 0 ? (
          <div className='text-center py-8'>
            <IconCalendar className='size-12 text-gray-500 mx-auto mb-4' />
            <h4 className='text-lg font-medium text-white mb-2'>
              No History Found
            </h4>
            <p className='text-gray-400'>
              No summaries found for the selected time range.
            </p>
          </div>
        ) : (
          <>
            {summaries.map((summary) => (
              <div
                key={summary.id}
                onClick={() => handleSummaryClick(summary)}
                className='p-4 border border-slate-700 rounded-lg hover:border-slate-600 cursor-pointer transition-colors'
              >
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='text-white font-medium text-sm'>
                    {summary.title}
                  </h4>
                  <span className='text-xs text-gray-400'>
                    {formatDate(summary.generatedAt)}
                  </span>
                </div>
                
                <div className='space-y-2 mb-3'>
                  <div className='flex items-center gap-2 text-xs text-gray-400'>
                    <IconCircleCheck className='size-3' />
                    <span>{summary.keyHighlights.length} highlights</span>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-gray-400'>
                    <IconAlertCircle className='size-3' />
                    <span>{summary.actionItems.length} action items</span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex gap-2'>
                    <Badge variant='secondary' className='text-xs'>
                      {summary.metadata.activityCount} activities
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      {summary.metadata.model.split('/')[1]}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-1 text-xs text-gray-500'>
                    <IconTrendingUp className='size-3' />
                    <span>{summary.metadata.tokensUsed} tokens</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex items-center justify-between pt-4 border-t border-slate-700'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className='text-gray-400 border-gray-600 hover:text-white hover:border-gray-500'
                >
                  <IconChevronLeft className='size-4 mr-1' />
                  Previous
                </Button>
                
                <span className='text-sm text-gray-400'>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className='text-gray-400 border-gray-600 hover:text-white hover:border-gray-500'
                >
                  Next
                  <IconChevronRight className='size-4 ml-1' />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
