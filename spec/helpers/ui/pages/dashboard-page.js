import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/** The dashboard's front page, with its card for choosing the planting year, in words. */
export function createDashboardPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /** Chooses the `year` (one the test named) as the year to work on: picks it, and presses Set. */
        async chooseYear(...args) {
            const params = parseDslArgs(args, { year: year() });
            const { plantingYear } = world.plantingYearNamed(params.year);

            await driver.pickYear(plantingYear);
            await driver.offersSet(true);
            await driver.pressSet();
        },

        /** The card names the `year` as chosen, and offers no Set until another is picked. */
        async checkYearIsChosen(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.showsYearChosen(world.plantingYearNamed(params.year).plantingYear);
            await driver.offersSet(false);
        },
    };
}
