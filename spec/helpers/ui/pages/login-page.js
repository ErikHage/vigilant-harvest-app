import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { path, token, user } from '../params';
import { routedPageSteps, shellComponents } from './routed-page';

/** The login page, in words. Where a sign-on leads is checked by the destination page. */
export function createLoginPage(world, driver) {
    return {
        ...shellComponents(world),
        ...routedPageSteps(driver),

        /**
         * Signs on as `user` (the reserved `gardener`): feral issues a single
         * sign-on token, and the browser brings it to the app's landing page,
         * as it would coming back from feral's login page.
         */
        async logIn(...args) {
            const params = parseDslArgs(args, { user: user() });

            await driver.logIn(world.credentialsFor(params.user));
        },

        /** Clicks SSO, to sign on through feral's login page. No parameters. */
        async chooseSso(...args) {
            parseDslArgs(args, {});

            await driver.chooseSso();
        },

        /** Brings a `token` (`made-up`) to the landing page, as if from feral. */
        async logInWithToken(...args) {
            const params = parseDslArgs(args, { token: token() });

            await driver.logInWithToken(`ui-made-up-${params.token}-token`);
        },

        /** The token was refused: the browser is back here, and told why. No parameters. */
        async checkSignOnIsRejected(...args) {
            parseDslArgs(args, {});

            await driver.refusedSignOnSaysWhy();
        },

        /**
         * The guard sent a visit to `path` here, remembering it, so that
         * signing on goes back there.
         */
        async checkIsShownToReturnTo(...args) {
            const params = parseDslArgs(args, { path: path() });

            await driver.isShownToReturnTo(params.path);
        },
    };
}
