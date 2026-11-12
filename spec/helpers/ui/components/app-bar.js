import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { year } from '../params';

/** The bar across the top of every page, in words. */
export function createAppBar(world, driver) {
    return {
        /** Clicks Logout. Check `loginPage.checkIsShown()` before the next step. No parameters. */
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

        /** Signed out, on a desktop, the bar offers nothing but the title. No parameters. */
        async checkOffersNothingSignedOut(...args) {
            parseDslArgs(args, {});

            await driver.offersOnlyTheTitle();
        },

        /** Signed out, on a phone, the bar offers nothing to someone signed out. No parameters. */
        async checkOffersNothingSignedOutOnAPhone(...args) {
            parseDslArgs(args, {});

            await driver.offersNothingOnAPhone();
        },
    };
}
