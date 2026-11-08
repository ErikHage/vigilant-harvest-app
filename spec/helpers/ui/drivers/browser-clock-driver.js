import { expectThat } from './assertions';

/**
 * The browser's clock. Fixing it freezes `new Date()` at a moment of the
 * test's choosing; timers still run, so the app's alerts still fade.
 */
export function createBrowserClockDriver(page) {
    return {
        /**
         * Fixes the clock at `time`, ISO 8601 with its offset, after checking
         * the browser isn't on UTC: a date pin shows nothing there.
         */
        async setTo(time) {
            const instant = new Date(time);
            expectThat(!Number.isNaN(instant.getTime()), 'an ISO 8601 time with its offset', time, 'fixing the clock');
            const offset = await page.evaluate(() => new Date().getTimezoneOffset());
            expectThat(offset !== 0, 'the browser to be off UTC (playwright.config.js: America/New_York)',
                `an offset of ${offset}`, 'fixing the clock');
            await page.clock.setFixedTime(instant);
        },
    };
}
