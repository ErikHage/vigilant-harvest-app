import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { entries, entry, offered, year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The garden journal, for the chosen year, in words. */
export function createJournalPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /**
         * Records a new entry, called `entry`, with made-up text, in the `year`
         * chosen, through Record Entry, on the day it offers.
         */
        async recordEntry(...args) {
            const params = parseDslArgs(args, { entry: entry(), year: year() });

            // Named first, its day as yet unknown: the dialog shows it
            const recorded = world.newJournalEntry(params.entry, params.year, null);
            world.updateEntry(params.entry, { entryDate: await driver.recordEntry(recorded.entry) });
        },

        /** The timeline lists the days of these `entry`s, comma-separated, in order. */
        async checkListsDaysOf(...args) {
            const params = parseDslArgs(args, { entry: entries() });

            await driver.listsDays(params.entry.map(alias => world.entryNamed(alias).entryDate));
        },

        /** The day shown is the `entry`'s, with its text. */
        async checkShowsEntry(...args) {
            const params = parseDslArgs(args, { entry: entry() });

            const shown = world.entryNamed(params.entry);
            await driver.showsDay(shown.entryDate, [shown.entry]);
        },

        /** Older and Newer are offered, or not: `older: yes | no`, `newer: yes | no`. */
        async checkOffersOlderAndNewer(...args) {
            const params = parseDslArgs(args, { older: offered(), newer: offered() });

            await driver.offersOlderAndNewer(params.older === 'yes', params.newer === 'yes');
        },

        /** Clicks Older, for the day before. No parameters. */
        async older(...args) {
            parseDslArgs(args, {});

            await driver.older();
        },
    };
}
