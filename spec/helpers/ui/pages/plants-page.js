import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { by, message, plant, subcategory } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

// What `by: name | category | subcategory` searches for
const searchText = (plant, by) => ({
    name: plant.friendlyName, category: plant.categoryName, subcategory: plant.subcategoryName,
})[by];

/** The plants page, in words. */
export function createPlantsPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /**
         * Adds a new plant, called `plant`, in the `subcategory` the test named,
         * through the Add dialog: a made-up name, lifespan, default harvest
         * type and description, which is all it asks for.
         */
        async addPlant(...args) {
            const params = parseDslArgs(args, { plant: plant(), subcategory: subcategory() });

            await driver.addPlant(world.newPlantFromDialog(params.plant, params.subcategory));
        },

        /** Opens the Add dialog, entering nothing. No parameters. */
        async openAddDialog(...args) {
            parseDslArgs(args, {});

            await driver.openAddDialog();
        },

        /** The open Add dialog offers Create only once the plant's required fields are given. No parameters. */
        async checkCreateNeedsTheRequiredFields(...args) {
            parseDslArgs(args, {});

            await driver.offersCreateWithNothingEntered();
        },

        /**
         * Clicks Create in the open Add dialog. No parameters. A save that succeeds
         * closes it; one the service refuses keeps it open, for a check to follow.
         */
        async create(...args) {
            parseDslArgs(args, {});

            await driver.pressCreate();
        },

        /**
         * Searching by the plant's name (`by: name`, the default), or its
         * category's or subcategory's, finds that plant, with its category and
         * subcategory, and no other.
         */
        async checkPlantFound(...args) {
            const params = parseDslArgs(args, { plant: plant(), by: by() });

            const found = world.plantNamed(params.plant);
            await driver.findsPlantBy(found, searchText(found, params.by));
        },

        /** Opens the plant's details page from its row. */
        async viewPlant(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.viewPlant(world.plantNamed(params.plant));
        },

        /** Opens the plant's edit page from its row. */
        async editPlant(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.editPlant(world.plantNamed(params.plant));
        },

        /**
         * The service refused the save: the dialog stays open, saying why
         * (`message`), as does the page's alert. Check it straight away: the
         * alert fades after three seconds.
         */
        async checkCreateIsRejected(...args) {
            const params = parseDslArgs(args, { message: message() });

            await driver.createIsRejectedSaying(params.message);
        },
    };
}
