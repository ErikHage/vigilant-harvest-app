import {
    expectDisabled, expectEnabled, expectEventually, expectHidden, expectText, expectUrl, expectValue, expectVisible,
} from './assertions';
import { pageAlertSays } from './page-alert';
import { chooseOption } from './select';
import { escaped, openPath, urlOf } from './urls';

const detailsUrl = new RegExp(`^${escaped(urlOf('dashboard/plantings/'))}[0-9a-f-]{36}/details$`);

// The dialogs show their date as `Date.toDateString()`, "Wed Jul 01 2026";
// the details tab as `YYYY-MM-DD`. Both are the browser's local day
function asDay(dateString) {
    const date = new Date(dateString);
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A planting's details page, its action dialogs and its two tabs, as Playwright sees them. */
export function createPlantingDetailsPageDriver(page, pageErrors) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Confirm' });
    const statusChip = main.locator('.v-chip--size-large');
    // The card of actions: a button each, then the edit lock and Update
    const actionsCard = main.locator('.v-card').filter({ has: page.getByRole('button', { name: 'Update' }) });
    const field = name => main.getByRole('textbox', { name, exact: true });
    const numberField = name => main.getByRole('spinbutton', { name, exact: true });
    // A select's or autocomplete's chosen option is shown beside its input
    const chosenIn = name => main.getByRole('combobox', { name, exact: true }).locator('xpath=ancestor::div[contains(@class, "v-field")][1]')
        .locator('[class*="__selection-text"]');
    // Each date is an <h3> after its label and its calendar button
    const dateAfter = label => main.locator('p', { hasText: new RegExp(`^${label}$`) }).locator('xpath=..').locator('h3');
    const calendarAfter = label => main.locator('p', { hasText: new RegExp(`^${label}$`) }).locator('xpath=..')
        .getByRole('button');

    async function openAction(button, title) {
        await actionsCard.getByRole('button', { name: button, exact: true }).click();
        await expectVisible(dialog.getByText(title, { exact: true }), `opening ${title}`);
    }

    async function confirmAndClose(what) {
        await confirm.click();
        await expectHidden(dialog, what);
    }

    return {
        /** Opens the details page of a planting the service doesn't have. */
        async openUnknown(plantingId) {
            await openPath(page, `dashboard/plantings/${plantingId}/details`);
        },

        /** On the planting's details page: titled with its name, its status beneath. */
        async isShownFor({ name, status }) {
            const what = `showing the details of the planting ${name}`;

            await expectUrl(page, detailsUrl, what);
            await expectText(main.locator('.page-title'), name, what);
            await expectText(statusChip, status, what);
        },

        /** The Details tab shows each of the planting's fields as the test made them. */
        async showsPlanting(planting) {
            const what = `the Details tab of the planting ${planting.name}`;
            const shown = value => (value === null || value === undefined ? '' : String(value));

            await main.getByRole('tab', { name: 'Details', exact: true }).click();
            await expectText(statusChip, planting.status, what);
            await expectValue(field('Name'), planting.name, what);
            await expectValue(field('source'), planting.seedSource, what);
            await expectValue(field('Lot#'), planting.lotNumber, what);
            await expectValue(field('Current Planting Year'), String(planting.plantingYear), what);
            await expectValue(field('Planting Years'), String(planting.plantingYear), what);
            await expectText(chosenIn('Select Plant'), planting.plantName, what);
            await expectValue(numberField('Transplant Lead Time (weeks)'), shown(planting.leadTimeWeeks), what);
            await expectText(dateAfter('Target Planting Date'), planting.targetPlantingDate ?? '--', what);
            await expectValue(numberField('Number Sown'), shown(planting.numberSown), what);
            await expectText(dateAfter('Date sown'), planting.sowDate ?? '--', what);
            await expectText(chosenIn('Plot'), planting.plotName === null ? [] : [planting.plotName], what);
            await expectValue(numberField('Number Planted'), shown(planting.numberTransplanted), what);
            await expectText(dateAfter('Date planted'), planting.transplantDate ?? '--', what);
        },

        /** The actions offered, by their buttons' names, in order. */
        async offersActions(names) {
            const buttons = actionsCard.getByRole('button').filter({ hasNotText: /^Update$/ });
            await expectText(buttons, names, 'the planting\'s actions');
        },

        /** Starts the planting with `numberSown`, on the day the dialog shows, which it returns. */
        async start(numberSown) {
            await openAction('Start', 'Start Planting');
            await dialog.getByRole('spinbutton', { name: 'Number Sown' }).fill(String(numberSown));
            const day = asDay(await dialog.locator('h3').textContent());
            await confirmAndClose('starting the planting');
            return day;
        },

        /**
         * Opens the Plant dialog, chooses the plot called `plotName` if there's
         * one, and types `numberTransplanted`, without confirming. Returns the
         * day the dialog shows.
         */
        async openPlantDialog(plotName, numberTransplanted) {
            await openAction('Plant', 'Plant Planting');
            if (plotName !== null) {
                await chooseOption(page, dialog.getByRole('combobox', { name: 'Select Plot' }), plotName);
            }
            await dialog.getByRole('spinbutton', { name: 'Number Transplanted' }).fill(String(numberTransplanted));
            return asDay(await dialog.locator('h3').textContent());
        },

        /** Pinned (A23): with no plot chosen, the Plant dialog offers Confirm. */
        async offersConfirmWithNoPlot() {
            await expectEnabled(confirm, 'the Plant dialog, with no plot chosen');
        },

        /**
         * Opens the Split dialog, and adds a split for each of `splits`, a name
         * and a count, by the "+", which has no name. Doesn't confirm.
         */
        async openSplitDialog(splits) {
            await openAction('Split', 'Split Planting');
            for (const [index, { name, count }] of splits.entries()) {
                await dialog.locator('.mdi-plus').click();
                await dialog.getByRole('textbox', { name: 'Name', exact: true }).nth(index).fill(name);
                await dialog.getByRole('spinbutton', { name: 'Count', exact: true }).nth(index).fill(String(count));
            }
        },

        /** Pinned (A24): with no splits added, the Split dialog offers Confirm. */
        async offersConfirmWithNoSplits() {
            await expectEnabled(confirm, 'the Split dialog, with no splits');
        },

        /** Clicks Confirm in the open dialog, and waits for it to close. */
        async confirm() {
            await confirmAndClose('confirming the dialog');
        },

        async retire() {
            await openAction('Retire', 'Retire Planting');
            await confirmAndClose('retiring the planting');
        },

        async delete() {
            await openAction('Delete', 'Delete Planting');
            await confirmAndClose('deleting the planting');
        },

        async comment(text) {
            await actionsCard.getByRole('button', { name: 'Comment', exact: true }).click();
            await dialog.getByRole('textbox').fill(text);
            await confirmAndClose('commenting on the planting');
        },

        /** Unlocks the form by its switch, types `name`, clicks Update, and waits for the page to say so. */
        async rename(name) {
            await expectDisabled(field('Name'), 'the Name field, before unlocking');
            await actionsCard.getByRole('checkbox').click();
            await field('Name').fill(name);
            await actionsCard.getByRole('button', { name: 'Update', exact: true }).click();
            await pageAlertSays(page, 'planting updated successfully', 'updating the planting');
        },

        /**
         * The History tab shows an entry with the planting's status, and each of
         * `comments`. The first entry, its creation, shows as its comment the
         * planting's fields as JSON, as the service files them (B34).
         */
        async historyShows({ status }, comments) {
            const what = 'the planting\'s History tab';
            const entries = main.locator('.v-window-item--active .v-card');

            await main.getByRole('tab', { name: 'History', exact: true }).click();
            await expectText(entries.filter({ hasText: 'CREATED' }).first().locator('p.multiline'),
                /^\s*\{"plantingId":.*\}\s*$/, what);
            await expectVisible(entries.locator('.v-chip', { hasText: new RegExp(`^\\s*${status}\\s*$`) }).first(), what);
            for (const comment of comments) {
                await expectVisible(entries.locator('p.multiline', { hasText: comment }), what);
            }
        },

        /**
         * Pinned (A21): with the form unlocked, the target date's picker opens
         * with no date chosen, so confirming it without picking clears the date
         * on screen.
         */
        async targetDatePickerForgetsTheDate() {
            const what = 'confirming the target date\'s picker without picking';

            await actionsCard.getByRole('checkbox').click();
            await calendarAfter('Target Planting Date').click();
            await expectVisible(dialog.getByText('Set Target Planting Date', { exact: true }), what);
            await confirmAndClose(what);
            await expectText(dateAfter('Target Planting Date'), '--', what);
        },

        /**
         * Pinned (A25): for a planting the service doesn't have, the page says
         * so, and throws, since it copies the planting it didn't get.
         */
        async throwsForAMissingPlanting(plantingId) {
            const what = `opening the unknown planting ${plantingId}`;

            await pageAlertSays(page, `error fetching planting by id: ${plantingId}`, what);
            await expectEventually(() => pageErrors.messages().some(message => /plantingId/.test(message)),
                'the page to throw reading the missing planting\'s plantingId', what);
        },
    };
}
