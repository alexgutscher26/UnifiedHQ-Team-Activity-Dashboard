import { NextRequest, NextResponse } from 'next/server';
import { generateWithPostHogAnalytics } from '@/lib/posthog-openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = 'gpt-3.5-turbo',
      distinctId,
      traceId,
      properties = {},
      groups = {},
      temperature = 0.7,
      maxTokens = 1000,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate response using OpenRouter with PostHog analytics
    const response = await generateWithPostHogAnalytics(
      model,
      [{ role: 'user', content: prompt }],
      {
        distinctId: distinctId || 'api-user',
        traceId: traceId || `trace_${Date.now()}`,
        properties: {
          source: 'api',
          endpoint: '/api/openrouter',
          ...properties,
        },
        groups,
        temperature,
        maxTokens,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
      },
    });
  } catch (error) {
    console.error('OpenRouter API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'OpenRouter API endpoint',
    usage:
      'POST with { prompt, model?, distinctId?, traceId?, properties?, groups?, temperature?, maxTokens? }',
    example: {
      prompt: 'Tell me a fun fact about hedgehogs',
      model: 'gpt-3.5-turbo',
      distinctId: 'user_123',
      traceId: 'trace_123',
      properties: { conversation_id: 'abc123' },
      groups: { company: 'company_id' },
    },
  });
}
