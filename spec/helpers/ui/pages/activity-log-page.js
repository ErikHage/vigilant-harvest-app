import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { createDayTimeline } from '../components/day-timeline';
import { entry, year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The activity log, for the chosen year, in words. */
export function createActivityLogPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),
        timeline: createDayTimeline(world, world.drivers.dayTimeline),

        /**
         * Logs a new activity, called `entry`, in the `year` chosen, through Log
         * Activity, on the day it offers: fertilizing with CalMag, with
         * made-up comments.
         */
        async logActivity(...args) {
            const params = parseDslArgs(args, { entry: entry(), year: year() });

            const logged = world.newLogEntry(params.entry, params.year, null);
            world.updateEntry(params.entry, { entryDate: await driver.logActivity(logged) });
        },

        /**
         * The `entry` is listed: its day, chosen in the timeline, shows it with
         * its type, subtype and comments.
         */
        async checkListsEntry(...args) {
            const params = parseDslArgs(args, { entry: entry() });

            const listed = world.entryNamed(params.entry);
            await world.drivers.dayTimeline.chooseDay(listed.entryDate);
            await world.drivers.dayTimeline.showsDay(listed.entryDate);
            await driver.showsEntry(listed);
        },

        /** Opens Log Activity, choosing nothing. No parameters. */
        async openLogDialog(...args) {
            parseDslArgs(args, {});

            await driver.openDialog();
        },

        /** Log Activity offers Confirm only once an activity is chosen. No parameters. */
        async checkConfirmNeedsAnActivity(...args) {
            parseDslArgs(args, {});

            await driver.withholdsConfirmWithNoActivity();
        },
    };
}
