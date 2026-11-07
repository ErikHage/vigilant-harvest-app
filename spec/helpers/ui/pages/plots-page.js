import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { active, plot } from '../params';
import { routedPageSteps, shellComponents } from './routed-page';

/** The plots page, in words. */
export function createPlotsPage(world, driver) {
    return {
        ...shellComponents(world),
        ...routedPageSteps(driver),

        /** Adds a new plot, called `plot`, with made-up details, through the Add dialog. */
        async addPlot(...args) {
            const params = parseDslArgs(args, { plot: plot() });

            await driver.addPlot(world.newPlot(params.plot));
        },

        /**
         * The `plot` is listed, with its details, and `active: yes | no` (default
         * yes).
         */
        async checkPlotListed(...args) {
            const params = parseDslArgs(args, { plot: plot(), active: active() });

            await driver.listsPlot(world.plotNamed(params.plot), params.active === 'yes');
        },
    };
}
