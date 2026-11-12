import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { plant, schedules } from '../params';
import { dashboardComponents } from './routed-page';

/**
 * A plant's details page, in words. It's reached from the plants page, which
 * knows the plant's id, so it has no `open` of its own.
 */
export function createPlantDetailsPage(world, driver) {
    return {
        ...dashboardComponents(world),

        /** The browser is on the details page of the `plant` the test named. */
        async checkIsShownFor(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.isShownFor(world.plantNamed(params.plant));
        },

        /** Every tab but Schedules shows the `plant`'s fields, as the test made them. */
        async checkShowsPlant(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.showsPlant(world.plantNamed(params.plant));
        },

        /** The Schedules tab lists the schedules named, by name and description, and no others. */
        async checkListsSchedules(...args) {
            const params = parseDslArgs(args, { schedule: schedules() });

            await driver.listsSchedules(params.schedule.map(world.scheduleNamed));
        },

        /** The Schedules tab says the plant has none. */
        async checkListsNoSchedules(...args) {
            parseDslArgs(args, {});

            await driver.listsNoSchedules();
        },
    };
}
