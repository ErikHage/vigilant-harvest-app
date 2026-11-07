import { expectEnabled, expectHidden, expectText, expectVisible } from './assertions';
import { pageAlertSays } from './page-alert';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

/** The plants page, and its Add dialog, as Playwright sees them. */
export function createPlantsPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const search = main.getByRole('textbox', { name: 'Search...' });
    const create = dialog.getByRole('button', { name: 'Create' });
    // The table lists every plant, unpaged, in a scrolling box
    const rows = main.getByRole('table').getByRole('row').filter({ has: page.getByRole('cell') });
    const rowOf = name => rows.filter({ has: page.getByRole('cell', { name, exact: true }) });
    // Under the table: "<shown> of <all> plants"
    const count = main.getByText(/^\d+ of \d+ plants$/);

    // The row's view and edit icons are buttons named only by their glyph, so
    // they're found by their icon's class
    async function clickIcon(name, icon, what) {
        await search.fill(name);
        const row = rowOf(name);
        await expectVisible(row, what);
        await row.locator(`.${icon}`).click();
    }

    return {
        ...createRoutedPageDriver(page, {
            name: 'the plants page',
            path: 'dashboard/plants',
            marker: main => main.locator('.page-title', { hasText: /^Manage Plants$/ }),
        }),

        async openAddDialog() {
            await main.getByRole('button', { name: 'Add' }).click();
            await expectVisible(dialog.getByText('Add Plant', { exact: true }), 'opening the Add Plant dialog');
        },

        /** Pinned (A16): Create is offered before anything is entered. */
        async offersCreateWithNothingEntered() {
            await expectEnabled(create, 'the Add Plant dialog, before anything is entered');
        },

        /** Clicks Create, and waits for the dialog to close, as it does whatever the service says. */
        async create() {
            await create.click();
            await expectHidden(dialog, 'creating a plant');
        },

        /** Adds a plant through the Add dialog, with what it asks for, then waits for it to close. */
        async addPlant({ friendlyName, categoryName, subcategoryName, lifespanType, harvesting, description }) {
            const select = name => dialog.getByRole('combobox', { name, exact: true });

            await this.openAddDialog();
            await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill(friendlyName);
            await chooseOption(page, select('Category'), categoryName);
            await chooseOption(page, select('Subcategory'), subcategoryName);
            await chooseOption(page, select('Lifespan Type'), lifespanType);
            await chooseOption(page, select('Default Harvest Type'), harvesting.defaultHarvestType);
            await dialog.getByRole('textbox', { name: 'Description', exact: true }).fill(description);
            await this.create();
        },

        /**
         * Searching for `text` shows the plant, with its category and
         * subcategory, and nothing else.
         */
        async findsPlantBy({ friendlyName, categoryName, subcategoryName }, text) {
            const what = `searching the plants for "${text}"`;

            await search.fill(text);
            await expectText(rows.getByRole('cell'), [friendlyName, categoryName, subcategoryName, /.*/], what);
            await expectText(count, /^1 of \d+ plants$/, what);
        },

        /** Opens the plant's details page, by its row's magnifier. */
        async viewPlant({ friendlyName }) {
            await clickIcon(friendlyName, 'mdi-magnify', `viewing the plant ${friendlyName}`);
        },

        /** Opens the plant's edit page, by its row's pencil. */
        async editPlant({ friendlyName }) {
            await clickIcon(friendlyName, 'mdi-pencil', `editing the plant ${friendlyName}`);
        },

        /**
         * Pinned (A7): the alert says only that saving failed, not the
         * service's reason.
         */
        async alertSaysOnlyThatItFailed() {
            await pageAlertSays(page, 'error upserting plant', 'the plants page, after the service refused a plant');
        },
    };
}
