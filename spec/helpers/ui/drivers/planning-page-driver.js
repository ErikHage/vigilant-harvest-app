import { expectText } from './assertions';
import { dayOfYear, daysAfter, monthAndDay, numberedDay, todayInNewYork } from './days';
import { createRoutedPageDriver } from './routed-page-driver';

// The service counts days as days of the year, today's by its own clock, in
// New York; each count is a day of the planting year less today's
const daysUntil = day => dayOfYear(day) - dayOfYear(todayInNewYork());

/**
 * The planning page, for the chosen year: today, its planting day and the
 * days until it, and a tab each for the plantings to start and to plant out.
 */
export function createPlanningPageDriver(page) {
    const main = page.getByRole('main');
    const chips = main.locator('.v-card-title .v-chip');
    const rows = main.locator('.v-window-item--active tbody tr');

    async function listsIn(tab, plantings, actionDayOf) {
        await main.getByRole('tab', { name: tab }).click();
        await expectText(rows, plantings.map(({ name }) => new RegExp(name)), `the plantings ${tab}`);
        for (const [index, planting] of plantings.entries()) {
            const day = actionDayOf(planting);
            await expectText(rows.nth(index).locator('td'),
                [planting.name, planting.plantName, monthAndDay(day), String(daysUntil(day)), ''],
                `${planting.name}, ${tab}`);
        }
    }

    return {
        ...createRoutedPageDriver(page, {
            name: 'the planning page',
            path: 'dashboard/planning',
            marker: main => main.locator('.page-title', { hasText: /^Planting Plan - \d+$/ }),
        }),

        /**
         * The title names the year, and the chips show its target planting
         * day, and the days from today until then, below zero once past.
         */
        async showsPlantingDay({ plantingYear, targetPlantingDate }) {
            const what = `the plan for ${plantingYear}`;

            await expectText(main.locator('.page-title'), `Planting Plan - ${plantingYear}`, what);
            await expectText(chips.nth(1), `Planting Day: ${monthAndDay(targetPlantingDate)}`, what);
            await expectText(chips.nth(2), `${daysUntil(targetPlantingDate)} days until planting!`, what);
        },

        /**
         * Pinned (A31): Today shows today's day of the year, counted from
         * January 1 of the planting year, so in a leap year it's the day
         * before from March on, and in another the day after when today is in
         * a leap year.
         */
        async showsTodayCountedInThePlantingYear({ plantingYear }) {
            const shown = numberedDay(plantingYear, dayOfYear(todayInNewYork()));
            await expectText(chips.nth(0), `Today: ${monthAndDay(shown)}`, `the plan for ${plantingYear}`);
        },

        /**
         * To Start lists these plantings, in order: each sown its lead time
         * before its target planting date, as the world has them.
         */
        async listsToStart(plantings) {
            await listsIn('To Start', plantings,
                ({ targetPlantingDate, leadTimeWeeks }) => daysAfter(targetPlantingDate, -7 * leadTimeWeeks));
        },

        /** To Plant lists these plantings, in order: each planted out on its target planting date. */
        async listsToPlant(plantings) {
            await listsIn('To Plant', plantings, ({ targetPlantingDate }) => targetPlantingDate);
        },

        /** Opens the planting from its row in the tab shown. */
        async openPlanting({ name }) {
            await rows.filter({ hasText: name }).locator('.mdi-magnify').click();
        },
    };
}
