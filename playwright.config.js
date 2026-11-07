import { defineConfig, devices } from '@playwright/test';

import { appUrl } from './spec/helpers/ui/setup/config';

// UI tests run against an already running app and services; see
// spec/ui/README.md. There is no webServer: the suite never starts them.
export default defineConfig({
    testDir: './spec/ui',
    globalSetup: './spec/helpers/ui/setup/global-setup.js',
    // One at a time by default: the tests share one database, and the Vite dev
    // server serves each page as hundreds of unbundled modules. Before each
    // commit, also run --workers=4 --repeat-each=3
    workers: 1,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: appUrl,
        // As the unit suite's TZ, so date handling is tested west of Greenwich,
        // where the harvest dates show a day early (backlog A28)
        timezoneId: 'America/New_York',
        // Without one, a click on a missing element waits out the whole test
        // timeout and reports only that
        actionTimeout: 10_000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
