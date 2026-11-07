import { test } from '../../helpers/ui/ui-test';

test.describe('The route guard', () => {
    // DocumentsCurrentBehavior: the guard sends the visit to plain /landing,
    // which goes on to the login page, so where it was going is lost, and
    // signing on lands on the dashboard (backlog A9). Should remember the
    // destination, and return there
    test('sends a visit that isn\'t signed on to the login page, to return after', async ({ loginPage, plotsPage }) => {
        await plotsPage.open();

        await loginPage.checkIsShownToReturnTo('path: dashboard/plots');
    });

    test('lets a signed-on visit through', async ({ loginPage, dashboardPage, plotsPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await plotsPage.open();

        await plotsPage.checkIsShown();
    });
});

// DocumentsCurrentBehavior: no route matches, so the page is empty but for the
// app bar, and since nothing marks it protected, it shows without signing on
// (backlog A8). Should show a not-found page, behind the guard under the
// dashboard
test.describe('A path the app has no page for', () => {
    test('says so at the top level', async ({ unknownPage }) => {
        await unknownPage.open('path: no-such-page');

        await unknownPage.checkIsShownAt('path: no-such-page');
    });

    test('says so under the dashboard, without signing on', async ({ unknownPage }) => {
        await unknownPage.open('path: dashboard/no-such-page');

        await unknownPage.checkIsShownAt('path: dashboard/no-such-page');
    });
});
