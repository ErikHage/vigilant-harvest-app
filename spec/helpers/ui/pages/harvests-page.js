import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { days, on, planting, quantity } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The harvests page, a timeline of the chosen year's harvest days, in words. */
export function createHarvestsPage(world, driver) {
    // The planting's harvest on a day, as the test filed it
    function harvestOn(alias, day) {
        const harvest = world.plantingNamed(alias).harvests.find(each => each.on === day);
        if (harvest === undefined) {
            throw new Error(`no harvest of the planting "${alias}" on ${day} in this test -- file one first with garden.hasHarvest`);
        }
        return harvest;
    }

    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /**
         * The timeline lists these `days`, `YYYY-MM-DD`, comma-separated, in
         * order, with `...` where it marks a gap.
         */
        async checkListsDays(...args) {
            const params = parseDslArgs(args, { days: days() });

            await driver.listsDays(params.days);
        },

        /** The day chosen and shown is the one `on`, `YYYY-MM-DD`. */
        async checkShowsDay(...args) {
            const params = parseDslArgs(args, { on: on() });

            await driver.showsDay(params.on);
        },

        /** Chooses the day `on`, `YYYY-MM-DD`, in the timeline. */
        async chooseDay(...args) {
            const params = parseDslArgs(args, { on: on() });

            await driver.chooseDay(params.on);
        },

        /** The day shown has the `planting`'s harvest of the day `on`, as the test has it. */
        async checkShowsHarvest(...args) {
            const params = parseDslArgs(args, { planting: planting(), on: on() });

            await driver.showsHarvest(world.plantingNamed(params.planting),
                harvestOn(params.planting, params.on).quantity);
        },

        /**
         * Edits the `planting`'s harvest on the day shown, which is the one
         * `on`, to `quantity`, and updates.
         */
        async editHarvest(...args) {
            const params = parseDslArgs(args, { planting: planting(), on: on(), quantity: quantity() });

            harvestOn(params.planting, params.on);
            await driver.editHarvest(world.plantingNamed(params.planting), params.quantity);
            world.reviseHarvest(params.planting, params.on, params.quantity);
        },

        /**
         * Starts editing the `planting`'s harvest on the day shown, typing
         * `quantity`, without pressing Update.
         */
        async startEditingHarvest(...args) {
            const params = parseDslArgs(args, { planting: planting(), quantity: quantity() });

            await driver.startEditing(world.plantingNamed(params.planting), params.quantity);
        },

        /** The open edit dialog offers Update only for a quantity of more than nothing. No parameters. */
        async checkUpdateNeedsAQuantity(...args) {
            parseDslArgs(args, {});

            await driver.withholdsUpdate();
        },

        /** With no harvests in the year, the page says to choose a day. No parameters. */
        async checkSaysThereAreNoHarvests(...args) {
            parseDslArgs(args, {});

            await driver.asksForADayWithNoneToChoose();
        },
    };
}
