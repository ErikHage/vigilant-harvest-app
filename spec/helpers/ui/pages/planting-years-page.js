import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The planting years page, in words. */
export function createPlantingYearsPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /** The `year` the test named is listed, with its target planting and last frost dates. */
        async checkYearListed(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.listsYear(world.plantingYearNamed(params.year));
        },

        /** Opens the `year`'s details page from its row. */
        async viewYear(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.viewYear(world.plantingYearNamed(params.year));
        },

        /**
         * As `viewYear`, but the service's answer for the `year` is held, for
         * `plantingYearDetailsPage.checkShowsOnlyItsOwnYear` to let go.
         */
        async viewYearWhileItLoads(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.viewYearWhileItLoads(world.plantingYearNamed(params.year));
        },

        /** Clicks Add Year. No parameters. */
        async addYear(...args) {
            parseDslArgs(args, {});

            await driver.addYear();
        },

        /** Opens the page with the service failing to list the years. No parameters. */
        async openWithTheListFailing(...args) {
            parseDslArgs(args, {});

            await driver.openWithTheListFailing();
        },

        /** After `openWithTheListFailing`: the page says the years couldn't be loaded. No parameters. */
        async checkSaysTheYearsDidNotLoad(...args) {
            parseDslArgs(args, {});

            await driver.saysTheYearsDidNotLoad();
        },
    };
}
