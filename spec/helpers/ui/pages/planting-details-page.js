import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { actions, count, planting, plot, splitInto } from '../params';
import { dashboardComponents } from './routed-page';

/**
 * A planting's details page, in words. It's reached from the plantings page,
 * which knows the planting's id, so it has no `open` of its own, but for a
 * planting that doesn't exist.
 */
export function createPlantingDetailsPage(world, driver) {
    // Remembers a planting out: the planting is planted, sown as many as were
    // planted, and any rest is split off as its remainder
    function plantOut(alias, { plotName, count: planted, transplantDate }) {
        const remaining = world.plantingNamed(alias).numberSown - planted;
        if (remaining > 0) {
            world.newRemainder(alias, remaining);
        }
        world.updatePlanting(alias, {
            status: 'PLANTED', plotName, numberSown: planted, numberTransplanted: planted, transplantDate,
        });
    }

    return {
        ...dashboardComponents(world),

        /** The browser is on the details page of the `planting` the test named, with its status. */
        async checkIsShownFor(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.isShownFor(world.plantingNamed(params.planting));
        },

        /** The Details tab shows each of the `planting`'s fields, as the test has them. */
        async checkShowsPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.showsPlanting(world.plantingNamed(params.planting));
        },

        /** The page offers these `actions`, by their buttons' names, in order. */
        async checkOffersActions(...args) {
            const params = parseDslArgs(args, { actions: actions() });

            await driver.offersActions(params.actions);
        },

        /** Starts the `planting` through its dialog, with `count` seeds sown, on the day it shows. */
        async startPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting(), count: count() });

            const sowDate = await driver.start(params.count);
            world.updatePlanting(params.planting, { status: 'STARTED', numberSown: params.count, sowDate });
        },

        /**
         * Plants the `planting` in the `plot` the test named, `count` seedlings,
         * on the day the dialog shows. Fewer than were sown, and the rest are
         * split off: `planting: <alias>-remainder` names them.
         */
        async plantPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting(), plot: plot(), count: count() });

            const { friendlyName } = world.plotNamed(params.plot);
            const transplantDate = await driver.openPlantDialog(friendlyName, params.count);
            plantOut(params.planting, { plotName: friendlyName, count: params.count, transplantDate });
            await driver.confirm();
        },

        /**
         * Opens the Plant dialog for the `planting` and types `count`, choosing
         * no plot, without confirming. If it's confirmed, the planting is
         * planted nowhere.
         */
        async startPlantingWithNoPlot(...args) {
            const params = parseDslArgs(args, { planting: planting(), count: count() });

            const transplantDate = await driver.openPlantDialog(null, params.count);
            plantOut(params.planting, { plotName: null, count: params.count, transplantDate });
        },

        /** The open Plant dialog offers Confirm only once a plot is chosen. No parameters. */
        async checkPlantNeedsAPlot(...args) {
            parseDslArgs(args, {});

            await driver.offersConfirmWithNoPlot();
        },

        /**
         * Splits the `planting` into new plantings, each a `split` alias and its
         * `count`, repeated. Each is named for the test; the page goes on to the
         * plantings page.
         */
        async splitPlanting(...args) {
            const params = parseDslArgs(args, { planting: planting(), splits: splitInto().atLeastOne() });

            const splits = params.splits.map(({ split, count: taken }) => ({
                name: world.newSplit(split, params.planting, taken).name, count: taken,
            }));
            await driver.openSplitDialog(splits);
            await driver.confirm();
        },

        /** Opens the Split dialog, adding no splits, without confirming. No parameters. */
        async openSplitDialog(...args) {
            parseDslArgs(args, {});

            await driver.openSplitDialog([]);
        },

        /** The open Split dialog offers Confirm only once there's a split. No parameters. */
        async checkSplitNeedsASplit(...args) {
            parseDslArgs(args, {});

            await driver.offersConfirmWithNoSplits();
        },

        /** Clicks Confirm in the open dialog, which closes. No parameters. */
        async confirm(...args) {
            parseDslArgs(args, {});

            await driver.confirm();
        },

        /** Retires the `planting`, confirming it. */
        async retirePlanting(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.retire();
            world.updatePlanting(params.planting, { status: 'RETIRED' });
        },

        /** Deletes the `planting`, confirming it; the page goes on to the plantings page. */
        async deletePlanting(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            world.plantingNamed(params.planting);
            await driver.delete();
        },

        /** Comments on the `planting`, with a made-up comment. */
        async commentOn(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.comment(world.newComment(params.planting));
        },

        /** Gives the `planting` a new made-up name, through the unlocked form and Update. */
        async renamePlanting(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.rename(world.renamePlanting(params.planting).name);
        },

        /** The History tab shows the `planting`'s current status, and each comment the test made. */
        async checkHistoryShows(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            const shown = world.plantingNamed(params.planting);
            await driver.historyShows(shown, shown.comments);
        },

        /**
         * With the form unlocked, confirming the target date's picker without
         * picking a date keeps the `planting`'s target date.
         */
        async checkTargetDateKeptByItsPicker(...args) {
            parseDslArgs(args, { planting: planting() });

            await driver.targetDatePickerForgetsTheDate();
        },

        /** Opens the details page of a planting that doesn't exist, by a made-up id. No parameters. */
        async openUnknown(...args) {
            parseDslArgs(args, {});

            await driver.openUnknown(world.newUnknownPlantingId());
        },

        /** After `openUnknown`: the page says the planting wasn't found, and nothing more. No parameters. */
        async checkSaysThePlantingWasNotFound(...args) {
            parseDslArgs(args, {});

            await driver.throwsForAMissingPlanting(world.unknownPlantingId());
        },
    };
}
