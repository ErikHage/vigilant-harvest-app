import { test } from '../../helpers/ui/ui-test';

// A plant needs a subcategory, so each test that has one arranges its own
// category and subcategory through the API

test.describe('The plants page', () => {
    test.beforeEach(async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test('finds a plant by its name, its category or its subcategory', async ({ garden, plantsPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');

        await plantsPage.open();
        await plantsPage.checkIsShown();

        await plantsPage.checkPlantFound('plant: sungold');
        await plantsPage.checkPlantFound('plant: sungold', 'by: category');
        await plantsPage.checkPlantFound('plant: sungold', 'by: subcategory');
    });

    test('adds a plant through its dialog, with what the dialog asks for', async ({
        garden, plantsPage, plantDetailsPage,
    }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await plantsPage.open();
        await plantsPage.checkIsShown();

        await plantsPage.addPlant('plant: sungold', 'subcategory: cherry');

        await plantsPage.checkPlantFound('plant: sungold');
        await plantsPage.viewPlant('plant: sungold');
        await plantDetailsPage.checkIsShownFor('plant: sungold');
        await plantDetailsPage.checkShowsPlant('plant: sungold');
    });

    test('waits for the required fields', async ({ plantsPage }) => {
        await plantsPage.open();
        await plantsPage.checkIsShown();
        await plantsPage.openAddDialog();

        await plantsPage.checkCreateNeedsTheRequiredFields();
    });

    // The service refuses a second plant of the same name: the dialog stays
    // open, with what was entered, and says why
    test('says why a plant was refused, keeping the dialog open', async ({ garden, plantsPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await garden.hasPlant('plant: sungold', 'subcategory: cherry');
        await plantsPage.open();
        await plantsPage.checkIsShown();

        await plantsPage.addPlantWithTheNameOf('plant: sungold');

        await plantsPage.checkCreateIsRejected('message: Friendly name already in use');
    });
});
