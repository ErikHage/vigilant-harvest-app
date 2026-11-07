import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { category, plant, plot, schedule, schedules, subcategory, tags, year } from '../params';

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

        /** There is a plant category called `category`, with no subcategories yet. */
        async hasCategory(...args) {
            const params = parseDslArgs(args, { category: category() });

            await driver.createCategory(world.newCategory(params.category));
        },

        /** There is a subcategory called `subcategory`, in the `category` the test named. */
        async hasSubcategory(...args) {
            const params = parseDslArgs(args, { subcategory: subcategory(), category: category() });

            await driver.createSubcategory(world.newSubcategory(params.subcategory, params.category));
        },

        /** There is an activity schedule called `schedule`, with a description and no items. */
        async hasSchedule(...args) {
            const params = parseDslArgs(args, { schedule: schedule() });

            await driver.createSchedule(world.newSchedule(params.schedule));
        },

        /**
         * There is a plant called `plant`, in the `subcategory` the test named,
         * with every field made up. `tags` are as given, comma-separated, any
         * text (none if left out), and `schedule` names schedules the test
         * named that it's assigned (none if left out).
         */
        async hasPlant(...args) {
            const params = parseDslArgs(args, {
                plant: plant(), subcategory: subcategory(), tags: tags(), schedule: schedules(),
            });

            const scheduleNames = params.schedule.map(alias => world.scheduleNamed(alias).name);
            await driver.createPlant(world.newPlant(params.plant, params.subcategory, params.tags), scheduleNames);
        },
    };
}
