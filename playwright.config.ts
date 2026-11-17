import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: true,
  forbidOnly: !!process.env.CI, retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Fail on missing baselines; updates require the explicit CLI flag.
  updateSnapshots: 'none',
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', testIgnore: '**/mobile.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: '**/mobile.spec.ts', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testIgnore: '**/mobile.spec.ts', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', testMatch: ['**/mobile.spec.ts', '**/accessibility.spec.ts', '**/visual.spec.ts'], use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', testMatch: ['**/mobile.spec.ts', '**/accessibility.spec.ts', '**/visual.spec.ts'], use: { ...devices['iPhone 13'] } },
  ],
  webServer: { command: 'npm start', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI },
});
