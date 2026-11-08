import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { day, message, plantings, year } from '../params';
import { dashboardComponents, routedPageSteps } from './routed-page';

/**
 * The page that adds a planting year, in words. It proposes the year after
 * the browser's calendar year, so a spec fixes the clock in a year it named
 * first (`browserClock.setToNoonIn`).
 */
export function createAddPlantingYearPage(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),

        /** It proposes to add the year after the `year` the test named, carrying forward from it. */
        async checkProposesTheYearAfter(...args) {
            const params = parseDslArgs(args, { year: year() });

            const { plantingYear } = world.plantingYearNamed(params.year);
            await driver.proposes(plantingYear, plantingYear + 1);
        },

        /** It lists these plantings the test named to carry forward, in order; none if left out. */
        async checkCarriesForward(...args) {
            const params = parseDslArgs(args, { planting: plantings() });

            await driver.carriesForward(params.planting.map(alias => world.plantingNamed(alias).name));
        },

        /**
         * Picks the last frost date and the target planting date by their days
         * of the month the pickers open on, `frost` and `target`, then creates
         * the year, called `year`, the year after the one `after` names.
         */
        async addYear(...args) {
            const params = parseDslArgs(args, { year: year(), after: year(), frost: day(), target: day() });

            await driver.pickDate('Last Frost Date', params.frost);
            await driver.pickDate('Target Planting Date', params.target);
            world.newNextPlantingYear(params.year, params.after, {
                lastFrostDate: await driver.dateShown('Last Frost Date'),
                targetPlantingDate: await driver.dateShown('Target Planting Date'),
            });
            await driver.create();
        },

        /** The page offers Create only once both dates are picked. No parameters. */
        async checkCreateNeedsBothDates(...args) {
            parseDslArgs(args, {});

            await driver.offersCreateWithNoDates();
        },

        /** Clicks Create, whatever's picked. No parameters. */
        async create(...args) {
            parseDslArgs(args, {});

            await driver.create();
        },

        /** The page's alert says `message`. Check it straight away: it fades after three seconds. */
        async checkAlertSays(...args) {
            const params = parseDslArgs(args, { message: message() });

            await driver.alertSays(params.message);
        },
    };
}
