import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { schedule, scheduleFilter, schedules } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The activity schedules page, every schedule, in words. */
export function createActivitySchedulesPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /** Creates a schedule called `schedule`, with a made-up description, through its dialog. */
        async createSchedule(...args) {
            const params = parseDslArgs(args, { schedule: schedule() });

            await driver.createSchedule(world.newSchedule(params.schedule));
        },

        /**
         * Filters by the `schedule`'s name, or, `by: both`, by the last three
         * letters of its name and the first three of its description, run
         * together.
         */
        async filter(...args) {
            const params = parseDslArgs(args, { schedule: schedule(), by: scheduleFilter() });

            const { name, description } = world.scheduleNamed(params.schedule);
            await driver.filter(params.by === 'name' ? name : `${name.slice(-3)}${description.slice(0, 3)}`);
        },

        /** The table lists these `schedule`s, by alias, comma-separated, and no others. */
        async checkListsOnly(...args) {
            const params = parseDslArgs(args, { schedule: schedules() });

            await driver.listsOnly(params.schedule.map(alias => world.scheduleNamed(alias)));
        },

        /** Opens the `schedule`'s details from the table. */
        async openSchedule(...args) {
            const params = parseDslArgs(args, { schedule: schedule() });

            await driver.openSchedule(world.scheduleNamed(params.schedule));
        },
    };
}
