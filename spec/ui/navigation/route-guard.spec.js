import { test } from '../../helpers/ui/ui-test';

test.describe('The route guard', () => {
    // Signing on returns to where the visit was going (backlog A9)
    test('sends a visit that isn\'t signed on to the login page, to return after', async ({ loginPage, plotsPage }) => {
        await plotsPage.open();

        await loginPage.checkIsShownToReturnTo('path: dashboard/plots');

        await loginPage.logIn('user: gardener');
        await plotsPage.checkIsShown();
    });

    test('lets a signed-on visit through', async ({ loginPage, dashboardPage, plotsPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await plotsPage.open();

        await plotsPage.checkIsShown();
    });
});

// A not-found page, behind the guard under the dashboard (backlog A8)
test.describe('A path the app has no page for', () => {
    test('says so at the top level', async ({ unknownPage }) => {
        await unknownPage.open('path: no-such-page');

        await unknownPage.checkIsShownAt('path: no-such-page');
    });

    // It used to show without signing on, since nothing marked it protected
    test('says so under the dashboard, once signed on', async ({ unknownPage, loginPage }) => {
        await unknownPage.open('path: dashboard/no-such-page');
        await loginPage.checkIsShownToReturnTo('path: dashboard/no-such-page');

        await loginPage.logIn('user: gardener');

        await unknownPage.checkIsShownAt('path: dashboard/no-such-page');
    });
});
