import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { count, interval, item, schedule } from '../params';
import { dashboardComponents } from './routed-page';

/** An activity schedule's details page, its items and their dialogs, in words. */
export function createActivityScheduleDetailsPage(world, driver) {
    return {
        ...dashboardComponents(world),

        /** The browser is on the `schedule`'s details page. */
        async checkIsShownFor(...args) {
            const params = parseDslArgs(args, { schedule: schedule() });

            await driver.isShownFor(world.scheduleNamed(params.schedule));
        },

        /** The page shows the `schedule`'s name and description, and its `items`, how many. */
        async checkShowsSchedule(...args) {
            const params = parseDslArgs(args, { schedule: schedule(), items: count() });

            await driver.showsSchedule(world.scheduleNamed(params.schedule), params.items);
        },

        /** The schedule has no items, and the page says to add one. No parameters. */
        async checkShowsNoItems(...args) {
            parseDslArgs(args, {});

            await driver.showsNoItems();
        },

        /** Gives the `schedule` a new name and description, through its pencil. */
        async editSchedule(...args) {
            const params = parseDslArgs(args, { schedule: schedule() });

            await driver.editSchedule(world.editSchedule(params.schedule));
        },

        /**
         * Adds an item called `item` to the `schedule` shown, through Add Item:
         * bone meal every 2 weeks, May 15 to June 30, with made-up notes.
         */
        async addItem(...args) {
            const params = parseDslArgs(args, { item: item(), schedule: schedule() });

            await driver.addItem(world.newScheduleItem(params.item, params.schedule));
        },

        /**
         * Opens Add Item, and fills it in as `addItem` does, every `interval`
         * weeks, any whole number, without creating it.
         */
        async startAddingItemEvery(...args) {
            const params = parseDslArgs(args, { item: item(), schedule: schedule(), interval: interval() });

            await driver.startAddingItem(world.newScheduleItem(params.item, params.schedule, params.interval));
        },

        /** The open Add Item dialog offers Create only for an interval of at least 1. No parameters. */
        async checkCreateNeedsAWholeInterval(...args) {
            parseDslArgs(args, {});

            await driver.withholdsCreate();
        },

        /** The items list the `item` as the test has it. */
        async checkListsItem(...args) {
            const params = parseDslArgs(args, { item: item() });

            await driver.listsItem(world.scheduleItemNamed(params.item));
        },

        /** Gives the `item` new notes and a different subtype, blood meal, through its pencil. */
        async editItem(...args) {
            const params = parseDslArgs(args, { item: item() });

            const { notes } = world.scheduleItemNamed(params.item);
            await driver.editItem(notes, world.editScheduleItem(params.item));
        },

        /** After `editItem`: the update was sent for the item in the schedule shown. No parameters. */
        async checkItemUpdateNamedItsSchedule(...args) {
            parseDslArgs(args, {});

            await driver.itemUpdateSentUnderItsSchedule();
        },

        /** Deletes the `item`, through its bin, confirming it. */
        async deleteItem(...args) {
            const params = parseDslArgs(args, { item: item() });

            await driver.deleteItem(world.scheduleItemNamed(params.item));
        },
    };
}
