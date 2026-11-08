import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import {
    arrangedStatus, category, entry, on, optionalPlot, plant, planting, plot, schedule, schedules, subcategory, tags,
    year,
} from '../params';

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

            await driver.createPlot(world.newPlot(params.plot));
        },

        /**
         * There is a planting called `planting`, of the `plant` the test named,
         * in its planting `year`, with a made-up seed source, lot, lead time and
         * target planting date. With `status: started`, six seeds were sown on
         * April 1 of its year; with `status: planted`, all six were planted out
         * too, on May 1, in the `plot` the test named, or in none if left out;
         * otherwise (`status: created`, the default) nothing has happened to
         * it yet.
         */
        async hasPlanting(...args) {
            const params = parseDslArgs(args, {
                planting: planting(), plant: plant(), year: year(), status: arrangedStatus(), plot: optionalPlot(),
            });
            if (params.plot !== undefined && params.status !== 'planted') {
                throw new Error('hasPlanting: only a planting with `status: planted` is in a plot');
            }

            const { plantingYear } = world.newPlanting(params.planting, params.plant, params.year);
            if (params.status !== 'created') {
                world.updatePlanting(params.planting, {
                    status: 'STARTED', numberSown: 6, sowDate: `${plantingYear}-04-01`,
                });
            }
            if (params.status === 'planted') {
                world.updatePlanting(params.planting, {
                    status: 'PLANTED', numberTransplanted: 6, transplantDate: `${plantingYear}-05-01`,
                    plotName: params.plot === undefined ? null : world.plotNamed(params.plot).friendlyName,
                });
            }
            await driver.createPlanting(world.plantingNamed(params.planting));
        },

        /**
         * There is a journal entry called `entry`, in the `year` the test named,
         * dated `on` a day, `YYYY-MM-DD`, in 2026: the service keeps entries as
         * timestamps, 1971 to 2037, apart from their year.
         */
        async hasJournalEntry(...args) {
            const params = parseDslArgs(args, { entry: entry(), year: year(), on: on() });

            await driver.createJournalEntry(world.newJournalEntry(params.entry, params.year, params.on));
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
