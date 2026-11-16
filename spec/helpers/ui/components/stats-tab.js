import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { average, count, on, plant, planting } from '../params';

// What a card shows, as the test expects it
const stats = () => ({ first: on(), last: on(), total: count(), average: average() });

/**
 * A tab of the stats page, in words: `kind` is `planting` or `plant`, and
 * names what its steps choose. Show the tab first, with the page's
 * `showTab`.
 */
export function createStatsTab(world, driver, kind) {
    const chosen = {
        planting: { declaration: planting, named: alias => world.plantingNamed(alias) },
        plant: { declaration: plant, named: alias => world.plantNamed(alias) },
    }[kind];
    const harvestTypeOf = details => details.harvestType ?? details.harvesting.defaultHarvestType;

    return {
        /** Chooses the planting, or the plant, the test named, to see its stats. */
        async choose(...args) {
            const params = parseDslArgs(args, { [kind]: chosen.declaration() });

            await driver.choose(chosen.named(params[kind]));
        },

        /**
         * The planting, or plant, is chosen, with one card: its `first` and
         * `last` harvest days, `YYYY-MM-DD`, its `total`, and its `average` a
         * day, as the page writes it.
         */
        async checkShowsStats(...args) {
            const params = parseDslArgs(args, { [kind]: chosen.declaration(), ...stats() });

            const details = chosen.named(params[kind]);
            await driver.showsStats(details, harvestTypeOf(details), params);
        },

        /** Nothing is chosen, and the tab says so. No parameters. */
        async checkShowsNothingChosen(...args) {
            parseDslArgs(args, {});

            await driver.showsNothingChosen();
        },
    };
}
