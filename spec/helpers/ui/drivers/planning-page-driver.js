import { expectText } from './assertions';
import { daysAfter, daysBetween, monthAndDay, todayInNewYork } from './days';
import { createRoutedPageDriver } from './routed-page-driver';

// The page counts from the browser's today, in New York
const daysUntil = day => daysBetween(todayInNewYork(), day);

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

        /** Today shows today's date, whatever the planting year. */
        async showsToday({ plantingYear }) {
            await expectText(chips.nth(0), `Today: ${monthAndDay(todayInNewYork())}`, `the plan for ${plantingYear}`);
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
