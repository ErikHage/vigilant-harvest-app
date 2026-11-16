import {
    expectChecked, expectDisabled, expectEnabled, expectHidden, expectText, expectValue, expectVisible,
} from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';

/** The page that adds a planting year, and its two date pickers, as Playwright sees them. */
export function createAddPlantingYearPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const create = main.getByRole('button', { name: 'Create New Planting Year' });
    // read-only fields; a date's field opens its picker
    const field = label => main.getByRole('textbox', { name: label, exact: true });
    const carried = main.getByRole('table').getByRole('row');
    const carryForward = name => main.getByRole('checkbox', { name: `Carry forward ${name}`, exact: true });
    const selectAll = main.getByRole('button', { name: 'Select all', exact: true });
    const deselectAll = main.getByRole('button', { name: 'Deselect all', exact: true });
    // the date pickers are dialogs too, but never open with this one
    const noCarryForward = page.getByRole('dialog').filter({ hasText: 'Carry nothing forward?' });
    const confirmation = noCarryForward.getByRole('textbox', { name: 'Confirmation' });
    const createWithoutPlantings = noCarryForward.getByRole('button', { name: 'Create without plantings' });
    const PHRASE = 'carry nothing forward';

    return {
        ...createRoutedPageDriver(page, {
            name: 'the add planting year page',
            path: 'dashboard/planting-years/add',
            marker: main => main.locator('.page-title', { hasText: /^Add Planting Year$/ }),
        }),

        /** The year it carries forward from, and the year it will add; neither can be changed. */
        async proposes(previous, next) {
            const what = 'the years the add page proposes';

            await expectValue(field('Previous Planting Year'), String(previous), what);
            await expectValue(field('New Planting Year'), String(next), what);
        },

        /**
         * Lists these plantings, by name, to carry forward, under its heading,
         * which says they're the planted ones. It said "not retired" (B17).
         */
        async carriesForward(names) {
            const what = 'the plantings the add page carries forward';

            await expectVisible(main.getByText('Plantings to carry forward (planted)', { exact: true }), what);
            // the first cell is the checkbox
            await expectText(carried.locator('td:nth-child(2)'), names, what);
        },

        /** None of these plantings, by name, is selected, and the count says so. */
        async selectsNone(names) {
            const what = 'the plantings the add page selects at first';

            for (const name of names) {
                await expectChecked(carryForward(name), false, what);
            }
            await expectVisible(main.getByText(`0 of ${names.length} selected`, { exact: true }), what);
            await expectVisible(selectAll, what);
        },

        /** Selects every planting, with the button that then offers to deselect them all. */
        async selectAll() {
            await selectAll.click();
            await expectVisible(deselectAll, 'selecting every planting to carry forward');
        },

        async select(name) {
            await carryForward(name).check();
            await expectChecked(carryForward(name), true, `selecting "${name}" to carry forward`);
        },

        async deselect(name) {
            await carryForward(name).uncheck();
            await expectChecked(carryForward(name), false, `deselecting "${name}"`);
        },

        /** After Create with nothing selected: a dialog warns that nothing will be carried into `plantingYear`. */
        async asksToConfirmCarryingNothing(plantingYear) {
            const what = 'creating a year with nothing selected to carry forward';

            await expectVisible(noCarryForward, what);
            await expectVisible(noCarryForward.getByText(
                `No plantings will be carried into ${plantingYear}. Perennials planted in earlier years won't appear in it.`,
                { exact: true }
            ), what);
            await expectVisible(noCarryForward.getByText(`Type ${PHRASE} to create the year anyway.`, { exact: true }), what);
        },

        /** Its Create stays off until the phrase is typed exactly: not in another case, nor with a space. */
        async confirmationNeedsTheExactPhrase() {
            const what = 'the confirmation to carry nothing forward';

            await expectDisabled(createWithoutPlantings, `${what}, with nothing typed`);
            for (const typed of ['Carry Nothing Forward', `${PHRASE} `]) {
                await confirmation.fill(typed);
                await expectDisabled(createWithoutPlantings, `${what}, with "${typed}" typed`);
            }
            await confirmation.fill(PHRASE);
            await expectEnabled(createWithoutPlantings, `${what}, with the phrase typed`);
        },

        async confirmCarryingNothing() {
            await confirmation.fill(PHRASE);
            await createWithoutPlantings.click();
            await expectHidden(noCarryForward, 'confirming to carry nothing forward');
        },

        /**
         * Picks a date in the picker the `label` field opens, by its day, in the month
         * the picker opens on. Each day's button is named in full, "Tuesday,
         * April 15, 8228"; the picker shows a few of the months either side
         * too, so pick a day from 8 to 21, which only the month itself shows.
         */
        async pickDate(label, day) {
            const what = `picking the ${label}`;

            await field(label).click();
            await expectVisible(dialog.getByText(`Set ${label}`, { exact: true }), what);
            await dialog.getByRole('button', { name: new RegExp(`^(Today, )?\\w+, \\w+ ${day}, \\d+$`) }).click();
            await dialog.getByRole('button', { name: 'Confirm' }).click();
            await expectHidden(dialog, what);
        },

        /** The date picked beside `label`, as the page shows it, `YYYY-MM-DD`, once one is. */
        async dateShown(label) {
            await expectValue(field(label), /^\d{4}-\d{2}-\d{2}$/, `the ${label} picked`);
            return field(label).inputValue();
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
