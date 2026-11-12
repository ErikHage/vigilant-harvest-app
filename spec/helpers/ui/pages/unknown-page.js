import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { path } from '../params';

/** A path the app has no page for, in words. */
export function createUnknownPage(world, driver) {
    return {
        /** Goes to `path`, which no route matches. */
        async open(...args) {
            const params = parseDslArgs(args, { path: path() });

            await driver.open(params.path);
        },

        /** The app says it has no page at `path`. */
        async checkIsShownAt(...args) {
            const params = parseDslArgs(args, { path: path() });

            await driver.saysNoPageAt(params.path);
        },
    };
}
