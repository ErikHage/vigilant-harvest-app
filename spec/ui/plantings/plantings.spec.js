import { test } from '../../helpers/ui/ui-test';

// The page lists the chosen year's plantings, so each test chooses a year of
// its own first.
//
// The table lists nothing unless a plot exists (backlog A19), which can't
// arise here: the local data has plots, and every test sees them

test.describe('The plantings page', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: spring');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');
    });

    test('finds a planting of the year, with its plant and status', async ({ garden, plantingsPage }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: started');

        await plantingsPage.open();
        await plantingsPage.checkIsShown();

        await plantingsPage.checkPlantingFound('planting: early');
    });

    test('adds a planting to the year through its dialog', async ({ plantingsPage, plantingDetailsPage }) => {
        await plantingsPage.open();
        await plantingsPage.checkIsShown();

        await plantingsPage.addPlanting('planting: early', 'plant: sungold', 'year: spring');

        await plantingsPage.checkPlantingFound('planting: early');
        await plantingsPage.viewPlanting('planting: early');
        await plantingDetailsPage.checkIsShownFor('planting: early');
        await plantingDetailsPage.checkShowsPlanting('planting: early');
    });

    test('offers Create only once a planting\'s required fields are given', async ({ plantingsPage }) => {
        await plantingsPage.open();
        await plantingsPage.checkIsShown();
        await plantingsPage.openAddDialog();

        await plantingsPage.checkCreateNeedsTheRequiredFields();
    });
});
