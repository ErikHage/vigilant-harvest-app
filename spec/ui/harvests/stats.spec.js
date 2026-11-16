import { test } from '../../helpers/ui/ui-test';

// The stats page totals the chosen year's harvests, so each test chooses a
// year of its own. Harvests are filed on their day, in 2026, and their first
// and last days show as filed: the service sends each as YYYY-MM-DD, read as
// that local day

test.describe('The stats page', () => {
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

    // The average a day, 7 over 3 days, to a tenth. It was unrounded (backlog
    // B31)
    test('totals the year, and a planting\'s harvests', async ({ statsPage }) => {
        await statsPage.open();
        await statsPage.checkIsShown();

        await statsPage.checkShowsTotals('first: 2026-07-07', 'last: 2026-07-09', 'days: 3', 'harvestDays: 2');
        await statsPage.showTab('tab: plantings');
        await statsPage.plantings.choose('planting: early');
        await statsPage.plantings.checkShowsStats('planting: early',
            'first: 2026-07-07', 'last: 2026-07-09', 'total: 7', 'average: 2.3');
    });

    // The page opens on the plants tab
    test('totals the year, and a plant\'s harvests, from all its plantings', async ({ statsPage }) => {
        await statsPage.open();
        await statsPage.checkIsShown();

        await statsPage.checkShowsTotals('first: 2026-07-07', 'last: 2026-07-09', 'days: 3', 'harvestDays: 2');
        await statsPage.plants.choose('plant: sungold');
        await statsPage.plants.checkShowsStats('plant: sungold',
            'first: 2026-07-07', 'last: 2026-07-09', 'total: 12', 'average: 4');
    });

    // The plant and planting stats were two pages, then one page told which by
    // its route (backlog B29). Now they are tabs, each with its own choice
    test('keeps each tab\'s choice while the other is shown', async ({ statsPage }) => {
        await statsPage.open();
        await statsPage.checkIsShown();
        await statsPage.plants.choose('plant: sungold');

        await statsPage.showTab('tab: plantings');
        await statsPage.plantings.checkShowsNothingChosen();
        await statsPage.plantings.choose('planting: late');
        await statsPage.plantings.checkShowsStats('planting: late',
            'first: 2026-07-09', 'last: 2026-07-09', 'total: 5', 'average: 5');

        await statsPage.showTab('tab: plants');
        await statsPage.plants.checkShowsStats('plant: sungold',
            'first: 2026-07-07', 'last: 2026-07-09', 'total: 12', 'average: 4');
    });
});
