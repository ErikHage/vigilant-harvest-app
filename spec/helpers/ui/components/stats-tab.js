import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { plant, planting, statsColumns } from '../params';

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

    return {
        /** Chooses the planting, or the plant, the test named, to see its stats. */
        async choose(...args) {
            const params = parseDslArgs(args, { [kind]: chosen.declaration() });

            await driver.choose(chosen.named(params[kind]));
        },

        /**
         * The planting, or plant, is chosen, with one card, and a column for
         * each harvest type, in order: its `type`, then its `first` and `last`
         * harvest days, `YYYY-MM-DD`, its `total`, and its `average` a day, as
         * the page writes it. The column repeats from `type`.
         */
        async checkShowsStats(...args) {
            const params = parseDslArgs(args, { [kind]: chosen.declaration(), columns: statsColumns() });

            await driver.showsStats(chosen.named(params[kind]), params.columns);
        },

        /** Nothing is chosen, and the tab says so. No parameters. */
        async checkShowsNothingChosen(...args) {
            parseDslArgs(args, {});

            await driver.showsNothingChosen();
        },
    };
}
