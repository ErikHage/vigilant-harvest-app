import { expectCount, expectEventually, expectText, expectThat, expectVisible } from './assertions';
import { urlOf } from './urls';
import { status } from '../support/status-codes';

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
         * After logging out, once the login page shows: one call reached feral
         * to end the session, feral ended it (204), and the page says nothing
         * of a failure. The app goes to the login page only once its logout
         * is done, so that page showing is the point to read it once.
         */
        async logoutEndsTheSession() {
            const what = 'logging out';

            await expectVisible(bar, what);
            await expectEventually(() => serviceCalls.wereAnswered('POST', logout, status.noContent),
                'feral to end the session (204)', what);
            const made = serviceCalls.countMade('POST', logout);
            expectThat(made === 1, 'one logout call to feral', `${made} made`, what);
            const failures = await page.getByText('error logging out').count();
            expectThat(failures === 0, 'no "error logging out"', `${failures} shown`, what);
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
