import { test } from '../../helpers/ui/ui-test';

// The dashboard's side drawer. Its year pages show only with a year chosen, and
// since the store falls back to the current year and nothing can clear it,
// one always is: so the unit suite's A11 (they'd show with none) can't arise
// in the app as it is.

test.describe('The dashboard\'s drawer', () => {
    test.beforeEach(async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test('leads to each page that doesn\'t depend on the year', async ({
        dashboardPage, plantsPage, plotsPage, plantingYearsPage, plantCategoriesPage, activitySchedulesPage,
    }) => {
        await dashboardPage.dashboardNav.goTo('page: plants');
        await plantsPage.checkIsShown();

        await plantsPage.dashboardNav.goTo('page: plots');
        await plotsPage.checkIsShown();

        await plotsPage.dashboardNav.goTo('page: plantingYears');
        await plantingYearsPage.checkIsShown();

        await plantingYearsPage.dashboardNav.goTo('page: plantCategories');
        await plantCategoriesPage.checkIsShown();

        await plantCategoriesPage.dashboardNav.goTo('page: activitySchedules');
        await activitySchedulesPage.checkIsShown();
    });

    test('leads to each of the year\'s pages', async ({
        dashboardPage, planningPage, gardenPage, journalPage, activityLogPage, plantingsPage, harvestsPage, statsPage,
    }) => {
        await dashboardPage.dashboardNav.goTo('page: planning');
        await planningPage.checkIsShown();

        await planningPage.dashboardNav.goTo('page: garden');
        await gardenPage.checkIsShown();

        await gardenPage.dashboardNav.goTo('page: journal');
        await journalPage.checkIsShown();

        await journalPage.dashboardNav.goTo('page: activityLog');
        await activityLogPage.checkIsShown();

        await activityLogPage.dashboardNav.goTo('page: plantings');
        await plantingsPage.checkIsShown();

        await plantingsPage.dashboardNav.goTo('page: harvests');
        await harvestsPage.checkIsShown();

        await harvestsPage.dashboardNav.goTo('page: stats');
        await statsPage.checkIsShown();
    });

    test('collapses to a rail that still leads to each page, and is remembered', async ({
        dashboardPage, plotsPage,
    }) => {
        await dashboardPage.dashboardNav.checkIsExpanded();

        await dashboardPage.dashboardNav.collapseToRail();
        await dashboardPage.dashboardNav.goTo('page: plots');
        await plotsPage.checkIsShown();

        await plotsPage.reload();
        await plotsPage.checkIsShownAfterReload();
        await plotsPage.dashboardNav.checkIsRail();

        await plotsPage.dashboardNav.expand();
        await plotsPage.reload();
        await plotsPage.checkIsShownAfterReload();
        await plotsPage.dashboardNav.checkIsExpanded();
    });
});

test.describe('On a phone', () => {
    // Below Vuetify's md breakpoint (960px), where the app bar and the drawer change layout
    test.use({ viewport: { width: 390, height: 844 } });

    test('the dashboard\'s drawer opens from Menu, and still leads to each page', async ({
        loginPage, dashboardPage, plotsPage, statsPage,
    }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await dashboardPage.dashboardNav.goTo('page: plots');
        await plotsPage.checkIsShown();

        await plotsPage.dashboardNav.goTo('page: stats');
        await statsPage.checkIsShown();
    });

    // As the desktop layout does (backlog A12)
    test('the app bar offers nothing to someone signed out', async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.checkIsShown();

        await loginPage.appBar.checkOffersNothingSignedOutOnAPhone();
    });
});

test.describe('On a desktop', () => {
    test('the app bar offers nothing to someone signed out', async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.checkIsShown();

        await loginPage.appBar.checkOffersNothingSignedOut();
    });
});
