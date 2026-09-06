import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: {
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 800 },
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
