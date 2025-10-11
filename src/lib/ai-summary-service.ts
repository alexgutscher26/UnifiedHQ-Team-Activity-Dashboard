/**
 * AI Summary Service using OpenRouter with PostHog Analytics
 * Provides intelligent summarization of team activity data with analytics tracking
 */

import { generateWithPostHogAnalytics } from '@/lib/posthog-openrouter';
import { Activity } from '@/types/components';

export interface AISummaryData {
  activities: Activity[];
  timeRange: {
    start: Date;
    end: Date;
  };
  teamContext?: {
    repositories: string[];
    channels: string[];
    teamSize: number;
  };
}

export interface AISummary {
  id: string;
  userId: string;
  title: string;
  keyHighlights: string[];
  actionItems: string[];
  insights: string[];
  generatedAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  metadata: {
    activityCount: number;
    sourceBreakdown: Record<string, number>;
    model: string;
    tokensUsed: number;
    traceId?: string;
    posthogTracked?: boolean;
  };
}

export class AISummaryService {
  private static readonly DEFAULT_MODEL = 'openai/gpt-4o-mini';
  private static readonly MAX_TOKENS = 2000;
  private static readonly TEMPERATURE = 0.7;

  /**
   * Generate AI summary from team activity data with PostHog analytics
   */
  static async generateSummary(
    userId: string,
    data: AISummaryData
  ): Promise<AISummary> {
    try {
      const prompt = this.buildPrompt(data);
      const traceId = `ai_summary_${userId}_${Date.now()}`;

      // Use PostHog-enabled OpenRouter client for analytics tracking
      const response = await generateWithPostHogAnalytics(
        this.DEFAULT_MODEL,
        [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          distinctId: userId,
          traceId: traceId,
          properties: {
            service: 'ai-summary-service',
            activity_count: data.activities.length,
            time_range_start: data.timeRange.start.toISOString(),
            time_range_end: data.timeRange.end.toISOString(),
            team_context: data.teamContext
              ? {
                  repositories: data.teamContext.repositories.length,
                  channels: data.teamContext.channels.length,
                  team_size: data.teamContext.teamSize,
                }
              : null,
            source_breakdown: this.getSourceBreakdown(data.activities),
            summary_type: 'daily_summary',
          },
          groups: data.teamContext
            ? {
                repositories: data.teamContext.repositories.join(','),
                channels: data.teamContext.channels.join(','),
              }
            : undefined,
          temperature: this.TEMPERATURE,
          maxTokens: this.MAX_TOKENS,
        }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from AI model');
      }

      const parsedSummary = this.parseSummaryResponse(content);

      return {
        id: `summary_${userId}_${Date.now()}`,
        userId,
        title: parsedSummary.title || 'Daily Team Summary',
        keyHighlights: parsedSummary.keyHighlights || [],
        actionItems: parsedSummary.actionItems || [],
        insights: parsedSummary.insights || [],
        generatedAt: new Date(),
        timeRange: data.timeRange,
        metadata: {
          activityCount: data.activities.length,
          sourceBreakdown: this.getSourceBreakdown(data.activities),
          model: this.DEFAULT_MODEL,
          tokensUsed: response.usage?.total_tokens || 0,
          traceId: traceId,
          posthogTracked: true,
        },
      };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new Error('Failed to generate AI summary');
    }
  }

  /**
   * Build the prompt for AI summarization
   */
  private static buildPrompt(data: AISummaryData): string {
    const activitiesText = data.activities
      .map(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString();
        const source = activity.source.toUpperCase();
        const title = activity.title;
        const description = activity.description
          ? ` - ${activity.description}`
          : '';

        return `[${timestamp}] ${source}: ${title}${description}`;
      })
      .join('\n');

    const teamContext = data.teamContext
      ? `
Team Context:
- Repositories: ${data.teamContext.repositories.join(', ')}
- Channels: ${data.teamContext.channels.join(', ')}
- Team Size: ${data.teamContext.teamSize} members
`
      : '';

