import { expectHidden, expectText, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { escaped } from './urls';

const exactly = text => new RegExp(`^\\s*${escaped(text)}\\s*$`);

/** The activity schedules page: every schedule, a filter, and the dialog that creates one. */
export function createActivitySchedulesPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const rows = main.locator('tbody tr');

    return {
        ...createRoutedPageDriver(page, {
            name: 'the activity schedules page',
            path: 'dashboard/activity-schedules',
            marker: main => main.locator('.page-title', { hasText: /^Activity Schedules$/ }),
        }),

        /** Creates the schedule through Create Activity Schedule, and waits for the dialog to close. */
        async createSchedule({ name, description }) {
            const what = `creating the schedule ${name}`;

            await main.getByRole('button', { name: 'Create Activity Schedule' }).click();
            await expectVisible(dialog.getByText('Create Activity Schedule', { exact: true }), what);
            await dialog.getByRole('textbox', { name: 'Activity Schedule Name' }).fill(name);
            await dialog.getByRole('textbox', { name: 'Description' }).fill(description);
            await dialog.getByRole('button', { name: 'Create' }).click();
            await expectHidden(dialog, what);
        },

        async filter(text) {
            await main.getByRole('textbox', { name: 'Filter schedules' }).fill(text);
        },

        /** The table lists only these schedules, by name and description, and the count says so. */
        async listsOnly(schedules) {
            const what = 'the activity schedules listed';

            await expectText(rows, schedules.map(({ name }) => new RegExp(escaped(name))), what);
            for (const [index, { name, description }] of schedules.entries()) {
                await expectText(rows.nth(index).locator('td'), [name, description], what);
            }
            await expectText(main.locator('.text-body-2', { hasText: 'activity schedules' }),
                new RegExp(`^\\s*${schedules.length} of \\d+ activity schedules\\s*$`), what);
        },

        /** The table lists no schedule, says so, and the count is 0. */
        async listsNone() {
            const what = 'the activity schedules listed';

            await expectText(rows, [/No schedules found/], what);
            await expectText(main.locator('.text-body-2', { hasText: 'activity schedules' }),
                /^\s*0 of \d+ activity schedules\s*$/, what);
        },

        /** Opens the schedule from its name in the table. */
        async openSchedule({ name }) {
            await rows.locator('.clickable', { hasText: exactly(name) }).click();
        },
    };
}
