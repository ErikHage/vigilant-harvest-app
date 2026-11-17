import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { createDayTimeline } from '../components/day-timeline';
import { entry, year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The garden journal, for the chosen year, in words. */
export function createJournalPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),
        timeline: createDayTimeline(world, world.drivers.dayTimeline),

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

        /** The day shown is the `entry`'s, with its text. */
        async checkShowsEntry(...args) {
            const params = parseDslArgs(args, { entry: entry() });

            const shown = world.entryNamed(params.entry);
            await world.drivers.dayTimeline.showsDay(shown.entryDate);
            await driver.showsEntries(shown.entryDate, [shown.entry]);
        },
    };
}
