import { test } from '../../helpers/ui/ui-test';

test.describe('A plant\'s edit page', () => {
    test.beforeEach(async ({ loginPage, dashboardPage, garden, plantsPage, plantEditPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry', 'tags: Cold Tolerant, Heirloom');
        // For the Manage Schedules dialog, which lists them as the page loads
        await garden.hasSchedule('schedule: feeding');
        await plantsPage.open();
        await plantsPage.checkIsShown();
        await plantsPage.editPlant('plant: sungold');
        await plantEditPage.checkIsShownFor('plant: sungold');
    });

    test('saves an edit, offering Update only once something has changed', async ({ plantEditPage }) => {
        await plantEditPage.checkShowsPlant('plant: sungold');
        await plantEditPage.checkUpdateOffered('offered: no');

        await plantEditPage.edit('plant: sungold');
        await plantEditPage.checkUpdateOffered('offered: yes');
        await plantEditPage.update();

        await plantEditPage.checkUpdateOffered('offered: no');
        await plantEditPage.reload();
        await plantEditPage.checkIsShownFor('plant: sungold');
        await plantEditPage.checkShowsPlant('plant: sungold');
    });

    test('puts back the saved values on Reset', async ({ plantEditPage }) => {
        await plantEditPage.typeUnsavedName('plant: sungold');
        await plantEditPage.checkUpdateOffered('offered: yes');

        await plantEditPage.reset();

        await plantEditPage.checkShowsPlant('plant: sungold');
        await plantEditPage.checkUpdateOffered('offered: no');
    });

    // Saving the schedules reloads the plant, but not into the form (backlog
    // A17)
    test('keeps an unsaved edit when the schedules are saved', async ({ plantEditPage }) => {
        await plantEditPage.typeUnsavedName('plant: sungold');

        await plantEditPage.assignSchedule('schedule: feeding');

        await plantEditPage.checkListsSchedules('schedule: feeding');
        await plantEditPage.checkUnsavedNameKept('plant: sungold');
    });

    // DocumentsCurrentBehavior: the tags dialog offers four fixed tags, and
    // toggling one drops the plant's others, here Heirloom (backlog A18).
    // Should keep the plant's own tags, and offer them as chips too
    test('keeps the plant\'s own tags when one is toggled', async ({ plantEditPage }) => {
        await plantEditPage.checkShowsTags('tags: Cold Tolerant, Heirloom');

        await plantEditPage.toggleTag('tag: Determinate');

        await plantEditPage.checkTagsKeptAfterToggling('plant: sungold', 'tag: Determinate');
    });
});
