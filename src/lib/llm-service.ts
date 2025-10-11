/**
 * LLM Service with PostHog Analytics Integration
 * 
 * This service provides a clean interface for using OpenRouter with PostHog analytics
 * following the PostHog LLM analytics documentation.
 * 
 * Note: This is a server-side service. For client-side usage, use client-llm-service.ts
 */

import { generateWithPostHogAnalytics } from '@/lib/posthog-openrouter';

export interface LLMRequest {
  prompt: string;
  model?: string;
  distinctId?: string;
  traceId?: string;
  properties?: Record<string, any>;
  groups?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finishReason?: string;
}

export class LLMService {
  private defaultModel: string;
  private defaultDistinctId: string;

  constructor(defaultModel: string = 'gpt-3.5-turbo', defaultDistinctId: string = 'anonymous') {
    this.defaultModel = defaultModel;
    this.defaultDistinctId = defaultDistinctId;
  }

  /**
   * Generate text using OpenRouter with PostHog analytics
   * Server-side only - use client-llm-service.ts for client-side
   */
  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const {
      prompt,
      model = this.defaultModel,
      distinctId = this.defaultDistinctId,
      traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      properties = {},
      groups = {},
      temperature = 0.7,
      maxTokens = 1000,
      stream = false,
    } = request;

    try {
      const response = await generateWithPostHogAnalytics(
        model,
        [{ role: 'user', content: prompt }],
        {
          distinctId,
          traceId,
          properties: {
            service: 'llm-service',
            timestamp: new Date().toISOString(),
            ...properties,
          },
          groups,
          temperature,
          maxTokens,
          stream,
        }
      );

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
      };
    } catch (error) {
      console.error('LLM Service error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate text with conversation context
   */
  async generateWithContext(
    messages: Array<{ role: string; content: string }>,
    options: Omit<LLMRequest, 'prompt'> = {}
  ): Promise<LLMResponse> {
    const {
      model = this.defaultModel,
      distinctId = this.defaultDistinctId,
      traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      properties = {},
      groups = {},
      temperature = 0.7,
      maxTokens = 1000,
      stream = false,
    } = options;

    try {
      const response = await generateWithPostHogAnalytics(
        model,
        messages,
        {
          distinctId,
          traceId,
          properties: {
            service: 'llm-service',
            context_type: 'conversation',
            message_count: messages.length,
            timestamp: new Date().toISOString(),
            ...properties,
          },
          groups,
          temperature,
          maxTokens,
          stream,
        }
      );

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
      };
    } catch (error) {
      console.error('LLM Service error:', error);
      throw new Error(`Failed to generate with context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate text for a specific user with user context
   */
  async generateForUser(
    userId: string,
    prompt: string,
    options: Omit<LLMRequest, 'prompt' | 'distinctId'> = {}
  ): Promise<LLMResponse> {
    return this.generateText({
      ...options,
      prompt,
      distinctId: userId,
      properties: {
        user_id: userId,
        ...options.properties,
      },
    });
  }

  /**
   * Generate text for a specific company/team
   */
  async generateForTeam(
    teamId: string,
    prompt: string,
    options: Omit<LLMRequest, 'prompt' | 'groups'> = {}
  ): Promise<LLMResponse> {
    return this.generateText({
      ...options,
      prompt,
      groups: {
        team: teamId,
        ...options.groups,
      },
    });
  }
}

// Default instance - server-side only
export const llmService = new LLMService();

// Convenience functions - server-side only
export async function generateText(prompt: string, options: Partial<LLMRequest> = {}) {
  return llmService.generateText({ prompt, ...options });
}

export async function generateForUser(userId: string, prompt: string, options: Partial<LLMRequest> = {}) {
  return llmService.generateForUser(userId, prompt, options);
}

export async function generateForTeam(teamId: string, prompt: string, options: Partial<LLMRequest> = {}) {
  return llmService.generateForTeam(teamId, prompt, options);
}
