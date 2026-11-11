import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { planting, plantings, year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/**
 * The planning page, for the chosen year, in words. It counts its days from
 * the browser's today.
 */
export function createPlanningPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /** The plan is the `year`'s, with its planting day, and the days until it. */
        async checkShowsPlantingDay(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.showsPlantingDay(world.plantingYearNamed(params.year));
        },

        /** Today is today, in the `year`'s plan. */
        async checkShowsToday(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.showsToday(world.plantingYearNamed(params.year));
        },

        /**
         * To Start lists the `planting`s, by alias, comma-separated, in order,
         * each with its sowing day and the days until it.
         */
        async checkListsToStart(...args) {
            const params = parseDslArgs(args, { planting: plantings() });

            await driver.listsToStart(params.planting.map(alias => world.plantingNamed(alias)));
        },

        /**
         * To Plant lists the `planting`s, by alias, comma-separated, in order,
         * each with its planting day and the days until it.
         */
        async checkListsToPlant(...args) {
            const params = parseDslArgs(args, { planting: plantings() });

            await driver.listsToPlant(params.planting.map(alias => world.plantingNamed(alias)));
        },

        /** Opens the `planting` from its row in the tab shown. */
        async openPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.openPlanting(world.plantingNamed(params.planting));
        },
    };
}
