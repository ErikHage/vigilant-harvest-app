import { expectEnabled, expectHidden, expectText, expectVisible } from './assertions';
import { pageAlertSays, saveIsRejectedSaying } from './page-alert';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

/** The plots page, and its add and edit dialog, as Playwright sees them. */
export function createPlotsPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const search = main.getByRole('textbox', { name: 'Search...' });
    const create = dialog.getByRole('button', { name: 'Create' });
    // The table lists every plot, unpaged, in a scrolling box
    const rows = main.getByRole('table').getByRole('row').filter({ has: page.getByRole('cell') });
    const rowOf = name => rows.filter({ has: page.getByRole('cell', { name, exact: true }) });
    // Under the table: "<shown> of <all> plots"
    const count = main.getByText(/^\d+ of \d+ plots$/);

    // The same dialog adds and edits, titled for which
    async function fillIn(title, { friendlyName, lengthInInches, widthInInches, plotType }) {
        await expectVisible(dialog.getByText(title, { exact: true }), `the ${title} dialog`);
        await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill(friendlyName);
        await dialog.getByRole('spinbutton', { name: 'Length (inches)' }).fill(String(lengthInInches));
        await dialog.getByRole('spinbutton', { name: 'Width (inches)' }).fill(String(widthInInches));
        await chooseOption(page, dialog.getByRole('combobox', { name: 'Plot Type' }), plotType);
    }

    return {
        ...createRoutedPageDriver(page, {
            name: 'the plots page',
            path: 'dashboard/plots',
            marker: main => main.getByText('Manage Plots', { exact: true }),
        }),

        async openAddDialog() {
            await main.getByRole('button', { name: 'Add' }).click();
            await expectVisible(dialog.getByText('Add Plot', { exact: true }), 'opening the Add Plot dialog');
        },

        /** Clicks Create, and waits for the dialog to close, as it does whatever the service says. */
        /** Clicks Create, and nothing more: a refused save keeps the dialog open. */
        async pressCreate() {
            await create.click();
        },

        async create() {
            await this.pressCreate();
            await expectHidden(dialog, 'creating a plot');
        },

        /** Adds a plot through the Add dialog, then waits for the dialog to close. */
        async addPlot(plot) {
            await this.openAddDialog();
            await fillIn('Add Plot', plot);
            await this.create();
        },

        /**
         * Opens the plot's Edit dialog by its row's pencil, which is named only
         * by its glyph, gives it `edited`'s details, and clicks Update.
         */
        async editPlot(formerName, edited) {
            const what = `editing the plot ${formerName}`;

            await search.fill(formerName);
            await expectVisible(rowOf(formerName), what);
            await rowOf(formerName).locator('.mdi-pencil').click();
            await fillIn('Edit Plot', edited);
            await dialog.getByRole('button', { name: 'Update' }).click();
            await expectHidden(dialog, what);
        },

        /** Pinned (A16): Create is offered before anything is entered. */
        async offersCreateWithNothingEntered() {
            await expectEnabled(create, 'the Add Plot dialog, before anything is entered');
        },

        /**
         * The plot is listed, with its sizes, type and whether it's active, as
         * `Y` or `N`.
         */
        async listsPlot({ friendlyName, lengthInInches, widthInInches, plotType }, active) {
            const what = `listing the plot ${friendlyName}`;
            const row = rowOf(friendlyName);

            await search.fill(friendlyName);
            await expectVisible(row, what);
            await expectText(row.getByRole('cell'), [
                friendlyName, String(lengthInInches), String(widthInInches), plotType, active ? 'Y' : 'N', /.*/,
            ], what);
        },

        /** Searching for the plot's name shows it, and no other. */
        async findsPlot({ friendlyName }) {
            const what = `searching the plots for "${friendlyName}"`;

            await search.fill(friendlyName);
            await expectText(rows.getByRole('cell').first(), friendlyName, what);
            await expectText(count, /^\s*1 of \d+ plots\s*$/, what);
        },

        async alertSays(message) {
            await pageAlertSays(page, message, 'the plots page, after a failed save');
        },

        /** The dialog stays open, saying why the service refused the save, as does the page's alert. */
        async createIsRejectedSaying(message) {
            await saveIsRejectedSaying(page, message, 'the plots page, after the service refused a save');
        },
    };
}
