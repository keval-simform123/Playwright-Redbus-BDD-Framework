import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// maps feature files to step definitions
const testDir = defineBddConfig({
  features: 'features/booking_flow.feature',
  steps: ['steps/**/*.steps.ts', 'steps/fixtures.ts'],
});

export default defineConfig({
  testDir,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    cucumberReporter('html', { outputFile: 'playwright-report/cucumber-report.html' }),
    [require.resolve('./utils/slackReporter')],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },
  timeout: 300000,
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: './playwright/.auth/session.json',
      },
    },
  ],
  outputDir: 'test-results/',
});
