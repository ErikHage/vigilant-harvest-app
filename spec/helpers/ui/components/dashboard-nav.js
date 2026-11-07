import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { destination } from '../params';

/** The dashboard's own bar, with a link to each page, in words. */
export function createDashboardNav(world, driver) {
    return {
        /**
         * Follows the link to `page` (`plants`, `plantStats`, ...), through its
         * menu if it has one. The destination page checks where that led.
         */
        async goTo(...args) {
            const params = parseDslArgs(args, { page: destination() });

            await driver.goTo(params.page);
        },
    };
}
