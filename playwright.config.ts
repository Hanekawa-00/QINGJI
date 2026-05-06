import { defineConfig, devices } from '@playwright/test'

const desktopPort = 4310
const mobilePort = 4311

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${desktopPort} --strictPort`,
      url: `http://127.0.0.1:${desktopPort}`,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_QINGJI_PLATFORM: 'desktop',
        VITE_DISABLE_HMR: 'true',
      },
    },
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${mobilePort} --strictPort`,
      url: `http://127.0.0.1:${mobilePort}`,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_QINGJI_PLATFORM: 'mobile',
        VITE_DISABLE_HMR: 'true',
      },
    },
  ],
  projects: [
    {
      name: 'desktop-web',
      use: {
        baseURL: `http://127.0.0.1:${desktopPort}`,
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-web',
      use: {
        ...devices['Pixel 5'],
        baseURL: `http://127.0.0.1:${mobilePort}`,
      },
    },
  ],
})
