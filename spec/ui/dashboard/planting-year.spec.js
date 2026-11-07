import { test } from '../../helpers/ui/ui-test';

test.describe('Choosing the planting year', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage }) => {
        await garden.hasPlantingYear('year: spring');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test('makes it the year the app works on', async ({ dashboardPage }) => {
        await dashboardPage.chooseYear('year: spring');

        await dashboardPage.checkYearIsChosen('year: spring');
        await dashboardPage.appBar.checkShowsYear('year: spring');
    });

    test('keeps it across a reload', async ({ dashboardPage }) => {
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');

        await dashboardPage.reload();

        await dashboardPage.checkIsShownAfterReload();
        await dashboardPage.checkYearIsChosen('year: spring');
        await dashboardPage.appBar.checkShowsYear('year: spring');
    });
});
