import { expectCount, expectDisabled, expectHidden, expectText, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

// What the Qty column shows: the seeds sown once started, the seedlings
// planted once planted, and nothing otherwise
const quantityOf = ({ status, numberSown, numberTransplanted }) => ({
    STARTED: String(numberSown), PLANTED: String(numberTransplanted),
})[status] ?? '';

/** The plantings page, for the chosen year, and its Add dialog, as Playwright sees them. */
export function createPlantingsPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const search = main.getByRole('textbox', { name: 'Search...' });
    const create = dialog.getByRole('button', { name: 'Create' });
    const rows = main.getByRole('table').getByRole('row').filter({ has: page.getByRole('cell') });
    const rowOf = name => rows.filter({ has: page.getByRole('cell', { name, exact: true }) });
    // Under the table: "<shown> of <all> plantings"
    const count = main.getByText(/^\d+ of \d+ plantings$/);

    return {
        ...createRoutedPageDriver(page, {
            name: 'the plantings page',
            path: 'dashboard/plantings',
            marker: main => main.locator('.page-title', { hasText: /^Manage Plantings$/ }),
        }),

        async openAddDialog() {
            await main.getByRole('button', { name: 'Add' }).click();
            await expectVisible(dialog.getByText('Add Planting', { exact: true }), 'opening the Add Planting dialog');
        },

        /** Clicks Create, and nothing more: a refused save keeps the dialog open. */
        async pressCreate() {
            await create.click();
        },

        /** Clicks it, and waits for the dialog to close, as a save that works does. */
        async create() {
            await this.pressCreate();
            await expectHidden(dialog, 'creating a planting');
        },

        /** Adds a planting through the Add dialog, with what it asks for, then waits for it to close. */
        async addPlanting({ name, plantName, leadTimeWeeks, seedSource, lotNumber }) {
            await this.openAddDialog();
            await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Select Plant', exact: true }), plantName);
            await dialog.getByRole('spinbutton', { name: 'Indoor Sow Lead Time (weeks)' }).fill(String(leadTimeWeeks));
            await dialog.getByRole('textbox', { name: 'Seed Source', exact: true }).fill(seedSource);
            await dialog.getByRole('textbox', { name: 'Lot#', exact: true }).fill(lotNumber);
            await this.create();
        },

        /** With nothing entered, the Add Planting dialog withholds Create. */
        async withholdsCreateWithNothingEntered() {
            await expectDisabled(create, 'the Add Planting dialog, before anything is entered');
        },

        /**
         * Searching for the planting's name shows it, with its plant, quantity,
         * plot and status. A remainder's name holds its source's, so the search
         * may show that too.
         */
        async findsPlanting(planting) {
            const what = `searching the plantings for "${planting.name}"`;

            await search.fill(planting.name);
            await expectText(rowOf(planting.name).getByRole('cell'), [
                planting.name, planting.plantName, quantityOf(planting), planting.plotName ?? '', planting.status, /.*/,
            ], what);
            await expectText(count, /^\s*[1-9]\d* of \d+ plantings\s*$/, what);
        },

        /**
         * Searching for `name` shows nothing. The list must be loaded already:
         * check another planting is listed first.
         */
        async listsNoPlantingCalled(name) {
            await search.fill(name);
            await expectCount(rows, 0, `searching the plantings for "${name}"`);
        },

        /** Opens the planting's details page, by its row's magnifier, named only by its glyph. */
        async viewPlanting({ name }) {
            const what = `viewing the planting ${name}`;

            await search.fill(name);
            await expectVisible(rowOf(name), what);
            await rowOf(name).locator('.mdi-magnify').click();
        },
    };
}
