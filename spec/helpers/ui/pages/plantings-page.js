import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { plant, planting, year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The plantings page, which lists the chosen year's plantings, in words. */
export function createPlantingsPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /**
         * Adds a new planting, called `planting`, of the `plant` the test named,
         * through the Add dialog: a made-up name, lead time, seed source and
         * lot. It goes in the year chosen, which must be the `year` given.
         */
        async addPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting(), plant: plant(), year: year() });

            await driver.addPlanting(world.newPlantingFromDialog(params.planting, params.plant, params.year));
        },

        /** Opens the Add dialog, entering nothing. No parameters. */
        async openAddDialog(...args) {
            parseDslArgs(args, {});

            await driver.openAddDialog();
        },

        /** The open Add dialog offers Create only once the planting's required fields are given. No parameters. */
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
         * Searching for the `planting`'s name finds it, with its plant,
         * quantity, plot and status as the test has them, and no other.
         */
        async checkPlantingFound(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.findsPlanting(world.plantingNamed(params.planting));
        },

        /** After another planting was found: searching for the `planting`'s name finds nothing. */
        async checkPlantingNotListed(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.listsNoPlantingCalled(world.plantingNamed(params.planting).name);
        },

        /** Opens the `planting`'s details page from its row. */
        async viewPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.viewPlanting(world.plantingNamed(params.planting));
        },
    };
}
