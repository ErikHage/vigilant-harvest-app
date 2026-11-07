import { expectHidden, expectText, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

/** The plots page, and its add dialog, as Playwright sees them. */
export function createPlotsPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    // The table lists every plot, unpaged, in a scrolling box
    const rowOf = name => main.getByRole('row')
        .filter({ has: page.getByRole('cell', { name, exact: true }) });

    return {
        ...createRoutedPageDriver(page, {
            name: 'the plots page',
            path: 'dashboard/plots',
            marker: main => main.getByText('Manage Plots', { exact: true }),
        }),

        /** Adds a plot through the Add dialog, then waits for the dialog to close. */
        async addPlot({ friendlyName, lengthInInches, widthInInches, plotType }) {
            const what = `adding the plot ${friendlyName}`;

            await main.getByRole('button', { name: 'Add' }).click();
            await expectVisible(dialog.getByText('Add Plot'), what);
            await dialog.getByRole('textbox', { name: 'Name' }).fill(friendlyName);
            await dialog.getByRole('spinbutton', { name: 'Length (inches)' }).fill(String(lengthInInches));
            await dialog.getByRole('spinbutton', { name: 'Width (inches)' }).fill(String(widthInInches));
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Plot Type' }), plotType);
            await dialog.getByRole('button', { name: 'Create' }).click();
            await expectHidden(dialog, what);
        },

        /**
         * The plot is listed, with its sizes, type and whether it's active, as
         * `Y` or `N`.
         */
        async listsPlot({ friendlyName, lengthInInches, widthInInches, plotType }, active) {
            const what = `listing the plot ${friendlyName}`;
            const row = rowOf(friendlyName);

            await expectVisible(row, what);
            await expectText(row.getByRole('cell'), [
                friendlyName, String(lengthInInches), String(widthInInches), plotType, active ? 'Y' : 'N', /.*/,
            ], what);
        },
    };
}
