import { test } from '../../helpers/ui/ui-test';

// The side drawer, FrAppShell's. Its year pages show only with a year chosen,
// and since the store falls back to the current year and nothing can clear it,
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
        await dashboardPage.nav.goTo('page: plants');
        await plantsPage.checkIsShown();

        await plantsPage.nav.goTo('page: plots');
        await plotsPage.checkIsShown();

        await plotsPage.nav.goTo('page: plantingYears');
        await plantingYearsPage.checkIsShown();

        await plantingYearsPage.nav.goTo('page: plantCategories');
        await plantCategoriesPage.checkIsShown();

        await plantCategoriesPage.nav.goTo('page: activitySchedules');
        await activitySchedulesPage.checkIsShown();

        await activitySchedulesPage.nav.goTo('page: dashboard');
        await dashboardPage.checkIsShown();
    });

    test('leads to each of the year\'s pages', async ({
        dashboardPage, planningPage, gardenPage, journalPage, activityLogPage, plantingsPage, harvestsPage, statsPage,
    }) => {
        await dashboardPage.nav.goTo('page: planning');
        await planningPage.checkIsShown();

        await planningPage.nav.goTo('page: garden');
        await gardenPage.checkIsShown();

        await gardenPage.nav.goTo('page: journal');
        await journalPage.checkIsShown();

        await journalPage.nav.goTo('page: activityLog');
        await activityLogPage.checkIsShown();

        await activityLogPage.nav.goTo('page: plantings');
        await plantingsPage.checkIsShown();

        await plantingsPage.nav.goTo('page: harvests');
        await harvestsPage.checkIsShown();

        await harvestsPage.nav.goTo('page: stats');
        await statsPage.checkIsShown();
    });

    test('collapses to a rail that still leads to each page, and is remembered', async ({
        dashboardPage, plotsPage,
    }) => {
        await dashboardPage.nav.checkIsExpanded();

        await dashboardPage.nav.collapseToRail();
        await dashboardPage.nav.goTo('page: plots');
        await plotsPage.checkIsShown();

        await plotsPage.reload();
        await plotsPage.checkIsShownAfterReload();
        await plotsPage.nav.checkIsRail();

        await plotsPage.nav.expand();
        await plotsPage.reload();
        await plotsPage.checkIsShownAfterReload();
        await plotsPage.nav.checkIsExpanded();
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

        await dashboardPage.nav.goTo('page: plots');
        await plotsPage.checkIsShown();

        await plotsPage.nav.goTo('page: stats');
        await statsPage.checkIsShown();
    });

    test('the page title is readable', async ({ loginPage, dashboardPage, gardenPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await gardenPage.open();
        await gardenPage.checkIsShown();
        await gardenPage.checkTitleIsReadable();
    });

    // As the desktop layout does (backlog A12)
    test('the app bar offers nothing to someone signed out', async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.checkIsShown();

        await loginPage.appBar.checkOffersNothingSignedOut();
        await loginPage.nav.checkIsAbsent();
    });
});

test.describe('On a desktop', () => {
    test('the app bar offers nothing to someone signed out', async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.checkIsShown();

        await loginPage.appBar.checkOffersNothingSignedOut();
        await loginPage.nav.checkIsAbsent();
    });
});
