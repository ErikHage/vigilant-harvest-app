import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { on, time, year } from '../params';

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

        /**
         * From here on it's noon in New York `on` a day, `MM-DD`, of the `year`
         * the test named. Noon in summer time, so pick a day from April to
         * October: `on: 04-10`.
         */
        async setToNoonIn(...args) {
            const params = parseDslArgs(args, { year: year(), on: on() });

            const { plantingYear } = world.plantingYearNamed(params.year);
            await driver.setTo(`${plantingYear}-${params.on}T12:00:00-04:00`);
        },
    };
}
