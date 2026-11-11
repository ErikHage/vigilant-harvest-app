import { test } from '../../helpers/ui/ui-test';

// The garden, the journal and the activity log all show the chosen year, so
// each test chooses a year of its own. The clock is fixed at noon in New York
// on July 1, 2026: the harvest and entry dialogs default to now, and journal
// and log entries are timestamps, 1971 to 2037, kept apart from their year

test.describe('The garden', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage, browserClock }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await garden.hasPlantingYear('year: spring');
        await garden.hasPlot('plot: bed');
        await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: planted', 'plot: bed');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');
        await browserClock.setTo('time: 2026-07-01T12:00:00-04:00');
    });

    test('shows each plot\'s planted plantings', async ({ gardenPage }) => {
        await gardenPage.open();
        await gardenPage.checkIsShown();

        await gardenPage.checkShowsPlanting('planting: early');
    });

    test('enters a harvest, of the plant\'s default type, and shows it', async ({ gardenPage }) => {
        await gardenPage.open();
        await gardenPage.checkIsShown();

        await gardenPage.enterHarvest('planting: early', 'quantity: 3');
        await gardenPage.confirmHarvests();

        await gardenPage.checkShowsPlanting('planting: early');
    });

    test('saves harvests once, however often Confirm is pressed', async ({ gardenPage }) => {
        await gardenPage.open();
        await gardenPage.checkIsShown();
        await gardenPage.enterHarvest('planting: early', 'quantity: 3');
        await gardenPage.confirmWhileTheSaveIsHeld();

        await gardenPage.checkConfirmWaitsForTheSave();
        await gardenPage.confirmAgain();

        await gardenPage.checkHarvestSavedOnce('planting: early');
    });
});

test.describe('The journal and activity log', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage, browserClock }) => {
        await garden.hasPlantingYear('year: spring');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await dashboardPage.chooseYear('year: spring');
        await dashboardPage.checkYearIsChosen('year: spring');
        await browserClock.setTo('time: 2026-07-01T12:00:00-04:00');
    });

    // The timeline runs newest first, and Next follows it, to the earlier day
    // (backlog B28, tier B)
    test('records a journal entry under its day, and steps back to an earlier one', async ({
        garden, journalPage,
    }) => {
        await garden.hasJournalEntry('entry: planted', 'year: spring', 'on: 2026-06-20');
        await journalPage.open();
        await journalPage.checkIsShown();

        await journalPage.recordEntry('entry: watered', 'year: spring');

        await journalPage.checkListsDaysOf('entry: watered, planted');
        await journalPage.checkShowsEntry('entry: watered');
        await journalPage.checkOffersPreviousAndNext('previous: no', 'next: yes');
        await journalPage.next();
        await journalPage.checkShowsEntry('entry: planted');
    });

    test('logs an activity, listed with its date, type, subtype and comments', async ({ activityLogPage }) => {
        await activityLogPage.open();
        await activityLogPage.checkIsShown();

        await activityLogPage.logActivity('entry: fed', 'year: spring');

        await activityLogPage.checkListsEntry('entry: fed');
    });

    test('logs an activity only once one is chosen', async ({ activityLogPage }) => {
        await activityLogPage.open();
        await activityLogPage.checkIsShown();
        await activityLogPage.openLogDialog();

        await activityLogPage.checkConfirmNeedsAnActivity();
    });
});
