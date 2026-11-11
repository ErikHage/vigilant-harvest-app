import { test } from '../../helpers/ui/ui-test';

// Schedules aren't tied to a year, and the list holds every schedule, so the
// tests check only the ones they name, and filter to them

test.describe('The activity schedules page', () => {
    test.beforeEach(async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test('creates a schedule through its dialog, and opens it', async ({
        activitySchedulesPage, activityScheduleDetailsPage,
    }) => {
        await activitySchedulesPage.open();
        await activitySchedulesPage.checkIsShown();

        await activitySchedulesPage.createSchedule('schedule: roses');
        await activitySchedulesPage.filter('schedule: roses');
        await activitySchedulesPage.checkListsOnly('schedule: roses');
        await activitySchedulesPage.openSchedule('schedule: roses');

        await activityScheduleDetailsPage.checkIsShownFor('schedule: roses');
        await activityScheduleDetailsPage.checkShowsSchedule('schedule: roses', 'items: 0');
        await activityScheduleDetailsPage.checkShowsNoItems();
    });

    // The filter matches the name and description run together (backlog B32,
    // tier B): the end of one and the start of the other find the schedule
    test('filters on a schedule\'s name and description run together', async ({ garden, activitySchedulesPage }) => {
        await garden.hasSchedule('schedule: roses');
        await garden.hasSchedule('schedule: lawn');
        await activitySchedulesPage.open();
        await activitySchedulesPage.checkIsShown();

        await activitySchedulesPage.filter('schedule: roses', 'by: both');

        await activitySchedulesPage.checkListsOnly('schedule: roses');
    });
});

test.describe('An activity schedule\'s details page', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage, activitySchedulesPage }) => {
        await garden.hasSchedule('schedule: roses');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await activitySchedulesPage.open();
        await activitySchedulesPage.checkIsShown();
        await activitySchedulesPage.filter('schedule: roses');
        await activitySchedulesPage.openSchedule('schedule: roses');
    });

    test('saves a new name and description', async ({ activityScheduleDetailsPage }) => {
        await activityScheduleDetailsPage.checkIsShownFor('schedule: roses');

        await activityScheduleDetailsPage.editSchedule('schedule: roses');

        await activityScheduleDetailsPage.checkShowsSchedule('schedule: roses', 'items: 0');
    });

    test('adds an item, and lists it', async ({ activityScheduleDetailsPage }) => {
        await activityScheduleDetailsPage.checkIsShownFor('schedule: roses');

        await activityScheduleDetailsPage.addItem('item: feed', 'schedule: roses');

        await activityScheduleDetailsPage.checkListsItem('item: feed');
        await activityScheduleDetailsPage.checkShowsSchedule('schedule: roses', 'items: 1');
    });

    test('adds an item only for an interval of at least 1', async ({ activityScheduleDetailsPage }) => {
        await activityScheduleDetailsPage.checkIsShownFor('schedule: roses');

        await activityScheduleDetailsPage.startAddingItemEvery('item: feed', 'schedule: roses', 'interval: -1');

        await activityScheduleDetailsPage.checkCreateNeedsAWholeInterval();
    });
});

test.describe('An activity schedule\'s items', () => {
    test.beforeEach(async ({ garden, loginPage, dashboardPage, activitySchedulesPage }) => {
        await garden.hasSchedule('schedule: roses');
        await garden.hasScheduleItem('item: feed', 'schedule: roses');
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await activitySchedulesPage.open();
        await activitySchedulesPage.checkIsShown();
        await activitySchedulesPage.filter('schedule: roses');
        await activitySchedulesPage.openSchedule('schedule: roses');
    });

    test('saves an edited item', async ({ activityScheduleDetailsPage }) => {
        await activityScheduleDetailsPage.checkListsItem('item: feed');

        await activityScheduleDetailsPage.editItem('item: feed');

        await activityScheduleDetailsPage.checkListsItem('item: feed');
    });

    // DocumentsCurrentBehavior: the edit dialog sends the item without its
    // schedule's id, and the page passes it on, so the update goes to
    // /activity-schedules/undefined/schedule-items/<id>; it works only
    // because the service ignores the schedule in that path (backlog A30).
    // Should send the update under the schedule shown
    test('sends an item\'s update under its schedule', async ({ activityScheduleDetailsPage }) => {
        await activityScheduleDetailsPage.checkListsItem('item: feed');

        await activityScheduleDetailsPage.editItem('item: feed');

        await activityScheduleDetailsPage.checkItemUpdateNamedItsSchedule();
    });

    test('deletes an item, once its deletion is confirmed', async ({ activityScheduleDetailsPage }) => {
        await activityScheduleDetailsPage.checkListsItem('item: feed');

        await activityScheduleDetailsPage.deleteItem('item: feed');

        await activityScheduleDetailsPage.checkShowsNoItems();
        await activityScheduleDetailsPage.checkShowsSchedule('schedule: roses', 'items: 0');
    });
});
