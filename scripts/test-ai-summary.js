#!/usr/bin/env node

/**
 * AI Summary Feature Test Script
 * Tests the AI summary functionality with mock data
 */

import { AISummaryService } from '../src/lib/ai-summary-service.js';
import { Activity } from '../src/types/components.js';

console.log('🧪 AI Summary Feature Test');
console.log('==========================\n');

// Mock activity data for testing
const mockActivities: Activity[] = [
  {
    id: '1',
    source: 'github',
    title: 'Merged pull request #123: Add user authentication',
    description: 'Implemented OAuth integration with GitHub',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    externalId: 'pr-123',
    metadata: {
      eventType: 'pull_request',
      pullRequest: {
        number: 123,
        title: 'Add user authentication',
        state: 'merged',
        url: 'https://github.com/owner/repo/pull/123',
      },
    },
  },
  {
    id: '2',
    source: 'github',
    title: 'Pushed 3 commits to main branch',
    description: 'Fixed bug in login flow and added error handling',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    externalId: 'commit-abc123',
    metadata: {
      eventType: 'push',
      commit: {
        sha: 'abc123',
        message: 'Fix login bug and add error handling',
        url: 'https://github.com/owner/repo/commit/abc123',
      },
    },
  },
  {
    id: '3',
    source: 'slack',
    title: 'Posted message in #engineering',
    description: 'Discussed the new authentication flow implementation',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    externalId: 'msg-456',
    metadata: {
      eventType: 'message',
      channel: {
        id: 'C1234567890',
        name: 'engineering',
        type: 'public_channel',
      },
      payload: {
        message: {
          text: 'Great work on the auth flow! The OAuth integration looks solid.',
          ts: '1234567890.123456',
        },
      },
    },
  },
  {
    id: '4',
    source: 'github',
    title: 'Opened issue #124: Add dark mode support',
    description: 'Feature request for dark mode implementation',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    externalId: 'issue-124',
    metadata: {
      eventType: 'issue',
      issue: {
        number: 124,
        title: 'Add dark mode support',
        state: 'open',
        url: 'https://github.com/owner/repo/issues/124',
      },
    },
  },
  {
    id: '5',
    source: 'slack',
    title: 'Reacted to message in #general',
    description: 'Added 👍 reaction to deployment announcement',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    externalId: 'reaction-789',
    metadata: {
      eventType: 'message',
      channel: {
        id: 'C0987654321',
        name: 'general',
        type: 'public_channel',
      },
      payload: {
        message: {
          text: 'Deployment successful! 🚀',
          ts: '1234567890.123456',
          reactions: [
            {
              name: 'thumbsup',
              count: 5,
              users: ['U1234567890'],
            },
          ],
        },
      },
    },
  },
];

async function testAISummaryService() {
  try {
    console.log('1. Testing OpenRouter connection...');
    const isConnected = await AISummaryService.validateConnection();
    
    if (!isConnected) {
      console.log('❌ OpenRouter connection failed');
      console.log('   Please check your OPENROUTER_API_KEY in .env.local');
      return;
    }
    
    console.log('✅ OpenRouter connection successful\n');

    console.log('2. Testing AI summary generation...');
    const summaryData = {
      activities: mockActivities,
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      teamContext: {
        repositories: ['owner/repo', 'owner/another-repo'],
        channels: ['#engineering', '#general', '#product'],
        teamSize: 5,
      },
    };

    const summary = await AISummaryService.generateSummary('test-user', summaryData);
    
    console.log('✅ AI summary generated successfully\n');
    console.log('📊 Summary Results:');
    console.log('==================');
    console.log(`Title: ${summary.title}`);
    console.log(`Generated At: ${summary.generatedAt}`);
    console.log(`Activity Count: ${summary.metadata.activityCount}`);
    console.log(`Model: ${summary.metadata.model}`);
    console.log(`Tokens Used: ${summary.metadata.tokensUsed}\n`);

    console.log('🎯 Key Highlights:');
    summary.keyHighlights.forEach((highlight, index) => {
      console.log(`  ${index + 1}. ${highlight}`);
    });

    console.log('\n⚠️  Action Items:');
    summary.actionItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });

    if (summary.insights && summary.insights.length > 0) {
      console.log('\n💡 Additional Insights:');
      summary.insights.forEach((insight, index) => {
        console.log(`  ${index + 1}. ${insight}`);
      });
    }

    console.log('\n✅ AI Summary test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit your dashboard to see the AI Summary card');
    console.log('3. Connect your GitHub and Slack integrations');
    console.log('4. Generate summaries with real data');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check your OPENROUTER_API_KEY in .env.local');
    console.log('2. Ensure you have sufficient credits in your OpenRouter account');
    console.log('3. Check your internet connection');
    console.log('4. Review the error message above for specific issues');
  }
}

// Run the test
testAISummaryService();
