import { expectDisabled, expectHidden, expectText, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

/** The activity log, for the chosen year: a day's entries, and the Log Activity dialog. */
export function createActivityLogPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Confirm' });
    // A day's entries have no role: found by class
    const shownEntries = main.locator('.activity-entry');

    async function openDialog(what) {
        await main.getByRole('button', { name: 'Log Activity' }).click();
        await expectVisible(dialog.getByRole('combobox', { name: 'Activity', exact: true }), what);
    }

    return {
        ...createRoutedPageDriver(page, {
            name: 'the activity log',
            path: 'dashboard/activity-log',
            marker: main => main.locator('.page-title', { hasText: /^Activity Log$/ }),
        }),

        /** Logs an activity through its dialog, on the day it offers, which it returns as `YYYY-MM-DD`. */
        async logActivity({ activityType, subType, comments }) {
            const what = `logging ${activityType}`;

            await openDialog(what);
            const day = (await dialog.locator('h3').textContent()).trim();
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Activity', exact: true }), activityType);
            await chooseOption(page, dialog.getByRole('combobox', { name: 'SubType', exact: true }), subType);
            await dialog.getByRole('textbox', { name: 'Comments' }).fill(comments);
            await confirm.click();
            await expectHidden(dialog, what);
            return day;
        },

        /** The day shown has the entry: its type, in a chip, its subtype, then its comments. */
        async showsEntry({ entryDate, activityType, subType, comments }) {
            const what = `the activity "${comments}" on ${entryDate}`;
            const shown = shownEntries.filter({ hasText: comments });

            // The type is a chip, which has no role: found by class
            await expectText(shown.locator('.v-chip.activity-type'), activityType, what);
            await expectText(shown.locator('.activity-subtype'), subType, what);
            await expectText(shown.locator('.activity-comments'), comments, what);
        },

        /** Opens Log Activity, choosing nothing. */
        async openDialog() {
            await openDialog('opening Log Activity');
        },

        /** With no activity chosen, Log Activity withholds Confirm. */
        async withholdsConfirmWithNoActivity() {
            await expectDisabled(confirm, 'Log Activity, with no activity chosen');
        },

        /**
         * Pinned (A26): Confirm with no activity chosen throws reading the
         * activity's name, sends nothing, and leaves the dialog open, saying
         * nothing.
         */
    };
}
