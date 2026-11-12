import { expectCount, expectText } from './assertions';
import { dateString } from './days';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

// A quantity as the cards show it: the number, then the type
const quantityShown = (quantity, harvestType) => `${quantity} ${harvestType}`;

const kinds = {
    planting: {
        name: 'the planting stats page', path: 'dashboard/stats/plantings', title: /^Planting Stats$/,
        select: 'Select Planting to View',
        // The select names a planting with its plot and plant
        option: ({ name, plotName, plantName }) => `${name} | ${plotName} | ${plantName}`,
        // The card's heading, then its lines: plant, plot and type
        heading: ({ name }) => name,
        lines: ({ plantName, plotName, harvestType }) => [plantName, plotName, harvestType],
    },
    plant: {
        name: 'the plant stats page', path: 'dashboard/stats/plants', title: /^Plant Stats$/,
        select: 'Select Plant to View',
        option: ({ friendlyName }) => friendlyName,
        heading: ({ friendlyName }) => friendlyName,
        lines: ({ harvesting }) => [harvesting.defaultHarvestType],
    },
};

/**
 * A stats page, `kind` being `planting` or `plant`: the chosen year's totals,
 * and a card per harvest type for the planting or plant chosen. The two
 * are one page, told which by its route; they were two components the same
 * apart from three strings (backlog B29).
 */
export function createStatsPageDriver(page, kind) {
    const { name, path, title, select, option, heading, lines } = kinds[kind];
    const main = page.getByRole('main');
    const totals = main.locator('.v-card').filter({ hasText: 'Number of Harvest Days' });
    const statsCard = main.locator('.stats-card');

    return {
        ...createRoutedPageDriver(page, {
            name,
            path,
            marker: main => main.locator('.page-title', { hasText: title }),
        }),

        /**
         * The year's totals: its `first` and `last` harvest days, `YYYY-MM-DD`,
         * the days from one to the other, and how many had a harvest.
         */
        async showsTotals({ first, last, days, harvestDays }) {
            await expectText(totals.locator('td'), [dateString(first), dateString(last), String(days), String(harvestDays)],
                `the year's totals on ${name}`);
        },

        /** Chooses the planting or plant, `chosen` as the world has it, in the select. */
        async choose(chosen) {
            await chooseOption(page, main.getByRole('combobox', { name: select }), option(chosen));
        },

        /**
         * One card, for what was chosen, with its names and type, its `first`
         * and `last` harvest days, `YYYY-MM-DD`, its `total`, and the
         * `average` a day as the page writes it.
         */
        async showsStats(chosen, harvestType, { first, last, total, average }) {
            const what = `the stats on ${name}`;

            await expectCount(statsCard, 1, what);
            await expectText(statsCard.locator('h3'), heading(chosen), what);
            await expectText(statsCard.locator('.v-card-title span'), lines(chosen), what);
            await expectText(statsCard.locator('td'), [
                dateString(first), dateString(last), quantityShown(total, harvestType), quantityShown(average, harvestType),
            ], what);
        },
    };
}
