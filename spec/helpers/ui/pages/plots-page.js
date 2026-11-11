import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { active, plot } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The plots page, in words. */
export function createPlotsPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /** Adds a new plot, called `plot`, with made-up details, through the Add dialog. */
        async addPlot(...args) {
            const params = parseDslArgs(args, { plot: plot() });

            await driver.addPlot(world.newPlot(params.plot));
        },

        /**
         * Gives the `plot` a new made-up name, sizes and type through its Edit
         * dialog, and saves them. From here on the test's `plot` has them.
         */
        async editPlot(...args) {
            const params = parseDslArgs(args, { plot: plot() });

            const formerName = world.plotNamed(params.plot).friendlyName;
            await driver.editPlot(formerName, world.editPlot(params.plot));
        },

        /** Opens the Add dialog, entering nothing. No parameters. */
        async openAddDialog(...args) {
            parseDslArgs(args, {});

            await driver.openAddDialog();
        },

        /** The open Add dialog offers Create only once the plot's required fields are given. No parameters. */
        async checkCreateNeedsTheRequiredFields(...args) {
            parseDslArgs(args, {});

            await driver.withholdsCreateWithNothingEntered();
        },

        /**
         * Clicks Create in the open Add dialog. No parameters. A save that succeeds
         * closes it; one the service refuses keeps it open, for a check to follow.
         */
        /**
         * The service refused the save: the dialog stays open, saying why
         * (`message`), as does the page's alert. Check it straight away: the
         * alert fades after three seconds.
         */
        /**
         * The `plot` is listed, with its details, and `active: yes | no` (default
         * yes).
         */
        async checkPlotListed(...args) {
            const params = parseDslArgs(args, { plot: plot(), active: active() });

            await driver.listsPlot(world.plotNamed(params.plot), params.active === 'yes');
        },

        /** Searching for the `plot`'s name finds it, and no other. */
        async checkPlotFound(...args) {
            const params = parseDslArgs(args, { plot: plot() });

            await driver.findsPlot(world.plotNamed(params.plot));
        },
    };
}
