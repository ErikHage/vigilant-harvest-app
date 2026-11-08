import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { average, count, on, plant, planting } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

// What a card shows, as the test expects it
const stats = () => ({ first: on(), last: on(), total: count(), average: average() });

/**
 * A stats page, in words: `kind` is `planting` or `plant`, and names what
 * its steps choose. The two pages are copies (backlog B29).
 */
export function createStatsPage(world, driver, kind) {
    const chosen = {
        planting: { declaration: planting, named: alias => world.plantingNamed(alias) },
        plant: { declaration: plant, named: alias => world.plantNamed(alias) },
    }[kind];
    const harvestTypeOf = details => details.harvestType ?? details.harvesting.defaultHarvestType;

    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /**
         * The chosen year's totals: its `first` and `last` harvest days,
         * `YYYY-MM-DD`, the `days` from one to the other, counting both, and
         * the `harvestDays`, how many had a harvest.
         */
        async checkShowsTotals(...args) {
            const params = parseDslArgs(args, { first: on(), last: on(), days: count(), harvestDays: count() });

            await driver.showsTotals(params);
        },

        /** Chooses the planting, or the plant, the test named, to see its stats. */
        async choose(...args) {
            const params = parseDslArgs(args, { [kind]: chosen.declaration() });

            await driver.choose(chosen.named(params[kind]));
        },

        /**
         * One card, for the planting, or plant, chosen: its `first` and `last`
         * harvest days, `YYYY-MM-DD`, its `total`, and its `average` a day, as
         * the page writes it.
         */
        async checkShowsStats(...args) {
            const params = parseDslArgs(args, { [kind]: chosen.declaration(), ...stats() });

            const details = chosen.named(params[kind]);
            await driver.showsStats(details, harvestTypeOf(details), params);
        },
    };
}

/** The planting stats page. */
export const createPlantingStatsPage = (world, driver) => createStatsPage(world, driver, 'planting');

/** The plant stats page. */
export const createPlantStatsPage = (world, driver) => createStatsPage(world, driver, 'plant');
