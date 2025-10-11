import { OpenRouterTest } from '@/components/openrouter-test';

export default function OpenRouterDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">OpenRouter + PostHog Integration</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Test OpenRouter LLM integration with PostHog analytics tracking. 
            All requests are automatically captured and analyzed in PostHog.
          </p>
        </div>
        <OpenRouterTest />
      </div>
    </div>
  );
}
