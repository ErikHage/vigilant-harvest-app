import { expectDisabled, expectEnabled, expectHidden, expectText, expectVisible } from './assertions';
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

        /** The timeline lists these days, `YYYY-MM-DD`, in order, leaving out the "..." it puts between days apart. */
        async listsDays(days) {
            await expectText(main.locator('.timeline-entry:not(.gap)'), days, 'the journal\'s timeline');
        },

        /** The day shown is `day`, with these entries' texts. */
        async showsDay(day, texts) {
            const what = `the journal's entries for ${day}`;

            await expectText(main.getByRole('heading', { level: 2 }), day, what);
            await expectText(main.locator('.journal-entry p'), texts, what);
        },

        /** Previous and Next, each offered or not. */
        async offersPreviousAndNext(previous, next) {
            const what = 'the journal\'s Previous and Next';

            await (previous ? expectEnabled : expectDisabled)(main.getByRole('button', { name: 'Previous' }), what);
            await (next ? expectEnabled : expectDisabled)(main.getByRole('button', { name: 'Next' }), what);
        },

        async next() {
            await main.getByRole('button', { name: 'Next' }).click();
        },
    };
}
