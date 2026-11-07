import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { plot, year } from '../params';

/**
 * The garden as the service holds it, in words: what a test needs but isn't
 * about, arranged through the API rather than the pages. Each step names its
 * thing before creating it, so cleanup deletes it whatever happens next.
 */
export function createGarden(world, driver) {
    return {
        /** There is a plot called `plot`, with made-up details, active. */
        async hasPlot(...args) {
            const params = parseDslArgs(args, { plot: plot() });

            await driver.createPlot({ ...world.newPlot(params.plot), isActive: true });
        },

        /**
         * There is a planting year called `year`: a year from 8000 to 8999,
         * with its frost and planting dates in it. Steps name it by its alias.
         */
        async hasPlantingYear(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.createPlantingYear(world.newPlantingYear(params.year));
        },
    };
}
