import { expectDisabled, expectHidden, expectText, expectValue, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';

/** The page that adds a planting year, and its two date pickers, as Playwright sees them. */
export function createAddPlantingYearPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const create = main.getByRole('button', { name: 'Create New Planting Year' });
    // Each date is a row: its label, a calendar button with no name, and the
    // date picked, all <h3> but the button
    const dateRow = label => main.locator('h3', { hasText: new RegExp(`^${label}$`) }).locator('xpath=..');
    const carried = main.getByRole('table').getByRole('row');

    return {
        ...createRoutedPageDriver(page, {
            name: 'the add planting year page',
            path: 'dashboard/planting-years/add',
            marker: main => main.locator('.page-title', { hasText: /^Add Planting Year$/ }),
        }),

        /** The year it carries forward from, and the year it will add; neither can be changed. */
        async proposes(previous, next) {
            const what = 'the years the add page proposes';

            await expectValue(main.getByRole('spinbutton', { name: 'Previous Planting Year' }), String(previous), what);
            await expectValue(main.getByRole('spinbutton', { name: 'New Planting Year' }), String(next), what);
        },

        /**
         * Lists these plantings, by name, to carry forward, under its heading,
         * which says they're the planted ones. It said "not retired" (B17).
         */
        async carriesForward(names) {
            const what = 'the plantings the add page carries forward';

            await expectVisible(main.getByText('Plantings to carry forward (planted)', { exact: true }), what);
            await expectText(carried.locator('td:first-child'), names, what);
        },

        /**
         * Picks a date in the picker beside `label`, by its day, in the month
         * the picker opens on. Each day's button is named in full, "Tuesday,
         * April 15, 8228"; the picker shows a few of the months either side
         * too, so pick a day from 8 to 21, which only the month itself shows.
         */
        async pickDate(label, day) {
            const what = `picking the ${label}`;

            await dateRow(label).getByRole('button').click();
            await expectVisible(dialog.getByText(`Set ${label}`, { exact: true }), what);
            await dialog.getByRole('button', { name: new RegExp(`^(Today, )?\\w+, \\w+ ${day}, \\d+$`) }).click();
            await dialog.getByRole('button', { name: 'Confirm' }).click();
            await expectHidden(dialog, what);
        },

        /** The date picked beside `label`, as the page shows it, `YYYY-MM-DD`, once one is. */
        async dateShown(label) {
            const shown = dateRow(label).locator('h3').last();
            await expectText(shown, /^\d{4}-\d{2}-\d{2}$/, `the ${label} picked`);
            return (await shown.textContent()).trim();
        },

        /** With no dates picked, the add page withholds Create. */
        async withholdsCreateWithNoDates() {
            await expectDisabled(create, 'the add page, with no dates picked');
        },

        async create() {
            await create.click();
        },
    };
}
