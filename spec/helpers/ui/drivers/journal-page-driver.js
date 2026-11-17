import { expectHidden, expectText, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';

/** The garden journal, for the chosen year: a timeline of days, and a day's entries. */
export function createJournalPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');

    return {
        ...createRoutedPageDriver(page, {
            name: 'the journal',
            path: 'dashboard/journal',
            marker: main => main.locator('.page-title', { hasText: /^Garden Journal$/ }),
        }),

        /** Records `text` through Record Entry, on the day it offers, which it returns as `YYYY-MM-DD`. */
        async recordEntry(text) {
            const what = 'recording a journal entry';

            await main.getByRole('button', { name: 'Record Entry' }).click();
            await expectVisible(dialog.getByText('Record Journal Entry', { exact: true }), what);
            const day = (await dialog.locator('h3').textContent()).trim();
            await dialog.getByRole('textbox', { name: 'Journal entry...' }).fill(text);
            await dialog.getByRole('button', { name: 'Confirm' }).click();
            await expectHidden(dialog, what);
            return day;
        },

        /** The day shown, `day`, has these entries' texts, in order. */
        async showsEntries(day, texts) {
            await expectText(main.locator('.journal-entry p'), texts, `the journal's entries for ${day}`);
        },
    };
}
