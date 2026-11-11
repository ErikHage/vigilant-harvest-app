import { test } from '../../helpers/ui/ui-test';

// The harvests page shows the chosen year's harvests, so each test chooses a
// year of its own. Harvests are filed at noon in New York on their day, in
// 2026: the service keeps them as timestamps, 1971 to 2037, apart from their
// year

test.describe('The harvests page', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: spring');
        await garden.hasPlot('plot: bed');
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: planted', 'plot: bed');
        await garden.hasHarvest('planting: early', 'quantity: 3', 'on: 2026-07-07');
        await garden.hasHarvest('planting: early', 'quantity: 4', 'on: 2026-07-09');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');
    });

    // Each harvest shows on the day it was filed: the service sends the day,
    // YYYY-MM-DD, and the page reads it as that local day
    test('lists the harvest days newest first, and shows a day\'s harvests', async ({ harvestsPage }) => {
        await harvestsPage.open();
        await harvestsPage.checkIsShown();

        await harvestsPage.checkListsDays('days: 2026-07-09, ..., 2026-07-07');
        await harvestsPage.checkShowsDay('on: 2026-07-09');
        await harvestsPage.checkShowsHarvest('planting: early', 'on: 2026-07-09');
        await harvestsPage.chooseDay('on: 2026-07-07');
        await harvestsPage.checkShowsDay('on: 2026-07-07');
        await harvestsPage.checkShowsHarvest('planting: early', 'on: 2026-07-07');
    });

    test('edits a day\'s harvest, and shows it on the same day', async ({ harvestsPage }) => {
        await harvestsPage.open();
        await harvestsPage.checkIsShown();
        await harvestsPage.checkShowsDay('on: 2026-07-09');

        await harvestsPage.editHarvest('planting: early', 'on: 2026-07-09', 'quantity: 8');

        await harvestsPage.checkShowsDay('on: 2026-07-09');
        await harvestsPage.checkShowsHarvest('planting: early', 'on: 2026-07-09');
    });

    // Update is never disabled, so a harvest of nothing goes to the service,
    // which refuses it (400), and the dialog shows its words (backlog B30,
    // tier B)
    test('refuses a harvest of nothing', async ({ harvestsPage }) => {
        await harvestsPage.open();
        await harvestsPage.checkIsShown();
        await harvestsPage.checkShowsDay('on: 2026-07-09');

        await harvestsPage.tryToEditHarvest('planting: early', 'quantity: 0');

        await harvestsPage.checkEditRefused('message: harvests[0].quantity must be greater than 0');
    });
});

test.describe('The harvests page, with no harvests', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage }) => {
        await garden.hasPlantingYear('year: spring');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');
    });

    // It asks for a day to be chosen from an empty timeline (backlog B31,
    // tier B)
    test('says there are no harvests', async ({ harvestsPage }) => {
        await harvestsPage.open();
        await harvestsPage.checkIsShown();

        await harvestsPage.checkSaysThereAreNoHarvests();
    });
});
