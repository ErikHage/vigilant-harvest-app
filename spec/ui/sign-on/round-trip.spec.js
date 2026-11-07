import { test } from '../../helpers/ui/ui-test';

// The whole round trip, as a person signs on: the app's SSO button, feral's
// own login page, and back to the app with a token. It needs feral's app
// running too (UI_AUTH_APP_URL), and the URL feral has registered for the app
// to be its landing page. Every other test signs on with loginPage.logIn,
// which skips feral's pages.

test.describe('Signing on through feral', () => {
    test('goes from the SSO button, through feral\'s login page, to the dashboard', async ({
        loginPage, feralLoginPage, dashboardPage,
    }) => {
        await loginPage.open();
        await loginPage.checkIsShown();

        await loginPage.chooseSso();
        await feralLoginPage.checkIsShownForTheApp();
        await feralLoginPage.logIn('user: gardener');

        await dashboardPage.checkIsShown();
    });
});
