import { test } from '../../helpers/ui/ui-test';

test.describe('Breadcrumbs', () => {
    test.beforeEach(async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test("lead from the page's section to the page", async ({ dashboardPage, plantsPage }) => {
        await dashboardPage.nav.goTo('page: plants');
        await plantsPage.checkIsShown();

        await plantsPage.breadcrumbs.checkLeadsToPage('section: Garden', 'page: Plants');
    });

    test.describe('on a plant', () => {
        test.beforeEach(async ({ garden, plantsPage, plantDetailsPage }) => {
            await garden.hasCategory('category: tomatoes');
            await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
            await garden.hasPlant('plant: sungold', 'subcategory: cherry');
            await plantsPage.open();
            await plantsPage.checkIsShown();
            await plantsPage.viewPlant('plant: sungold');
            await plantDetailsPage.checkIsShownFor('plant: sungold');
        });

        test('lead from Garden and Plants to the plant', async ({ plantDetailsPage }) => {
            await plantDetailsPage.breadcrumbs.checkLeadsToPlant('plant: sungold');
        });

        test('return to the plant list', async ({ plantDetailsPage, plantsPage }) => {
            await plantDetailsPage.breadcrumbs.goTo('crumb: Plants');

            await plantsPage.checkIsShown();
        });
    });

    test.describe('on a phone', () => {
        // Below Vuetify's md breakpoint (960px), where the planting year,
        // centred over the toolbar, leaves no room for even the last crumb
        test.use({ viewport: { width: 390, height: 844 } });

        test('are left out', async ({ garden, plantsPage, plantDetailsPage }) => {
            await garden.hasCategory('category: tomatoes');
            await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
            await garden.hasPlant('plant: sungold', 'subcategory: cherry');
            await plantsPage.open();
            await plantsPage.checkIsShown();
            await plantsPage.viewPlant('plant: sungold');
            await plantDetailsPage.checkIsShownFor('plant: sungold');

            await plantDetailsPage.breadcrumbs.checkAreAbsent();
        });
    });
});
