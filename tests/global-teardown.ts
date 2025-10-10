import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  // Clean up any global resources
  // This could include:
  // - Stopping test databases
  // - Cleaning up test files
  // - Resetting application state

  console.log('✅ Global teardown complete');
}

export default globalTeardown;
