import { test } from '../../helpers/ui/ui-test';

test.describe('The planting years pages', () => {
    test.beforeEach(async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test('list a year with its dates, and show it with its plantings counted', async ({
        garden, plantingYearsPage, plantingYearDetailsPage,
    }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: spring');
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring');
        await garden.hasPlanting('planting: late', 'plant: sungold', 'year: spring', 'status: started');
        await plantingYearsPage.open();
        await plantingYearsPage.checkIsShown();

        await plantingYearsPage.checkYearListed('year: spring');
        await plantingYearsPage.viewYear('year: spring');

        await plantingYearDetailsPage.checkIsShownFor('year: spring');
        await plantingYearDetailsPage.checkShowsYear('year: spring', 'created: 1', 'started: 1');
    });

    // The page proposes the year after the latest, passing over any more than
    // a year past the browser's calendar, so the clock is set in a year the
    // test owns: other workers' years are then too far ahead, or behind. Only
    // planted plantings are carried forward, under a heading that says so; it
    // said "not retired" (backlog B17 and B18)
    test('add the year after, carrying forward what was planted', async ({
        garden, browserClock, plantingYearsPage, addPlantingYearPage, plantingYearDetailsPage,
    }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: last');
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: last', 'status: planted');
        await garden.hasPlanting('planting: late', 'plant: sungold', 'year: last', 'status: started');
        await browserClock.setToNoonIn('year: last', 'on: 04-10');
        await plantingYearsPage.open();
        await plantingYearsPage.checkIsShown();
        await plantingYearsPage.addYear();
        await addPlantingYearPage.checkIsShown();
        await addPlantingYearPage.checkProposesTheYearAfter('year: last');
        await addPlantingYearPage.checkCarriesForward('planting: early');

        await addPlantingYearPage.addYear('year: next', 'after: last', 'frost: 15', 'target: 20');

        await plantingYearsPage.checkIsShown();
        await plantingYearsPage.checkYearListed('year: next');
        await plantingYearsPage.viewYear('year: next');
        await plantingYearDetailsPage.checkIsShownFor('year: next');
        await plantingYearDetailsPage.checkShowsYear('year: next', 'planted: 1');
    });

    // Carrying a planting forward left its current year behind, and the
    // service files a new harvest under that year. So a harvest entered in the
    // new year went to the year before, and the new year's garden and
    // harvests pages never showed it (vigilant-harvest-service)
    test('file a harvest of a planting carried into the year after under that year', async ({
        garden, browserClock, plantingYearsPage, addPlantingYearPage, dashboardPage, gardenPage,
    }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: last');
        await garden.hasPlot('plot: bed');
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: last', 'status: planted', 'plot: bed');
        await browserClock.setToNoonIn('year: last', 'on: 04-10');
        await plantingYearsPage.open();
        await plantingYearsPage.checkIsShown();
        await plantingYearsPage.addYear();
        await addPlantingYearPage.checkIsShown();
        await addPlantingYearPage.addYear('year: next', 'after: last', 'frost: 15', 'target: 20');
        await plantingYearsPage.checkIsShown();
        await dashboardPage.open();
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: next');
        await dashboardPage.checkYearIsChosen('year: next');
        await gardenPage.open();
        await gardenPage.checkIsShown();

        await gardenPage.enterHarvest('planting: early', 'quantity: 3');
        await gardenPage.confirmHarvests();

        // the card's total is the chosen year's harvests
        await gardenPage.checkShowsPlanting('planting: early');
    });

    test('add a year only once both its dates are picked', async ({
        garden, browserClock, plantingYearsPage, addPlantingYearPage,
    }) => {
        await garden.hasPlantingYear('year: last');
        await browserClock.setToNoonIn('year: last', 'on: 04-10');
        await plantingYearsPage.open();
        await plantingYearsPage.checkIsShown();
        await plantingYearsPage.addYear();
        await addPlantingYearPage.checkIsShown();

        await addPlantingYearPage.checkCreateNeedsBothDates();
    });

    // The store holds the last year viewed until the year's own details
    // arrive, and the page shows none (backlog A15)
    test('show only the year opened, while it loads', async ({
        garden, plantingYearsPage, plantingYearDetailsPage,
    }) => {
        await garden.hasPlantingYear('year: spring');
        await garden.hasPlantingYear('year: autumn');
        await plantingYearsPage.open();
        await plantingYearsPage.checkIsShown();
        await plantingYearsPage.viewYear('year: spring');
        await plantingYearDetailsPage.checkIsShownFor('year: spring');
        await plantingYearDetailsPage.dashboardNav.goTo('page: plantingYears');
        await plantingYearsPage.checkIsShown();

        await plantingYearsPage.viewYearWhileItLoads('year: autumn');

        await plantingYearDetailsPage.checkShowsOnlyItsOwnYear('year: autumn', 'previous: spring');
    });

    test('say when the years can\'t be loaded', async ({ plantingYearsPage }) => {
        await plantingYearsPage.openWithTheListFailing();

        await plantingYearsPage.checkSaysTheYearsDidNotLoad();
    });
});
