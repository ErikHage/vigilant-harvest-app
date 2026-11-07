import { expectCount, expectText, expectThat, expectVisible } from './assertions';
import { urlOf } from './urls';

const logout = /\/logout$/;

/**
 * The bar across the top of every page, as Playwright sees it. On a desktop
 * it reads "Vigilant Harvest", then the chosen year; on a phone it has a home
 * link (an icon, with no name) in place of the title.
 */
export function createAppBarDriver(page, serviceCalls) {
    const bar = page.getByRole('banner');
    const logoutButton = bar.getByRole('button', { name: 'Logout' });
    // Vuetify's toolbar titles have no role; the year's has its own class
    const year = bar.locator('.planting-year');

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

            await expectVisible(bar, what);
            const reached = serviceCalls.countMade('POST', logout);
            expectThat(reached === 0, 'no logout call to feral (pinned: there is none)', `${reached} made`, what);
        },

        /** The bar names `plantingYear` as the year being worked on. */
        async showsYear(plantingYear) {
            await expectText(year, String(plantingYear), `showing ${plantingYear} as the year`);
        },

        /**
         * Signed out, on a desktop: the title alone, with no year, no Dashboard
         * link and no Logout. Read once the page under it shows.
         */
        async offersOnlyTheTitle() {
            const what = 'the app bar, signed out, on a desktop';

            await expectText(bar, 'Vigilant Harvest', what);
            await expectCount(bar.getByRole('link'), 0, what);
            await expectCount(logoutButton, 0, what);
        },

        /**
         * Signed out, on a phone: the home link and Logout, as if signed on
         * (backlog A12: the phone layout doesn't check `showAppBar`). Read once
         * the page under it shows.
         */
        async offersHomeAndLogoutWhenSignedOut() {
            const what = 'the app bar, signed out, on a phone';
            const homeLink = bar.getByRole('link');

            await expectVisible(homeLink, what);
            expectThat(await homeLink.getAttribute('href') === new URL(urlOf('dashboard')).pathname,
                'a home link to the dashboard', await homeLink.getAttribute('href'), what);
            await expectVisible(logoutButton, what);
        },
    };
}
