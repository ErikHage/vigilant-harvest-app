import { test } from '../../helpers/ui/ui-test';

// Each test arranges its planting, created or started, in a year of its own,
// chosen, and reaches its details page from the plantings page

test.describe('A planting\'s details page', () => {
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

    const view = async (plantingsPage, plantingDetailsPage, alias) => {
        await plantingsPage.open();
        await plantingsPage.checkIsShown();
        await plantingsPage.viewPlanting(`planting: ${alias}`);
        await plantingDetailsPage.checkIsShownFor(`planting: ${alias}`);
    };

    // The history's first entry says the planting was created, and with what
    // name. It showed the planting's fields as JSON, as the service files its
    // creation (backlog B34)
    test('shows a new planting, the actions it allows, and its history', async ({
        garden, plantingsPage, plantingDetailsPage,
    }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring');

        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.checkShowsPlanting('planting: early');
        await plantingDetailsPage.checkOffersActions('actions: Comment, Start, Plant, Delete');
        await plantingDetailsPage.checkHistoryShows('planting: early');
    });

    // At 23:30 in New York it's already the next day in UTC. The dialog sends
    // the local day, YYYY-MM-DD, so the planting is sown on the day shown
    test('starts a planting, sown on the day the dialog shows, in a New York evening', async ({
        garden, browserClock, plantingsPage, plantingDetailsPage,
    }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring');
        await browserClock.setTo('time: 2026-07-01T23:30:00-04:00');
        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.startPlanting('planting: early', 'count: 6');

        await plantingDetailsPage.checkIsShownFor('planting: early');
        await plantingDetailsPage.checkShowsPlanting('planting: early');
        await plantingDetailsPage.checkOffersActions('actions: Comment, Split, Plant, Retire');
    });

    // Four of the six sown are planted out, so the service splits the other two
    // off as a started planting of their own, "<name>(2 Remaining)"
    test('plants a started planting in a plot, and keeps the rest started', async ({
        garden, plantingsPage, plantingDetailsPage,
    }) => {
        await garden.hasPlot('plot: bed');
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: started');
        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.plantPlanting('planting: early', 'plot: bed', 'count: 4');

        await plantingDetailsPage.checkIsShownFor('planting: early');
        await plantingDetailsPage.checkShowsPlanting('planting: early');
        await plantingDetailsPage.checkOffersActions('actions: Comment, Retire');
        await plantingsPage.open();
        await plantingsPage.checkPlantingFound('planting: early');
        await plantingsPage.checkPlantingFound('planting: early-remainder');
    });

    test('plants a planting only once a plot is chosen', async ({ garden, plantingsPage, plantingDetailsPage }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: started');
        await view(plantingsPage, plantingDetailsPage, 'early');
        await plantingDetailsPage.startPlantingWithNoPlot('planting: early', 'count: 6');

        await plantingDetailsPage.checkPlantNeedsAPlot();
    });

    test('splits a started planting into new ones, which keep the rest', async ({
        garden, plantingsPage, plantingDetailsPage,
    }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: started');
        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.splitPlanting('planting: early', 'split: left', 'count: 2', 'split: right', 'count: 3');

        await plantingsPage.checkIsShown();
        await plantingsPage.checkPlantingFound('planting: left');
        await plantingsPage.checkPlantingFound('planting: right');
        await plantingsPage.checkPlantingFound('planting: early');
    });

    test('splits a planting only once there\'s a split', async ({ garden, plantingsPage, plantingDetailsPage }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: started');
        await view(plantingsPage, plantingDetailsPage, 'early');
        await plantingDetailsPage.openSplitDialog();

        await plantingDetailsPage.checkSplitNeedsASplit();
    });

    test('retires a planting, after which only a comment is offered', async ({
        garden, plantingsPage, plantingDetailsPage,
    }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: started');
        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.retirePlanting('planting: early');

        await plantingDetailsPage.checkIsShownFor('planting: early');
        await plantingDetailsPage.checkOffersActions('actions: Comment');
    });

    test('deletes a new planting, and goes back to the year\'s plantings', async ({
        garden, plantingsPage, plantingDetailsPage,
    }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring');
        await garden.hasPlanting('planting: late', 'plant: sungold', 'year: spring');
        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.deletePlanting('planting: early');

        await plantingsPage.checkIsShown();
        await plantingsPage.checkPlantingFound('planting: late');
        await plantingsPage.checkPlantingNotListed('planting: early');
    });

    test('adds a comment to the history', async ({ garden, plantingsPage, plantingDetailsPage }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring');
        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.commentOn('planting: early');

        await plantingDetailsPage.checkHistoryShows('planting: early');
    });

    test('saves a new name, behind the lock', async ({ garden, plantingsPage, plantingDetailsPage }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring');
        await view(plantingsPage, plantingDetailsPage, 'early');

        await plantingDetailsPage.renamePlanting('planting: early');

        await plantingDetailsPage.checkIsShownFor('planting: early');
        await plantingDetailsPage.checkShowsPlanting('planting: early');
        // the history's entry once showed the update as JSON (backlog B34)
        await plantingDetailsPage.checkHistoryShowsRename('planting: early');
    });

    // The tab renders before the page has copied the planting, so the picker
    // is created with no date: it opens on the planting's date (backlog A21)
    test('keeps the target date when its picker is confirmed without a pick', async ({
        garden, plantingsPage, plantingDetailsPage,
    }) => {
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring');
        await view(plantingsPage, plantingDetailsPage, 'early');
        await plantingDetailsPage.checkShowsPlanting('planting: early');

        await plantingDetailsPage.checkTargetDateKeptByItsPicker('planting: early');
    });

    // It used to throw after saying so, copying the planting it didn't get
    // (backlog A25)
    test('says when a planting doesn\'t exist', async ({ plantingDetailsPage }) => {
        await plantingDetailsPage.openUnknown();

        await plantingDetailsPage.checkSaysThePlantingWasNotFound();
    });
});
