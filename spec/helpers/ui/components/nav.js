import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { destination } from '../params';

/**
 * The side drawer, with a link to each page, in words. Every page object
 * exposes it as `nav`. Where a step leads is checked by the destination page.
 */
export function createNav(world, driver) {
    return {
        /**
         * Follows the link to `page` (`dashboard`, `plants`, `stats`, ...),
         * opening the drawer first on a phone. The destination page checks
         * where that led.
         */
        async goTo(...args) {
            const params = parseDslArgs(args, { page: destination() });

            await driver.goTo(params.page);
        },

        /** On a desktop, from expanded: Collapse navigation turns the drawer into a rail of icons. No parameters. */
        async collapseToRail(...args) {
            parseDslArgs(args, {});

            await driver.collapseToRail();
        },

        /** On a desktop, from a rail: Expand navigation expands the drawer again. No parameters. */
        async expand(...args) {
            parseDslArgs(args, {});

            await driver.expand();
        },

        /** The drawer is a rail of icons. No parameters. */
        async checkIsRail(...args) {
            parseDslArgs(args, {});

            await driver.isRail();
        },

        /** The drawer is expanded, with its headings. No parameters. */
        async checkIsExpanded(...args) {
            parseDslArgs(args, {});

            await driver.isExpanded();
        },

        /**
         * There's no drawer, as for a visitor who isn't signed on. Check where
         * the browser is first, so the page has settled. No parameters.
         */
        async checkIsAbsent(...args) {
            parseDslArgs(args, {});

            await driver.isAbsent();
        },
    };
}
