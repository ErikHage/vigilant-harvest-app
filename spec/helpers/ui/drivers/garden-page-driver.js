import { expectCount, expectEnabled, expectHidden, expectText, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

// A harvest's quantity as the page shows it: the number, then the type
const harvestShown = (quantity, harvestType) => `${quantity} ${harvestType}`;

/**
 * The garden page: a card per plot with planted plantings in the chosen
 * year, and the two dialogs that enter harvests, as Playwright sees them.
 */
export function createGardenPageDriver(page, callControl) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    // The entry dialog may still be fading out as the confirm dialog opens
    const confirmDialog = dialog.filter({ has: page.getByText(/^Confirm Harvests \[/) });
    const confirm = confirmDialog.getByRole('button', { name: 'Confirm' });
    const plotCard = plotName => main.locator('.v-card').filter({
        has: page.locator('h4', { hasText: new RegExp(`^${plotName}$`) }),
    });

    return {
        ...createRoutedPageDriver(page, {
            name: 'the garden page',
            path: 'dashboard/garden',
            marker: main => main.locator('.page-title', { hasText: /^Garden Overview$/ }),
        }),

        /**
         * The planting's plot has a card, which shows the planting, its plant,
         * how many were planted out, and what's been harvested, if anything.
         */
        async showsPlanting({ plotName, name, plantName, numberTransplanted, harvested, harvestType }) {
            const what = `the garden's card for ${plotName}`;
            const card = plotCard(plotName);

            await expectVisible(card, what);
            await expectText(card.locator('.planting-names'), [new RegExp(`${name}\\s*${plantName}`)], what);
            await expectText(card.locator('.leaf-chip'), [new RegExp(`^\\s*${numberTransplanted}\\s*\\S*\\s*$`)], what);
            if (harvested > 0) {
                await expectText(card.locator('.harvest-chips .v-chip'),
                    [new RegExp(`^\\s*${harvestShown(harvested, harvestType)}\\s*\\S*\\s*$`)], what);
            } else {
                // One empty basket, and no quantity
                await expectCount(card.locator('.harvest-chips .v-chip'), 1, what);
                await expectCount(card.locator('.harvest-chips .mdi-basket'), 1, what);
            }
        },

        /**
         * Enters `quantity` for the planting, in its plot, through Add Harvests,
         * with the type the dialog offers first, its plant's default, then
         * saves, and checks the confirm dialog shows it. Doesn't confirm.
         * Returns the harvest date the dialog shows, as `toDateString()`.
         */
        async enterHarvest({ plotName, name, harvestType }, quantity) {
            const what = `entering a harvest of ${name}`;

            await main.getByRole('button', { name: 'Add Harvests' }).click();
            await expectVisible(dialog.getByText('Add Harvests', { exact: true }), what);
            const date = (await dialog.locator('.v-card-title .headline').last().textContent()).trim();
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Select Plot' }), plotName);
            const row = dialog.locator('.harvest-row', { hasText: name });
            await expectText(row.locator('.v-select__selection-text'), harvestType, what);
            await row.getByRole('spinbutton', { name: 'Quantity' }).fill(String(quantity));
            await dialog.getByRole('button', { name: 'Save' }).click();
            await expectText(confirmDialog.locator('.headline'), `Confirm Harvests [${date}]`, what);
            await expectText(confirmDialog.locator('.v-chip'), [`+${harvestShown(quantity, harvestType)}`], what);
            return date;
        },

        /** Confirms the harvests, and waits for the dialog to close. */
        async confirmHarvests() {
            await confirm.click();
            await expectHidden(confirmDialog, 'confirming the harvests');
        },

        /** Confirms the harvests, with the service's answer held until `confirmAgainAndLetTheSaveGo`. */
        async confirmWhileTheSaveIsHeld() {
            await callControl.hold('PUT', /^\/harvests$/);
            await confirm.click();
        },

        /** Pinned (A27): while the save is held, Confirm is still offered. */
        async offersConfirmWhileSaving() {
            await expectEnabled(confirm, 'the confirm dialog, while the harvests are saving');
        },

        /** Presses Confirm again, then lets the held saves go, and waits for the dialog to close. */
        async confirmAgainAndLetTheSaveGo() {
            await confirm.click();
            callControl.release();
            await expectHidden(confirmDialog, 'confirming the harvests again');
        },

        /** Pinned (A27): the planting's harvest shows twice what was entered, saved once per press. */
        async harvestFiledTwice({ plotName, harvested, harvestType }) {
            await expectText(plotCard(plotName).locator('.harvest-chips .v-chip'),
                [new RegExp(`^\\s*${harvestShown(harvested * 2, harvestType)}\\s*\\S*\\s*$`)],
                'the harvest, after Confirm was pressed twice');
        },
    };
}
