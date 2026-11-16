import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { createStatsTab } from '../components/stats-tab';
import { count, on, statsTab } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/**
 * The stats page, in words: the year's totals, then a tab each for plants
 * and plantings, as `plants` and `plantings`.
 */
export function createStatsPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        plants: createStatsTab(world, world.drivers.statsPlantsTab, 'plant'),
        plantings: createStatsTab(world, world.drivers.statsPlantingsTab, 'planting'),

        /**
         * The chosen year's totals: its `first` and `last` harvest days,
         * `YYYY-MM-DD`, the `days` from one to the other, counting both, and
         * the `harvestDays`, how many had a harvest.
         */
        async checkShowsTotals(...args) {
            const params = parseDslArgs(args, { first: on(), last: on(), days: count(), harvestDays: count() });

            await driver.showsTotals(params);
        },

        /** Shows the `tab`, `plants` or `plantings`. The page opens on plants. */
        async showTab(...args) {
            const params = parseDslArgs(args, { tab: statsTab() });

            await driver.showTab(params.tab);
        },
    };
}
