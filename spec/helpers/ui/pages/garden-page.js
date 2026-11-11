import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { planting, quantity } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The garden page, which shows the chosen year's planted plantings by plot, in words. */
export function createGardenPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /**
         * The `planting`'s plot has a card showing it, how many were planted
         * out, and what's been harvested, as the test has it.
         */
        async checkShowsPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.showsPlanting(world.plantingNamed(params.planting));
        },

        /**
         * Enters a harvest of `quantity` for the `planting` (planted, in a plot)
         * through Add Harvests, of its plant's default type, and saves it to
         * the confirm dialog, which shows it. Doesn't confirm.
         */
        async enterHarvest(...args) {
            const params = parseDslArgs(args, { planting: planting(), quantity: quantity() });

            await driver.enterHarvest(world.plantingNamed(params.planting), params.quantity);
            world.recordHarvest(params.planting, params.quantity);
        },

        /** Confirms the harvests entered. No parameters. */
        async confirmHarvests(...args) {
            parseDslArgs(args, {});

            await driver.confirmHarvests();
        },

        /** Presses Confirm, and the service's answer is held until `confirmAgain`. No parameters. */
        async confirmWhileTheSaveIsHeld(...args) {
            parseDslArgs(args, {});

            await driver.confirmWhileTheSaveIsHeld();
        },

        /** While the harvests save, Confirm isn't offered again. No parameters. */
        async checkConfirmWaitsForTheSave(...args) {
            parseDslArgs(args, {});

            await driver.withholdsConfirmWhileSaving();
        },

        /** Presses Confirm again, then lets the held save go. No parameters. */
        async confirmAgain(...args) {
            parseDslArgs(args, {});

            await driver.confirmAgainAndLetTheSaveGo();
        },

        /** After Confirm was pressed twice: the `planting`'s harvest was saved once. */
        async checkHarvestSavedOnce(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.harvestFiledOnce(world.plantingNamed(params.planting));
        },
    };
}
