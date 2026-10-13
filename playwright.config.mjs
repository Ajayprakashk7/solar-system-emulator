import { defineConfig, devices } from '@playwright/test';

const webServerUrl = 'http://127.0.0.1:3211';
const softwareWebGlArgs = ['--use-angle=swiftshader', '--enable-webgl'];

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: webServerUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npm start',
    url: webServerUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      HOSTNAME: '127.0.0.1',
      PORT: '3211',
    },
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: softwareWebGlArgs },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        launchOptions: { args: softwareWebGlArgs },
      },
    },
  ],
});
