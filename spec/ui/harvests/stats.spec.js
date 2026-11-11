import { test } from '../../helpers/ui/ui-test';

// The stats pages total the chosen year's harvests, so each test chooses a
// year of its own. Harvests are filed on their day, in 2026, and their first
// and last days show as filed: the service sends each as YYYY-MM-DD, read as
// that local day

test.describe('The stats pages', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: spring');
        await garden.hasPlot('plot: bed');
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: planted', 'plot: bed');
        await garden.hasPlanting('planting: late', 'plant: sungold', 'year: spring', 'status: planted', 'plot: bed');
        await garden.hasHarvest('planting: early', 'quantity: 3', 'on: 2026-07-07');
        await garden.hasHarvest('planting: early', 'quantity: 4', 'on: 2026-07-09');
        await garden.hasHarvest('planting: late', 'quantity: 5', 'on: 2026-07-09');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');
    });

    // The average a day is unrounded (backlog B31, tier B): 7 over 3 days
    test('totals the year, and a planting\'s harvests', async ({ plantingStatsPage }) => {
        await plantingStatsPage.open();
        await plantingStatsPage.checkIsShown();

        await plantingStatsPage.checkShowsTotals('first: 2026-07-07', 'last: 2026-07-09', 'days: 3', 'harvestDays: 2');
        await plantingStatsPage.choose('planting: early');
        await plantingStatsPage.checkShowsStats('planting: early',
            'first: 2026-07-07', 'last: 2026-07-09', 'total: 7', 'average: 2.3333333333333335');
    });

    test('totals the year, and a plant\'s harvests, from all its plantings', async ({ plantStatsPage }) => {
        await plantStatsPage.open();
        await plantStatsPage.checkIsShown();

        await plantStatsPage.checkShowsTotals('first: 2026-07-07', 'last: 2026-07-09', 'days: 3', 'harvestDays: 2');
        await plantStatsPage.choose('plant: sungold');
        await plantStatsPage.checkShowsStats('plant: sungold',
            'first: 2026-07-07', 'last: 2026-07-09', 'total: 12', 'average: 4');
    });
});
