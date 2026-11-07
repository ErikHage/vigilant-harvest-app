import { expectEnabled,expectHidden, expectText, expectVisible } from './assertions';
import { pageAlertSays } from './page-alert';
import { createRoutedPageDriver } from './routed-page-driver';

/** The plant categories page, and its two add dialogs, as Playwright sees them. */
export function createPlantCategoriesPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const filter = main.getByRole('textbox', { name: 'Filter categories' });
    const rows = main.getByRole('table').getByRole('row').filter({ has: page.getByRole('cell') });
    const rowOf = categoryName => rows.filter({ has: page.getByRole('cell', { name: categoryName, exact: true }) });
    // Under the title: "<shown> of <all> categories". It shares a column with
    // the title, so getByText doesn't single it out; its span does
    const count = main.locator('span', { hasText: /^\s*\d+ of \d+ categories\s*$/ });
    // Create, in the category dialog; Add, in the subcategory one
    const confirm = dialog.getByRole('button', { name: /^(Create|Add)$/ });

    return {
        ...createRoutedPageDriver(page, {
            name: 'the plant categories page',
            path: 'dashboard/categories',
            marker: main => main.locator('.page-title', { hasText: /^Plant Categories$/ }),
        }),

        /** Opens the Add Category dialog, and types `name`. */
        async startAddingCategory(name) {
            await main.getByRole('button', { name: 'Add Category' }).click();
            await expectVisible(dialog.getByText('Add Category', { exact: true }), 'opening the Add Category dialog');
            await dialog.getByRole('textbox', { name: 'Category Name' }).fill(name);
        },

        /**
         * Opens the Add Subcategory dialog from the category's row, by its "+",
         * which has no name, and types `name`.
         */
        async startAddingSubcategory({ categoryName }, name) {
            const what = `adding a subcategory to ${categoryName}`;

            await filter.fill(categoryName);
            await rowOf(categoryName).getByRole('button').click();
            await expectText(dialog.getByRole('strong'), categoryName, what);
            await dialog.getByRole('textbox', { name: 'Subcategory Name' }).fill(name);
        },

        /** Pinned (A16): Create or Add is offered for a name of spaces only. */
        async offersConfirmForANameOfSpaces() {
            await expectEnabled(confirm, 'the add dialog, with a name of spaces typed');
        },

        /** Clicks Create or Add, and waits for the dialog to close, as it does whatever the service says. */
        async confirm() {
            await confirm.click();
            await expectHidden(dialog, 'confirming the add dialog');
        },

        /**
         * Filtering by `text` shows the category, with these subcategories, in
         * order, and no other category.
         */
        async findsCategoryBy({ categoryName }, subcategoryNames, text) {
            const what = `filtering the categories by "${text}"`;

            await filter.fill(text);
            await expectText(rows.getByRole('cell').first(), categoryName, what);
            await expectText(rows.locator('.v-chip'), subcategoryNames, what);
            // A RegExp is matched against the text as is, trailing space and all
            await expectText(count, /^\s*1 of \d+ categories\s*$/, what);
        },

        async alertSays(message) {
            await pageAlertSays(page, message, 'the plant categories page, after a failed save');
        },
    };
}
