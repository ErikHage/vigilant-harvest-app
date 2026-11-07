import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { category, filterBy, message, name, subcategories, subcategory } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

// What a name of `spaces` is typed as
const typed = { spaces: '   ' };

/** The plant categories page, in words. */
export function createPlantCategoriesPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /** Adds a new category, called `category`, with a made-up name, through its dialog. */
        async addCategory(...args) {
            const params = parseDslArgs(args, { category: category() });

            await driver.startAddingCategory(world.newCategory(params.category).categoryName);
            await driver.confirm();
        },

        /**
         * Adds a new subcategory, called `subcategory`, with a made-up name, to
         * the `category` the test named, through the "+" in its row.
         */
        async addSubcategory(...args) {
            const params = parseDslArgs(args, { subcategory: subcategory(), category: category() });

            const added = world.newSubcategory(params.subcategory, params.category);
            await driver.startAddingSubcategory(world.categoryNamed(params.category), added.subcategoryName);
            await driver.confirm();
        },

        /** Opens the Add Category dialog and types a `name` (`spaces`), without confirming. */
        async startAddingCategory(...args) {
            const params = parseDslArgs(args, { name: name() });

            await driver.startAddingCategory(typed[params.name]);
        },

        /**
         * Opens the Add Subcategory dialog for the `category` the test named, and
         * types a `name` (`spaces`), without confirming.
         */
        async startAddingSubcategory(...args) {
            const params = parseDslArgs(args, { category: category(), name: name() });

            await driver.startAddingSubcategory(world.categoryNamed(params.category), typed[params.name]);
        },

        /**
         * After `startAddingCategory` or `startAddingSubcategory` with
         * `name: spaces`: the dialog offers Create or Add only for a name with
         * something in it. No parameters.
         */
        async checkConfirmNeedsAName(...args) {
            parseDslArgs(args, {});

            await driver.offersConfirmForANameOfSpaces();
        },

        /** Clicks Create or Add in the open dialog, which closes. No parameters. */
        async confirm(...args) {
            parseDslArgs(args, {});

            await driver.confirm();
        },

        /**
         * Filtering by the `category`'s own name finds it, with the subcategories
         * the test named in `subcategory`, in order (none if left out), and no
         * other category. With `by: subcategory`, it filters by the first
         * subcategory's name instead.
         */
        async checkCategoryFound(...args) {
            const params = parseDslArgs(args, { category: category(), subcategory: subcategories(), by: filterBy() });

            const found = world.categoryNamed(params.category);
            const subcategoryNames = params.subcategory.map(alias => world.subcategoryNamed(alias).subcategoryName);
            const text = params.by === 'subcategory' ? subcategoryNames[0] : found.categoryName;
            if (text === undefined) {
                throw new Error('checkCategoryFound: `by: subcategory` needs a `subcategory` to filter by');
            }
            await driver.findsCategoryBy(found, subcategoryNames, text);
        },

        /** The page's alert says `message`. Check it straight away: it fades after three seconds. */
        async checkAlertSays(...args) {
            const params = parseDslArgs(args, { message: message() });

            await driver.alertSays(params.message);
        },
    };
}
