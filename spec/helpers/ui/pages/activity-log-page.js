import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { entry, year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The activity log, for the chosen year, in words. */
export function createActivityLogPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

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

        /** The `entry` is listed, with its date, type, subtype and comments. */
        async checkListsEntry(...args) {
            const params = parseDslArgs(args, { entry: entry() });

            await driver.listsEntry(world.entryNamed(params.entry));
        },

        /** Opens Log Activity, choosing nothing. No parameters. */
        async openLogDialog(...args) {
            parseDslArgs(args, {});

            await driver.openDialog();
        },

        /** Log Activity offers Confirm only once an activity is chosen. No parameters. */
        async checkConfirmNeedsAnActivity(...args) {
            parseDslArgs(args, {});

            await driver.offersConfirmWithNoActivity();
        },

        /** Clicks Confirm in Log Activity. No parameters. */
        async confirm(...args) {
            parseDslArgs(args, {});

            await driver.confirm();
        },

        /** After Confirm with no activity: the dialog says what's missing, and nothing was sent. No parameters. */
        async checkSaysAnActivityIsNeeded(...args) {
            parseDslArgs(args, {});

            await driver.confirmThrowsWithNoActivity();
        },
    };
}