    return `
Please analyze the following team activity data and provide a comprehensive summary.

${teamContext}

Activity Data (${data.activities.length} activities from ${data.timeRange.start.toLocaleDateString()} to ${data.timeRange.end.toLocaleDateString()}):

${activitiesText}

Please provide a structured summary with:
1. Key Highlights (4-5 most important accomplishments or events)
2. Action Items (2-3 tasks that need attention or follow-up)
3. Additional Insights (any patterns, trends, or notable observations)

Format your response as JSON with the following structure:
{
  "title": "Brief summary title",
  "keyHighlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"],
  "actionItems": ["action 1", "action 2", "action 3"],
  "insights": ["insight 1", "insight 2"]
}
`;
  }

  /**
   * Get system prompt for AI model
   */
  private static getSystemPrompt(): string {
    return `You are an AI assistant specialized in analyzing team activity data from GitHub and Slack. Your role is to provide intelligent, actionable summaries that help teams understand their productivity patterns and identify important events.

Key guidelines:
- Focus on actionable insights and important events
- Identify patterns and trends in team activity
- Highlight accomplishments and achievements
- Flag items that need attention or follow-up
- Keep summaries concise but comprehensive
- Use professional, clear language
- Prioritize the most impactful activities

Always respond with valid JSON format as requested.`;
  }

  /**
   * Parse the AI response into structured data
   */
  private static parseSummaryResponse(content: string): {
    title: string;
    keyHighlights: string[];
    actionItems: string[];
    insights: string[];
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || 'Team Activity Summary',
          keyHighlights: Array.isArray(parsed.keyHighlights)
            ? parsed.keyHighlights
            : [],
          actionItems: Array.isArray(parsed.actionItems)
            ? parsed.actionItems
            : [],
          insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        };
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON:', error);
    }

    // Fallback: parse text-based response
    return this.parseTextResponse(content);
  }

  /**
   * Parse text-based response as fallback
   */
  private static parseTextResponse(content: string): {
    title: string;
    keyHighlights: string[];
    actionItems: string[];
    insights: string[];
  } {
    const lines = content.split('\n').filter(line => line.trim());

    const keyHighlights: string[] = [];
    const actionItems: string[] = [];
    const insights: string[] = [];

    let currentSection = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (
        lowerLine.includes('key highlights') ||
        lowerLine.includes('highlights')
      ) {
        currentSection = 'highlights';
        continue;
      } else if (
        lowerLine.includes('action items') ||
        lowerLine.includes('actions')
      ) {
        currentSection = 'actions';
        continue;
      } else if (
        lowerLine.includes('insights') ||
        lowerLine.includes('observations')
      ) {
        currentSection = 'insights';
        continue;
      }

      if (
        line.startsWith('-') ||
        line.startsWith('•') ||
        line.match(/^\d+\./)
      ) {
        const item = line.replace(/^[-•\d.\s]+/, '').trim();
        if (item) {
          switch (currentSection) {
            case 'highlights':
              keyHighlights.push(item);
              break;
            case 'actions':
              actionItems.push(item);
              break;
            case 'insights':
              insights.push(item);
              break;
          }
        }
      }
    }

    return {
      title: 'Team Activity Summary',
      keyHighlights: keyHighlights.slice(0, 5),
      actionItems: actionItems.slice(0, 3),
      insights: insights.slice(0, 3),
    };
  }

  /**
   * Get source breakdown statistics
   */
  private static getSourceBreakdown(
    activities: Activity[]
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const activity of activities) {
      breakdown[activity.source] = (breakdown[activity.source] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Validate API key and connection with PostHog analytics
   */
  static async validateConnection(): Promise<boolean> {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return false;
      }

      const response = await generateWithPostHogAnalytics(
        this.DEFAULT_MODEL,
        [{ role: 'user', content: 'Hello' }],
        {
          distinctId: 'system',
          traceId: `validation_${Date.now()}`,
          properties: {
            service: 'ai-summary-service',
            operation: 'connection_validation',
          },
          maxTokens: 10,
        }
      );

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenRouter connection validation failed:', error);
      return false;
    }
  }

  /**
   * Get available models (for future use)
   */
  static async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [this.DEFAULT_MODEL];
    }
  }
}
