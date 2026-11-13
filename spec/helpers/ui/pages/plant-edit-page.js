import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { offered, plant, schedule, schedules, tag, tags } from '../params';
import { dashboardComponents } from './routed-page';

/**
 * A plant's edit page, in words. It's reached from the plants page, which
 * knows the plant's id, so it has no `open` of its own; `reload` stays on it.
 */
export function createPlantEditPage(world, driver) {
    return {
        ...dashboardComponents(world),

        /** The browser is on the edit page of the `plant` the test named, its form filled in. */
        async checkIsShownFor(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.isShownFor(world.plantNamed(params.plant));
        },

        /**
         * The form holds the `plant`'s saved name, category, subcategory,
         * lifespan, tags, description and taxonomy.
         */
        async checkShowsPlant(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.showsPlant(world.plantNamed(params.plant));
        },

        /** Update and Reset are offered (`offered: yes`, the default), or neither is. */
        async checkUpdateOffered(...args) {
            const params = parseDslArgs(args, { offered: offered() });

            await driver.updateOffered(params.offered === 'yes');
        },

        /**
         * Gives the `plant` a new made-up name, family, cultivar and
         * description, the last through its dialog, without saving. From here
         * on the test's `plant` has them.
         */
        async edit(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.edit(world.editPlant(params.plant));
        },

        /** Types a made-up name for the `plant`, one the test never saves or checks for. */
        async typeUnsavedName(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.typeName(world.unsavedPlantName(params.plant));
        },

        /** Clicks Update, and waits for the page to say it saved. No parameters. */
        async update(...args) {
            parseDslArgs(args, {});

            await driver.update();
        },

        /** Reloads the page; `checkIsShownFor` checks it came back. No parameters. */
        async reload(...args) {
            parseDslArgs(args, {});

            await driver.reload();
        },

        /** Clicks Reset. No parameters. */
        async reset(...args) {
            parseDslArgs(args, {});

            await driver.reset();
        },

        /** In the tags dialog, toggles the `tag`, one the dialog offers, then confirms. */
        async toggleTag(...args) {
            const params = parseDslArgs(args, { tag: tag() });

            await driver.toggleTag(params.tag);
        },

        /** The form shows these `tags`, comma-separated, in order, and no others; none if left out. */
        async checkShowsTags(...args) {
            const params = parseDslArgs(args, { tags: tags() });

            await driver.showsTags(params.tags);
        },

        /**
         * After `toggleTag`: the form shows the `plant`'s own tags, with the
         * `tag` toggled on as well.
         */
        async checkTagsKeptAfterToggling(...args) {
            const params = parseDslArgs(args, { plant: plant(), tag: tag() });

            await driver.keepsOwnTagsWith(world.plantNamed(params.plant), params.tag);
        },

        /**
         * After `typeUnsavedName` and another save on the page: the Name field
         * still holds what was typed for the `plant`.
         */
        async checkUnsavedNameKept(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.unsavedNameKept(world.unsavedPlantName(params.plant));
        },

        /** Assigns the `schedule` the test named, through the Manage Schedules dialog, and saves. */
        async assignSchedule(...args) {
            const params = parseDslArgs(args, { schedule: schedule() });

            await driver.assignSchedule(world.scheduleNamed(params.schedule));
        },

        /** The Schedules card lists the schedules named, in order, and no others. */
        async checkListsSchedules(...args) {
            const params = parseDslArgs(args, { schedule: schedules() });

            await driver.listsSchedules(params.schedule.map(alias => world.scheduleNamed(alias).name));
        },
    };
}
