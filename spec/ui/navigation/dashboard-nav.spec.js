import { test } from '../../helpers/ui/ui-test';

// The dashboard's own bar. Its year pages show only with a year chosen, and
// since the store falls back to the current year and nothing can clear it,
// one always is: so the unit suite's A11 (they'd show with none) can't arise
// in the app as it is.

test.describe('The dashboard\'s bar', () => {
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
        dashboardPage, planningPage, gardenPage, plantingsPage, harvestsPage, plantStatsPage, plantingStatsPage,
    }) => {
        await dashboardPage.dashboardNav.goTo('page: planning');
        await planningPage.checkIsShown();

        await planningPage.dashboardNav.goTo('page: garden');
        await gardenPage.checkIsShown();

        await gardenPage.dashboardNav.goTo('page: plantings');
        await plantingsPage.checkIsShown();

        await plantingsPage.dashboardNav.goTo('page: harvests');
        await harvestsPage.checkIsShown();

        await harvestsPage.dashboardNav.goTo('page: plantStats');
        await plantStatsPage.checkIsShown();

        await plantStatsPage.dashboardNav.goTo('page: plantingStats');
        await plantingStatsPage.checkIsShown();
    });
});

test.describe('On a phone', () => {
    // Below Vuetify's md breakpoint (960px), where both bars change layout
    test.use({ viewport: { width: 390, height: 844 } });

    test('the dashboard\'s bar is a menu, and still leads to each page', async ({
        loginPage, dashboardPage, plotsPage, plantStatsPage,
    }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();

        await dashboardPage.dashboardNav.goTo('page: plots');
        await plotsPage.checkIsShown();

        await plotsPage.dashboardNav.goTo('page: plantStats');
        await plantStatsPage.checkIsShown();
    });

    // DocumentsCurrentBehavior: the phone layout doesn't check whether anyone
    // is signed on, so it offers the home link and Logout to someone who isn't
    // (backlog A12). Should offer them only when signed on, as the desktop
    // layout does
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
