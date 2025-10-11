// Client-side LLM service that uses API endpoints
// This avoids importing posthog-node in client-side code

export interface LLMRequest {
  prompt: string;
  model?: string;
  distinctId?: string;
  traceId?: string;
  properties?: Record<string, any>;
  groups?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
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

export class ClientLLMService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/openrouter') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Generate text using OpenRouter via API endpoint
   * This will automatically track analytics on the server-side
   */
  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const {
      prompt,
      model = 'gpt-3.5-turbo',
      distinctId = 'client-user',
      traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      properties = {},
      groups = {},
      temperature = 0.7,
      maxTokens = 1000,
    } = request;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          distinctId,
          traceId,
          properties: {
            source: 'client',
            timestamp: new Date().toISOString(),
            ...properties,
          },
          groups,
          temperature,
          maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Client LLM Service error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate text for a specific user
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
   * Generate text for a specific team
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

// Default client instance
export const clientLLMService = new ClientLLMService();

// Convenience functions
export async function generateTextClient(prompt: string, options: Partial<LLMRequest> = {}) {
  return clientLLMService.generateText({ prompt, ...options });
}

export async function generateForUserClient(userId: string, prompt: string, options: Partial<LLMRequest> = {}) {
  return clientLLMService.generateForUser(userId, prompt, options);
}

export async function generateForTeamClient(teamId: string, prompt: string, options: Partial<LLMRequest> = {}) {
  return clientLLMService.generateForTeam(teamId, prompt, options);
}
