import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e',
  fullyParallel: false, // Reduce parallelism to avoid browser context conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add retries for local development too
  workers: 1, // Force single worker to avoid context conflicts
  timeout: 60000, // Increase overall test timeout
  expect: {
    timeout: 10000, // Increase expect timeout
  },
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000, // Reduce timeout to fail faster
    navigationTimeout: 10000, // Reduce timeout to fail faster
    // Add browser context options for stability
    contextOptions: {
      // Disable web security to avoid CORS issues
      ignoreHTTPSErrors: true,
      // Set viewport for consistency
      viewport: { width: 1280, height: 720 },
      // Add more stability options
      reducedMotion: 'reduce',
      colorScheme: 'light',
    },
    // Add launch options for stability
    launchOptions: {
      // Disable web security and add stability flags
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-ipc-flooding-protection'
      ],
      // Increase timeout for browser launch
      timeout: 60000,
      // Add headless mode for stability
      headless: process.env.CI ? true : false,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}); 