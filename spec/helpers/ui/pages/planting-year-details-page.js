import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { tally, year } from '../params';
import { dashboardComponents } from './routed-page';

/**
 * A planting year's details page, in words. It's reached from the planting
 * years page, so it has no `open` of its own.
 */
export function createPlantingYearDetailsPage(world, driver) {
    return {
        ...dashboardComponents(world),

        /** The browser is on the details page of the `year` the test named. */
        async checkIsShownFor(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.isShownFor(world.plantingYearNamed(params.year));
        },

        /**
         * It shows the `year`'s dates, and how many of its plantings are
         * `created`, `started`, `planted` and `retired`, each 0 if left out.
         */
        async checkShowsYear(...args) {
            const params = parseDslArgs(args, {
                year: year(), created: tally(), started: tally(), planted: tally(), retired: tally(),
            });

            await driver.showsYear(world.plantingYearNamed(params.year), {
                CREATED: params.created, STARTED: params.started, PLANTED: params.planted, RETIRED: params.retired,
            });
        },

        /**
         * After `plantingYearsPage.viewYearWhileItLoads`: while its details
         * load, the page shows nothing of the `previous` year viewed, then the
         * `year`.
         */
        async checkShowsOnlyItsOwnYear(...args) {
            const params = parseDslArgs(args, { year: year(), previous: year() });

            await driver.showsTheLastYearViewedWhileLoading(world.plantingYearNamed(params.year),
                world.plantingYearNamed(params.previous));
        },
    };
}
