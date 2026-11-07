import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

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

            await driver.logoutLeavesTheSessionOpen();
        },
    };
}
