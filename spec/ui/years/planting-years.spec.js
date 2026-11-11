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

    // The page proposes the year after the browser's calendar year, so the
    // clock is set in a year the test owns. Only planted plantings are carried
    // forward, under a heading that says "not retired" (backlog B17, tier B)
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

    // DocumentsCurrentBehavior: Create is never disabled, so it sends a year
    // with no dates; the service refuses it ("lastFrostDate is required"), and
    // the page says only "error adding planting year" (backlog A14). Should
    // offer Create only once both dates are picked
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
        await addPlantingYearPage.create();

        await addPlantingYearPage.checkAlertSays('message: error adding planting year');
        await addPlantingYearPage.checkIsShown();
    });

    // DocumentsCurrentBehavior: the details page shows whatever year the store
    // holds, so until the year's own details arrive it shows the last year
    // viewed (backlog A15). Should show only the year in its URL
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
