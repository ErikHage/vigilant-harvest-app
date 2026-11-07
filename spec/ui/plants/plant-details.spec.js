import { test } from '../../helpers/ui/ui-test';

test.describe('A plant\'s details page', () => {
    test.beforeEach(async ({ loginPage, dashboardPage, garden }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasSchedule('schedule: feeding');
    });

    // The tabs show values raw: a climber's "true", a depth with no unit
    // (backlog B22, tier B)
    test('shows each of the plant\'s fields, tab by tab, and its schedules', async ({
        garden, plantsPage, plantDetailsPage,
    }) => {
        await garden.hasPlant('plant: sungold', 'subcategory: cherry', 'tags: Cold Tolerant, Heirloom',
            'schedule: feeding');
        await plantsPage.open();
        await plantsPage.checkIsShown();

        await plantsPage.viewPlant('plant: sungold');

        await plantDetailsPage.checkIsShownFor('plant: sungold');
        await plantDetailsPage.checkShowsPlant('plant: sungold');
        await plantDetailsPage.checkListsSchedules('schedule: feeding');
    });
});
