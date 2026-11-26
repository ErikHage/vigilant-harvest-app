import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { day, planting, plantings, year } from '../params';
import { routedPageSteps, shellComponents } from './routed-page';

/**
 * The page that adds a planting year, in words. It proposes the year after
 * the browser's calendar year, so a spec fixes the clock in a year it named
 * first (`browserClock.setToNoonIn`).
 */
export function createAddPlantingYearPage(world, driver) {
    return {
        ...shellComponents(world),
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

        /** None of the plantings the test named is selected to carry forward, and the count says so. */
        async checkSelectsNone(...args) {
            const params = parseDslArgs(args, { planting: plantings() });

            await driver.selectsNone(params.planting.map(alias => world.plantingNamed(alias).name));
        },

        /** Selects every planting listed to carry forward. No parameters. */
        async selectAll(...args) {
            parseDslArgs(args, {});

            await driver.selectAll();
        },

        /** Selects the `planting` the test named, to carry forward. */
        async select(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.select(world.plantingNamed(params.planting).name);
        },

        /** Deselects the `planting` the test named, so it isn't carried forward. */
        async deselect(...args) {
            const params = parseDslArgs(args, { planting: planting() });

            await driver.deselect(world.plantingNamed(params.planting).name);
        },

        /**
         * After `addYear` with nothing selected: it asks to confirm carrying
         * nothing into the `year`.
         */
        async checkAsksToConfirmCarryingNothing(...args) {
            const params = parseDslArgs(args, { year: year() });

            await driver.asksToConfirmCarryingNothing(world.plantingYearNamed(params.year).plantingYear);
        },

        /** The confirmation's Create stays off until its phrase is typed exactly. No parameters. */
        async checkConfirmationNeedsTheExactPhrase(...args) {
            parseDslArgs(args, {});

            await driver.confirmationNeedsTheExactPhrase();
        },

        /** Types the confirmation's phrase and creates the year, carrying nothing forward. No parameters. */
        async confirmCarryingNothing(...args) {
            parseDslArgs(args, {});

            await driver.confirmCarryingNothing();
        },

        /**
         * Picks the last frost date and the target planting date by their days
         * of the month the pickers open on, `frost` and `target`, then creates
         * the year, called `year`, the year after the one `after` names. With
         * nothing selected to carry forward, it asks to confirm that first.
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

            await driver.withholdsCreateWithNoDates();
        },
    };
}
