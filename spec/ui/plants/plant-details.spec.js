import { test } from '../../helpers/ui/ui-test';

test.describe('A plant\'s details page', () => {
    test.beforeEach(async ({ loginPage, dashboardPage, garden }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasSchedule('schedule: feeding');
    });

    // A yes or no in words, and each measure with its unit. They were raw: a
    // climber's "true", a depth with no unit (backlog B22)
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

    // It showed only the headers (backlog B22)
    test('says when the plant has no schedules', async ({ garden, plantsPage, plantDetailsPage }) => {
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await plantsPage.open();
        await plantsPage.checkIsShown();

        await plantsPage.viewPlant('plant: sungold');

        await plantDetailsPage.checkIsShownFor('plant: sungold');
        await plantDetailsPage.checkListsNoSchedules();
    });
});
