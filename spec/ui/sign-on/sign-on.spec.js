import { test } from '../../helpers/ui/ui-test';

// Signing on with a token feral issues, brought to the app's landing page as
// feral's login page would bring it. The round trip through feral's own
// login page is 2.2's.

test.describe('Signing on', () => {
    test('lands on the dashboard', async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');

        await dashboardPage.checkIsShown();
    });

    test('stays signed on across a reload', async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await dashboardPage.reload();

        await dashboardPage.checkIsShownAfterReload();
    });

    test('rejects a token feral never issued', async ({ loginPage }) => {
        await loginPage.logInWithToken('token: made-up');

        await loginPage.checkSignOnIsRejected();
    });
});

test.describe('Logging out', () => {
    test('goes to the login page, and a later visit to the dashboard stays there', async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await dashboardPage.appBar.logOut();
        await loginPage.checkIsShown();

        await dashboardPage.open();
        await loginPage.checkIsShown();
    });

    test('ends the session in feral', async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await dashboardPage.appBar.logOut();
        await loginPage.checkIsShown();

        await dashboardPage.appBar.checkLogoutEndedTheSession();
    });
});
