import { expectCount, expectDisabled, expectEventually, expectHidden, expectText, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { escaped } from './urls';
import { status } from '../support/status-codes';

// A harvest's delete
const harvestDelete = /\/harvests\/[0-9a-f-]{36}$/;

// The page loads the year's harvests, then its plantings, last
const harvestsSearch = { method: 'GET', path: /\/harvests\/search$/, status: status.ok };
const plantingsList = { method: 'GET', path: /\/plantings$/, status: status.ok };

// A harvest's quantity as the page shows it: the number, then the type
const harvestShown = (quantity, harvestType) => `${quantity} ${harvestType}`;
const exactly = text => new RegExp(`^\\s*${escaped(text)}\\s*$`);

/**
 * The harvests page: a timeline of the chosen year's harvest days, newest
 * first, and a day's harvests by plant, with the dialog that edits them.
 */
export function createHarvestsPageDriver(page, serviceCalls) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const timeline = main.locator('.timeline-entry');
    const plantGroup = plantName => main.locator('.chip-row').filter({
        has: page.locator('.plant-name', { hasText: exactly(plantName) }),
    });

    async function changeQuantity(name, quantity, what) {
        await main.getByRole('button', { name: 'Edit' }).click();
        await expectVisible(dialog.getByText('Edit Harvests', { exact: true }), what);
        await dialog.locator('.harvest-row', { hasText: name }).getByRole('spinbutton', { name: 'Quantity' })
            .fill(String(quantity));
    }

    return {
        ...createRoutedPageDriver(page, {
            name: 'the harvests page',
            path: 'dashboard/harvests',
            marker: main => main.locator('.page-title', { hasText: /^Review Harvests$/ }),
        }),

        /** The timeline lists these, in order: days, `YYYY-MM-DD`, and `...` where it marks a gap. */
        async listsDays(days) {
            await expectText(timeline, days, 'the harvests timeline');
        },

        /** `day`, `YYYY-MM-DD`, is the one chosen in the timeline, and the one shown. */
        async showsDay(day) {
            const what = `the harvests of ${day}`;

            await expectText(main.locator('.timeline-entry.selected'), day, what);
            await expectText(main.locator('.content-column h3'), day, what);
        },

        async chooseDay(day) {
            await timeline.filter({ hasText: exactly(day) }).click();
        },

        /**
         * The day shown has the planting's harvest of `quantity`: under its
         * plant, a total of that, and, opened up, the planting with it.
         */
        async showsHarvest({ name, plantName, harvestType }, quantity) {
            const what = `${name}'s harvest on the day shown`;
            const group = plantGroup(plantName);

            await expectText(group.locator('.v-chip'), [harvestShown(quantity, harvestType)], what);
            if (await group.locator('.breakdown-row').count() === 0) {
                await group.locator('.plant-name').click();
            }
            await expectText(group.locator('.breakdown-row'), [`• ${name} – ${harvestShown(quantity, harvestType)}`], what);
        },

        /** Edits the planting's harvest on the day shown to `quantity`, and updates. */
        async editHarvest({ name }, quantity) {
            const what = `editing ${name}'s harvest`;

            await changeQuantity(name, quantity, what);
            await dialog.getByRole('button', { name: 'Update' }).click();
            await expectHidden(dialog, what);
        },

        /**
         * Removes the planting's harvest on the day shown, and updates: the
         * service is asked to delete it, and does. The app had no delete (B30).
         */
        async removeHarvest({ name }) {
            const what = `removing ${name}'s harvest`;

            await main.getByRole('button', { name: 'Edit' }).click();
            await expectVisible(dialog.getByText('Edit Harvests', { exact: true }), what);
            await dialog.locator('.harvest-row', { hasText: name }).getByRole('button', { name: 'Remove' }).click();
            await expectVisible(dialog.getByText('Removed on Update', { exact: true }), what);
            await dialog.getByRole('button', { name: 'Update' }).click();
            await expectHidden(dialog, what);
            await expectEventually(() => serviceCalls.wereAnswered('DELETE', harvestDelete, status.ok),
                'the harvest\'s delete to be sent, and answered 200', what);
        },

        /** As `editHarvest`, but leaves the dialog to the step after: Update is offered whatever the quantity. */
        async startEditing({ name }, quantity) {
            await changeQuantity(name, quantity, `editing ${name}'s harvest to ${quantity}`);
        },

        /** The open edit dialog withholds Update, as for a quantity of nothing. */
        async withholdsUpdate() {
            await expectDisabled(dialog.getByRole('button', { name: 'Update' }), 'the edit dialog, with that quantity');
        },

        /**
         * With no harvest days, the page says the year has none, by its
         * number, and its timeline is empty. It asked for a day to be chosen
         * (B31). The page shows neither while it loads, but this waits for the
         * load's last call anyway, and two frames for the page to take it in.
         */
        async saysThereAreNone({ plantingYear }) {
            const what = 'the harvests page, with no harvests';

            await expectEventually(() => serviceCalls.wereAnsweredAfter(harvestsSearch, plantingsList),
                'the page to load the harvests, then the plantings', what);
            await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));

            await expectText(main.locator('.content-column'), `No harvests in ${plantingYear}.`, what);
            await expectCount(timeline, 0, what);
        },
    };
}
