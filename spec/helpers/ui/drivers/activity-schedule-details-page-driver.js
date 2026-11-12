import { expectDisabled, expectEventually, expectHidden, expectText, expectUrl, expectVisible } from './assertions';
import { chooseOption } from './select';
import { escaped, urlOf } from './urls';
import { status } from '../support/status-codes';

const detailsUrl = new RegExp(`^${escaped(urlOf('dashboard/activity-schedules/'))}[^/]+$`);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
    'November', 'December'];
const SHORT_MONTHS = MONTHS.map(month => month.slice(0, 3));
// `MM-DD` as the page writes it: `May 15`
const dayShown = monthDay => `${SHORT_MONTHS[Number(monthDay.slice(0, 2)) - 1]} ${Number(monthDay.slice(3))}`;
// An item's rule as the dialogs build it, and as the page shows it in words
const ruleOf = ({ frequency, interval }) => `RRULE:FREQ=${frequency.toUpperCase()};INTERVAL=${interval}`;
const units = { weekly: 'weeks', daily: 'days', monthly: 'months', yearly: 'years' };
const ruleInWords = ({ frequency, interval }) => `every ${interval} ${units[frequency]}`;

// An item's update, under the schedule with this id
const itemUpdateUnder = scheduleId =>
    new RegExp(`/activity-schedules/${escaped(scheduleId)}/schedule-items/[^/]+$`);

/**
 * An activity schedule's details page: its name and description, which a
 * dialog edits, and its items, each added, edited and deleted in a dialog of
 * its own.
 */
export function createActivityScheduleDetailsPageDriver(page, serviceCalls) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const scheduleCard = main.locator('.v-card').first();
    const itemRow = notes => main.locator('tbody tr').filter({ hasText: notes });
    // The Items count, under its label
    const itemCount = scheduleCard.locator('.text-caption', { hasText: /^Items$/ }).locator('xpath=following-sibling::div[1]');

    // Fills an item dialog with `item`; each month-and-day pair is start, then end
    async function fillItem(item) {
        await chooseOption(page, dialog.getByRole('combobox', { name: 'Activity Type' }), item.activityType);
        await chooseOption(page, dialog.getByRole('combobox', { name: 'Subcategory' }), item.subType);
        await chooseOption(page, dialog.getByRole('combobox', { name: 'Frequency' }), item.frequency);
        await dialog.getByRole('spinbutton', { name: 'Interval' }).fill(String(item.interval));
        for (const [index, monthDay] of [item.startDate, item.endDate].entries()) {
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Month' }).nth(index),
                MONTHS[Number(monthDay.slice(0, 2)) - 1]);
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Day' }).nth(index), monthDay.slice(3));
        }
        await dialog.getByRole('textbox', { name: 'Notes' }).fill(item.notes);
    }

    async function openDialog(title, open) {
        await open.click();
        await expectVisible(dialog.getByText(title, { exact: true }), `opening ${title}`);
    }

    return {
        /** On the schedule's details page: titled with its name. */
        async isShownFor({ name }) {
            const what = `showing the schedule ${name}`;

            await expectUrl(page, detailsUrl, what);
            await expectText(main.locator('.page-title'), name, what);
        },

        /** The schedule's name, description, and how many items it has. */
        async showsSchedule({ name, description }, items) {
            const what = `the details of the schedule ${name}`;

            await expectText(main.locator('.page-title'), name, what);
            await expectText(scheduleCard.locator('.text-body-2').first(), description, what);
            await expectText(itemCount, String(items), what);
        },

        /** No items, and a line saying to add one. */
        async showsNoItems() {
            await expectText(main.locator('tbody tr'), [/No items yet/], 'the schedule\'s items');
        },

        /** Edits the schedule's name and description through its pencil, and saves. */
        async editSchedule({ name, description }) {
            const what = `editing the schedule to ${name}`;

            await openDialog('Edit Activity Schedule', scheduleCard.getByRole('button'));
            await dialog.getByRole('textbox', { name: 'Activity Schedule Name' }).fill(name);
            await dialog.getByRole('textbox', { name: 'Description' }).fill(description);
            await dialog.getByRole('button', { name: 'Save' }).click();
            await expectHidden(dialog, what);
        },

        /** Adds `item` through Add Item, and waits for the dialog to close. */
        async addItem(item) {
            await openDialog('Add Activity Schedule Item', main.getByRole('button', { name: 'Add Item' }));
            await fillItem(item);
            await dialog.getByRole('button', { name: 'Create' }).click();
            await expectHidden(dialog, 'adding a schedule item');
        },

        /** Opens Add Item, and fills it in with `item`, without creating it. */
        async startAddingItem(item) {
            await openDialog('Add Activity Schedule Item', main.getByRole('button', { name: 'Add Item' }));
            await fillItem(item);
        },

        /** The open Add Item dialog withholds Create, as for an interval that isn't a whole number of at least 1. */
        async withholdsCreate() {
            await expectDisabled(dialog.getByRole('button', { name: 'Create' }), 'the Add Item dialog, with that interval');
        },

        /**
         * The item's row: its activity and subtype, its rule in words and as
         * stored, its days, and its notes.
         */
        async listsItem(item) {
            const what = `the schedule item ${item.notes}`;

            await expectText(itemRow(item.notes).locator('td'), [
                new RegExp(`^\\s*${escaped(item.activityType)}\\s*${escaped(item.subType)}\\s*$`),
                new RegExp(`^\\s*${escaped(ruleInWords(item))}\\s*${escaped(ruleOf(item))}\\s*$`),
                `${dayShown(item.startDate)} - ${dayShown(item.endDate)}`,
                item.notes,
                '',
            ], what);
        },

        /** Edits the item whose notes were `notes` to be `item`, through its pencil, and saves. */
        async editItem(notes, item) {
            await openDialog('Edit Activity Schedule Item', itemRow(notes).locator('.v-btn', { has: page.locator('.mdi-pencil') }));
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Subcategory' }), item.subType);
            await dialog.getByRole('textbox', { name: 'Notes' }).fill(item.notes);
            await dialog.getByRole('button', { name: 'Save' }).click();
            await expectHidden(dialog, 'editing a schedule item');
        },

        /**
         * The item's update went to the service under the schedule shown, the
         * id in the page's address, and was taken. It once went under
         * `undefined` (backlog A30).
         */
        async itemUpdateSentUnderItsSchedule() {
            const scheduleId = new URL(page.url()).pathname.split('/').pop();

            await expectEventually(() => serviceCalls.wereAnswered('PATCH', itemUpdateUnder(scheduleId), status.ok),
                `the item's update to be sent to /activity-schedules/${scheduleId}/schedule-items/<id>, and answered 200`,
                'editing a schedule item');
        },

        /** Deletes the item through its bin, once its switch confirms it, and waits for the dialog to close. */
        async deleteItem({ notes }) {
            const what = `deleting the schedule item ${notes}`;

            await openDialog('Delete Schedule Item', itemRow(notes).locator('.v-btn', { has: page.locator('.mdi-delete') }));
            await dialog.getByLabel('I want to delete this item').check();
            await dialog.getByRole('button', { name: 'Delete' }).click();
            await expectHidden(dialog, what);
        },
    };
}
