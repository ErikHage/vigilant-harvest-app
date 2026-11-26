import { expectEventually, expectText, expectThat, expectVisible } from './assertions';
import { status } from '../support/status-codes';

const logout = /\/logout$/;

/**
 * The bar across the top of every page, as Playwright sees it: FrAppShell's
 * toolbar once someone is signed on, the app's name alone otherwise. Signed
 * on, it shows the chosen year in its middle, and Logout is in the user's
 * menu, behind their initials. The Menu button that `nav` presses on a phone
 * is here too.
 */
export function createAppBarDriver(page, serviceCalls) {
    const bar = page.getByRole('banner');
    const userMenuButton = bar.getByRole('button', { name: /^Account: / });
    const logoutItem = page.locator('.fr-app-user-menu').getByText('Logout', { exact: true });
    // Vuetify's toolbar titles have no role; the year's has its own class
    const year = bar.locator('.planting-year');
    const anyControl = bar.getByRole('link').or(bar.getByRole('button'));

    return {
        async logOut() {
            await userMenuButton.click();
            await logoutItem.click();
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
         * Signed out: the app's name, and no links or buttons. Reads the
         * controls once, without retrying: a retrying check would pass while
         * the page is still rendering. Call it after a step that proves the
         * page has settled.
         */
        async offersOnlyTheTitle() {
            const what = `the app bar, signed out, ${page.viewportSize()?.width}px wide`;

            await expectText(bar, 'Vigilant Harvest', what);
            const count = await anyControl.count();
            expectThat(count === 0, 'no links or buttons', `${count}`, what);
        },
    };
}
