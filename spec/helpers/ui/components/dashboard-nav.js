import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { destination } from '../params';

/** The dashboard's side drawer, with a link to each page, in words. */
export function createDashboardNav(world, driver) {
    return {
        /**
         * Follows the link to `page` (`plants`, `stats`, ...), opening the
         * drawer first on a phone. The destination page checks where that led.
         */
        async goTo(...args) {
            const params = parseDslArgs(args, { page: destination() });

            await driver.goTo(params.page);
        },

        /** On a desktop: collapses the expanded drawer to a rail of icons, with Menu. No parameters. */
        async collapseToRail(...args) {
            parseDslArgs(args, {});

            await driver.collapseToRail();
        },

        /** On a desktop: expands the rail again, with Menu. No parameters. */
        async expand(...args) {
            parseDslArgs(args, {});

            await driver.expand();
        },

        /** The drawer is a rail of icons. No parameters. */
        async checkIsRail(...args) {
            parseDslArgs(args, {});

            await driver.isRail();
        },

        /** The drawer is expanded, with each page's name. No parameters. */
        async checkIsExpanded(...args) {
            parseDslArgs(args, {});

            await driver.isExpanded();
        },
    };
}
