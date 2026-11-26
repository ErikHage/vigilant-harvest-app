import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { year } from '../params';

/**
 * The bar across the top of every page, in words. Every page object exposes
 * it as `appBar`. Signed on, Logout is in the user's menu.
 */
export function createAppBar(world, driver) {
    return {
        /** Opens the user's menu and presses Logout. Check `loginPage.checkIsShown()` before the next step. No parameters. */
        async logOut(...args) {
            parseDslArgs(args, {});

            await driver.logOut();
        },

        /** After logging out, the session in feral was ended too. No parameters. */
        async checkLogoutEndedTheSession(...args) {
            parseDslArgs(args, {});

            await driver.logoutEndsTheSession();
        },

        /** The bar names the `year` (one the test named) as the year being worked on. */
        async checkShowsYear(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.showsYear(world.plantingYearNamed(params.year).plantingYear);
        },

        /**
         * Signed out, the bar offers nothing but the app's name, on a desktop
         * or a phone. Check where the browser is first, so the page has
         * settled. No parameters.
         */
        async checkOffersNothingSignedOut(...args) {
            parseDslArgs(args, {});

            await driver.offersOnlyTheTitle();
        },
    };
}
