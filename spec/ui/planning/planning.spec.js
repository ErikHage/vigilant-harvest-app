import { test } from '../../helpers/ui/ui-test';

// The planning page plans the chosen year, so each test chooses a year of
// its own. It counts from the browser's today, in New York: the drivers work
// out what they should read from the real date there. Arranged plantings
// have a lead time of six weeks and a target planting date of May 1

test.describe('The planning page', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: spring', 'leap: no');
        await garden.hasPlanting('planting: seeds', 'plant: sungold', 'year: spring');
        await garden.hasPlanting('planting: starts', 'plant: sungold', 'year: spring', 'status: started');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');
    });

    // The test's years are thousands of years away, so the countdown and each
    // row's days until run to millions
    test('plans the year: the plantings to start, and those to plant out', async ({ planningPage }) => {
        await planningPage.open();
        await planningPage.checkIsShown();

        await planningPage.checkShowsPlantingDay('year: spring');
        await planningPage.checkListsToStart('planting: seeds');
        await planningPage.checkListsToPlant('planting: starts');
    });

    test('opens a planting from the plan', async ({ planningPage, plantingDetailsPage }) => {
        await planningPage.open();
        await planningPage.checkIsShown();
        await planningPage.checkListsToPlant('planting: starts');

        await planningPage.openPlanting('planting: starts');

        await plantingDetailsPage.checkIsShownFor('planting: starts');
    });
});

test.describe('The planning page, in a leap year', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage }) => {
        await garden.hasPlantingYear('year: leap', 'leap: yes');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: leap');
        await dashboardPage.checkYearIsChosen('year: leap');
    });

    // Today was today's day of the year, counted in the chosen year (backlog
    // A31): in a leap year, from March on, the day before. So this tells the
    // two apart only from March on, while today isn't in a leap year too
    test('shows today\'s date', async ({ planningPage }) => {
        await planningPage.open();
        await planningPage.checkIsShown();

        await planningPage.checkShowsToday('year: leap');
    });
});
