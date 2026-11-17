import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { days, entries, entry, offered, on } from '../params';

/**
 * The day timeline, in words, on any page that has one. A day is named by
 * `on`, `YYYY-MM-DD`, or, for a day the test can't know ahead (today's), by
 * the `entry`, journal or activity log, filed on it.
 */
export function createDayTimeline(world, driver) {
    const dayOf = alias => world.entryNamed(alias).entryDate;

    return {
        /**
         * The timeline lists these `days`, `YYYY-MM-DD`, comma-separated, in
         * order, with `...` where it marks a gap.
         */
        async checkDays(...args) {
            const params = parseDslArgs(args, { days: days() });

            await driver.listsDays(params.days);
        },

        /** The timeline lists the days of these `entry`s, comma-separated, in order, leaving out its gaps. */
        async checkDaysOf(...args) {
            const params = parseDslArgs(args, { entry: entries() });

            await driver.listsDaysLeavingOutGaps(params.entry.map(dayOf));
        },

        /** The day chosen and shown is the one `on`, `YYYY-MM-DD`. */
        async checkShowsDay(...args) {
            const params = parseDslArgs(args, { on: on() });

            await driver.showsDay(params.on);
        },

        /** The day chosen and shown is the `entry`'s. */
        async checkShowsDayOf(...args) {
            const params = parseDslArgs(args, { entry: entry() });

            await driver.showsDay(dayOf(params.entry));
        },

        /** Chooses the day `on`, `YYYY-MM-DD`. */
        async chooseDay(...args) {
            const params = parseDslArgs(args, { on: on() });

            await driver.chooseDay(params.on);
        },

        /** Chooses the `entry`'s day. */
        async chooseDayOf(...args) {
            const params = parseDslArgs(args, { entry: entry() });

            await driver.chooseDay(dayOf(params.entry));
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

        /** Clicks Newer, for the day after. No parameters. */
        async newer(...args) {
            parseDslArgs(args, {});

            await driver.newer();
        },
    };
}
