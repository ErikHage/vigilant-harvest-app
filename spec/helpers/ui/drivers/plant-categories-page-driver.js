import { expectDisabled, expectHidden, expectText, expectVisible } from './assertions';
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

        /** With a name of spaces typed, the add dialog withholds Create or Add. */
        async withholdsConfirmForANameOfSpaces() {
            await expectDisabled(confirm, 'the add dialog, with a name of spaces typed');
        },

        /** Clicks Create or Add, and nothing more: a refused save keeps the dialog open. */
        async pressConfirm() {
            await confirm.click();
        },

        /** Clicks it, and waits for the dialog to close, as a save that works does. */
        async confirm() {
            await this.pressConfirm();
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
    };
}
