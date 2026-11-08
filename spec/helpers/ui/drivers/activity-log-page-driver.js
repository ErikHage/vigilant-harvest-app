import { expectEnabled, expectEventually, expectHidden, expectText, expectThat, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

const logPath = /\/activity-log$/;

/** The activity log, for the chosen year, and its Log Activity dialog. */
export function createActivityLogPageDriver(page, serviceCalls, pageErrors) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Confirm' });
    const rows = main.getByRole('table').getByRole('row').filter({ has: page.getByRole('cell') });

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

        /** The entry is listed with its date, type, subtype and comments. */
        async listsEntry({ entryDate, activityType, subType, comments }) {
            const what = `listing the activity "${comments}"`;
            const row = rows.filter({ has: page.getByRole('cell', { name: comments, exact: true }) });

            await expectVisible(row, what);
            await expectText(row.getByRole('cell'), [entryDate, activityType, subType, comments], what);
        },

        /** Opens Log Activity, choosing nothing. */
        async openDialog() {
            await openDialog('opening Log Activity');
        },

        /** Pinned (A26): with no activity chosen, Confirm is offered. */
        async offersConfirmWithNoActivity() {
            await expectEnabled(confirm, 'Log Activity, with no activity chosen');
        },

        async confirm() {
            await confirm.click();
        },

        /**
         * Pinned (A26): Confirm with no activity chosen throws reading the
         * activity's name, sends nothing, and leaves the dialog open, saying
         * nothing.
         */
        async confirmThrowsWithNoActivity() {
            const what = 'confirming Log Activity with no activity chosen';

            await expectEventually(() => pageErrors.messages().some(message => /TypeError|name/.test(message)),
                'the page to throw reading the activity\'s name', what);
            await expectVisible(dialog, what);
            expectThat(serviceCalls.countMade('PUT', logPath) === 0, 'no entry sent',
                `${serviceCalls.countMade('PUT', logPath)} sent`, what);
        },
    };
}
