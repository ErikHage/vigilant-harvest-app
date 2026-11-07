import { expectThat, expectVisible } from './assertions';

const logout = /\/logout$/;

/** The bar across the top of every page, as Playwright sees it. */
export function createAppBarDriver(page, serviceCalls) {
    const bar = page.getByRole('banner');
    const logoutButton = bar.getByRole('button', { name: 'Logout' });

    return {
        async logOut() {
            await logoutButton.click();
        },

        /**
         * After logging out, once the login page shows: no call reached feral to
         * end the session, so it stays open there until it expires (backlog A2:
         * the authentication API has no `logout`). The browser's token is gone
         * from storage, which is what makes the login page show.
         */
        async logoutLeavesTheSessionOpen() {
            const what = 'logging out';

            await expectVisible(bar.getByText('Vigilant Harvest'), what);
            const reached = serviceCalls.countMade('POST', logout);
            expectThat(reached === 0, 'no logout call to feral (pinned: there is none)', `${reached} made`, what);
        },
    };
}
