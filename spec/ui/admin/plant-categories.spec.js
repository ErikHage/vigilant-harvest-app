import { test } from '../../helpers/ui/ui-test';

test.describe('The plant categories page', () => {
    test.beforeEach(async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test('adds a category through its dialog', async ({ plantCategoriesPage }) => {
        await plantCategoriesPage.open();
        await plantCategoriesPage.checkIsShown();

        await plantCategoriesPage.addCategory('category: tomatoes');

        await plantCategoriesPage.checkCategoryFound('category: tomatoes');
    });

    test('adds a subcategory to a category, through the category\'s row', async ({ garden, plantCategoriesPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await plantCategoriesPage.open();
        await plantCategoriesPage.checkIsShown();

        await plantCategoriesPage.addSubcategory('subcategory: paste', 'category: tomatoes');

        await plantCategoriesPage.checkCategoryFound('category: tomatoes', 'subcategory: cherry, paste');
    });

    test('finds a category by one of its subcategories', async ({ garden, plantCategoriesPage }) => {
        await garden.hasCategory('category: tomatoes');
        await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
        await plantCategoriesPage.open();
        await plantCategoriesPage.checkIsShown();

        await plantCategoriesPage.checkCategoryFound('category: tomatoes', 'subcategory: cherry', 'by: subcategory');
    });

    test('offers Create for a category only once its name has something in it', async ({ plantCategoriesPage }) => {
        await plantCategoriesPage.open();
        await plantCategoriesPage.checkIsShown();
        await plantCategoriesPage.startAddingCategory('name: spaces');

        await plantCategoriesPage.checkConfirmNeedsAName();
    });

    test('offers Add for a subcategory only once its name has something in it', async ({
        garden, plantCategoriesPage,
    }) => {
        await garden.hasCategory('category: tomatoes');
        await plantCategoriesPage.open();
        await plantCategoriesPage.checkIsShown();
        await plantCategoriesPage.startAddingSubcategory('category: tomatoes', 'name: spaces');

        await plantCategoriesPage.checkConfirmNeedsAName();
    });
});
