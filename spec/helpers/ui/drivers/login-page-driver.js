import { expectEventually, expectThat, expectUrl, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { openPath, urlOf } from './urls';
import { inSessionOf } from '../support/sessions';
import { signOnRedirect } from '../support/service-client';

const ssoExecute = /\/tokens\/sso\/execute$/;

/**
 * The login page, as Playwright sees it: the app's root, with one SSO button,
 * which sends the browser to feral's login page. A sign-on comes back to
 * `landing?sso=<token>`, which exchanges the token and goes on.
 */
export function createLoginPageDriver(page, serviceCalls) {
    const ssoButton = page.getByRole('main').getByRole('button', { name: 'SSO' });
    // The authentication store's message for a token feral refuses
    const signOnRefused = page.getByText('error authenticating sso token');

    return {
        ...createRoutedPageDriver(page, {
            name: 'the login page',
            path: '',
            marker: main => main.getByRole('button', { name: 'SSO' }),
        }),

        /**
         * Signs on as `username`, as feral's login page would: a session for the
         * app, whose single sign-on token the browser brings to the landing
         * page. The token comes from the redirect feral answers with; its host
         * isn't used, so the app's registered URL doesn't matter here.
         */
        async logIn({ username, password }) {
            const what = `signing on as ${username}`;

            const redirect = await inSessionOf({ username, password }, token => signOnRedirect(token));
            expectThat(redirect.error === undefined, 'to log in to feral', redirect.error, what);
            expectThat(redirect.status === 200 && typeof redirect.body?.redirectUrl === 'string',
                'feral to answer 200 with a redirectUrl', `${redirect.status} ${JSON.stringify(redirect.body)}`, what);
            const ssoToken = new URL(redirect.body.redirectUrl.trim()).searchParams.get('sso');
            expectThat(Boolean(ssoToken), 'the redirectUrl to carry ?sso=', redirect.body.redirectUrl, what);

            await openPath(page, `landing?sso=${encodeURIComponent(ssoToken)}`);
        },

        /** Clicks SSO, which sends the browser to feral's login page. */
        async chooseSso() {
            await ssoButton.click();
        },

        /** Brings `token` to the landing page, as if feral had sent the browser there with it. */
        async logInWithToken(token) {
            await openPath(page, `landing?sso=${encodeURIComponent(token)}`);
        },

        /**
         * After a refused token: back on the login page, saying the token was
         * refused. The alert fades after three seconds, so this follows the
         * step straight away.
         */
        async refusedSignOnSaysWhy() {
            const what = 'signing on with a token feral refuses';
            const refused = () => serviceCalls.wereRefused('POST', ssoExecute);

            await expectEventually(refused, 'feral to refuse the token', what);
            await expectUrl(page, urlOf(''), what);
            await expectVisible(ssoButton, what);
            await expectVisible(signOnRefused, what);
        },

        /**
         * The login page, sent here from `path` by the route guard, with no note
         * of where the visit was going (backlog A9).
         */
        async isShownForgettingTheWayTo(path) {
            const what = `visiting ${path} without signing on`;

            await expectUrl(page, urlOf(''), what);
            await expectVisible(ssoButton, what);
        },
    };
}
