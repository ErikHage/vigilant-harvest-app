import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { time } from '../params';

/** The browser's clock, in words. Not a page: set it before signing on. */
export function createBrowserClock(world, driver) {
    return {
        /**
         * From here on the browser's `new Date()` is `time`, ISO 8601 with its
         * offset: `time: 2026-07-01T23:30:00-04:00`, an evening in New York.
         */
        async setTo(...args) {
            const params = parseDslArgs(args, { time: time() });

            await driver.setTo(params.time);
        },
    };
}
