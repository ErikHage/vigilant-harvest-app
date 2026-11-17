import { expectDisabled, expectEnabled, expectText } from './assertions';
import { escaped } from './urls';

const exactly = text => new RegExp(`^\\s*${escaped(text)}\\s*$`);

/**
 * The day timeline, on the harvests page, the journal and the activity log:
 * the days with records, newest first, with `...` between days apart, and
 * the chosen day under a heading between Older and Newer. One to a page.
 *
 * Its rows are plain elements with no role (the app isn't used with a screen
 * reader), so they are found by class: `.timeline-entry`, `.gap` and
 * `.selected`.
 */
export function createDayTimelineDriver(page) {
    const main = page.getByRole('main');
    const rows = main.locator('.timeline-entry');
    const heading = main.locator('.content-column').getByRole('heading', { level: 2 });

    return {
        /** The timeline lists these, in order: days, `YYYY-MM-DD`, and `...` where it marks a gap. */
        async listsDays(days) {
            await expectText(rows, days, 'the timeline');
        },

        /** The timeline lists these days, `YYYY-MM-DD`, in order, leaving out its gaps. */
        async listsDaysLeavingOutGaps(days) {
            await expectText(main.locator('.timeline-entry:not(.gap)'), days, 'the timeline, without its gaps');
        },

        /** `day`, `YYYY-MM-DD`, is the one chosen in the timeline, and the one shown. */
        async showsDay(day) {
            const what = `the timeline, showing ${day}`;

            await expectText(main.locator('.timeline-entry.selected'), day, what);
            await expectText(heading, day, what);
        },

        async chooseDay(day) {
            await rows.filter({ hasText: exactly(day) }).click();
        },

        /** Older and Newer, each offered or not. */
        async offersOlderAndNewer(older, newer) {
            const what = 'the timeline\'s Older and Newer';

            await (older ? expectEnabled : expectDisabled)(main.getByRole('button', { name: 'Older' }), what);
            await (newer ? expectEnabled : expectDisabled)(main.getByRole('button', { name: 'Newer' }), what);
        },

        async older() {
            await main.getByRole('button', { name: 'Older' }).click();
        },

        async newer() {
            await main.getByRole('button', { name: 'Newer' }).click();
        },
    };
}
