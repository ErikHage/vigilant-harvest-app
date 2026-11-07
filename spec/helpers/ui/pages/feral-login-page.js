import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { user } from '../params';

/** feral-authentication's login page, opened by the app's SSO button, in words. */
export function createFeralLoginPage(world, driver) {
    return {
        /** It's open to sign on to this app. No parameters. */
        async checkIsShownForTheApp(...args) {
            parseDslArgs(args, {});

            await driver.isShownForTheApp();
        },

        /** Logs in as `user` (the reserved `gardener`), typing the credentials into the page. */
        async logIn(...args) {
            const params = parseDslArgs(args, { user: user() });

            await driver.logIn(world.credentialsFor(params.user));
        },
    };
}
