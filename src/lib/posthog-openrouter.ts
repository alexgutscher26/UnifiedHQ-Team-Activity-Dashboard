import { OpenAI } from 'openai';

// Server-side PostHog OpenAI wrapper for LLM analytics
// This should only be used in server-side code (API routes, server components)
export class PostHogOpenAI extends OpenAI {
  private posthogClient: any = null;

  constructor(config: {
    baseURL?: string;
    apiKey: string;
    posthogClient?: any;
  }) {
    super({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    });
    
    this.posthogClient = config.posthogClient || null;
  }

  async chatCompletionsCreate(params: any) {
    const startTime = Date.now();
    
    try {
      // Use the correct method to create chat completions
      const response = await this.chat.completions.create(params);
      const endTime = Date.now();
      const latency = (endTime - startTime) / 1000;

      // Capture LLM generation event with PostHog
      if (this.posthogClient) {
        try {
          await this.posthogClient.capture({
            distinctId: params.posthog_distinct_id || 'anonymous',
            event: '$ai_generation',
            properties: {
              $ai_model: params.model,
              $ai_latency: latency,
              $ai_input: params.messages,
              $ai_input_tokens: response.usage?.prompt_tokens || 0,
              $ai_output_choices: response.choices,
              $ai_output_tokens: response.usage?.completion_tokens || 0,
              $ai_total_cost_usd: this.calculateCost(params.model, response.usage),
              $ai_tools: params.tools || [],
              trace_id: params.posthog_trace_id,
              ...params.posthog_properties,
            },
            groups: params.posthog_groups,
          });
        } catch (posthogError) {
          console.error('Failed to capture LLM generation with PostHog:', posthogError);
        }
      }

      return response;
    } catch (error) {
      // Capture error with PostHog
      if (this.posthogClient) {
        try {
          await this.posthogClient.capture({
            distinctId: params.posthog_distinct_id || 'anonymous',
            event: '$ai_generation_error',
            properties: {
              $ai_model: params.model,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              trace_id: params.posthog_trace_id,
              ...params.posthog_properties,
            },
          });
        } catch (posthogError) {
          console.error('Failed to capture LLM error with PostHog:', posthogError);
        }
      }
      throw error;
    }
  }

  private calculateCost(model: string, usage: any): number {
    // Basic cost calculation - you may want to implement more accurate pricing
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    };

    const modelPricing = pricing[model] || { input: 0.001, output: 0.002 };
    const inputCost = (usage?.prompt_tokens || 0) * modelPricing.input / 1000;
    const outputCost = (usage?.completion_tokens || 0) * modelPricing.output / 1000;
    
    return inputCost + outputCost;
  }
}

// Server-side factory function - only use in API routes or server components
export async function createPostHogOpenRouterClient() {
  // Dynamically import PostHog Node.js SDK only on server-side
  const { PostHog } = await import('posthog-node');
  
  const posthogClient = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY!,
    {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      flushAt: 1,
      flushInterval: 0,
    }
  );

  return new PostHogOpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
    posthogClient,
  });
}

// Server-side convenience function
export async function generateWithPostHogAnalytics(
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    distinctId?: string;
    traceId?: string;
    properties?: Record<string, any>;
    groups?: Record<string, string>;
    privacyMode?: boolean;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
) {
  const client = await createPostHogOpenRouterClient();
  
  return client.chatCompletionsCreate({
    model,
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000,
    stream: options.stream || false,
    posthog_distinct_id: options.distinctId,
    posthog_trace_id: options.traceId,
    posthog_properties: options.properties,
    posthog_groups: options.groups,
    posthog_privacy_mode: options.privacyMode || false,
  });
}