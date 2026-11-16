import { expectCount, expectText, expectValue } from './assertions';
import { dateString } from './days';
import { chooseOption } from './select';

// A quantity as the cards show it: the number, then the type
const quantityShown = (quantity, harvestType) => `${quantity} ${harvestType}`;

const kinds = {
    planting: {
        name: 'the plantings tab',
        select: 'Select Planting to View',
        // The select names a planting with its plot and plant
        option: ({ name, plotName, plantName }) => `${name} | ${plotName} | ${plantName}`,
        // The card's heading, then its lines: plant, plot and type
        heading: ({ name }) => name,
        lines: ({ plantName, plotName, harvestType }) => [plantName, plotName, harvestType],
    },
    plant: {
        name: 'the plants tab',
        select: 'Select Plant to View',
        option: ({ friendlyName }) => friendlyName,
        heading: ({ friendlyName }) => friendlyName,
        lines: ({ harvesting }) => [harvesting.defaultHarvestType],
    },
};

/**
 * A tab of the stats page, `kind` being `planting` or `plant`: a select of
 * each one with stats, and a card per harvest type for the one chosen. Both
 * tabs are on the page; Vuetify hides the one not shown, so this looks only
 * in the shown one, and the stats page's driver shows it.
 */
export function createStatsTabDriver(page, kind) {
    const { name, select, option, heading, lines } = kinds[kind];
    // Vuetify's tab content has no role: found by its class
    const shownTab = page.getByRole('main').locator('.v-window-item--active');
    const combobox = shownTab.getByRole('combobox', { name: select });
    const statsCard = shownTab.locator('.stats-card');

    return {
        /** Chooses the planting or plant, `chosen` as the world has it, in the select. */
        async choose(chosen) {
            await chooseOption(page, combobox, option(chosen));
        },

        /**
         * The select shows `chosen`, and one card, for it, with its names and
         * type, its `first` and `last` harvest days, `YYYY-MM-DD`, its
         * `total`, and the `average` a day as the page writes it.
         */
        async showsStats(chosen, harvestType, { first, last, total, average }) {
            const what = `the stats on ${name}`;

            await expectText(shownTab.locator('.v-select__selection'), option(chosen), what);
            await expectCount(statsCard, 1, what);
            await expectText(statsCard.locator('h3'), heading(chosen), what);
            await expectText(statsCard.locator('.v-card-title span'), lines(chosen), what);
            await expectText(statsCard.locator('td'), [
                dateString(first), dateString(last), quantityShown(total, harvestType), quantityShown(average, harvestType),
            ], what);
        },

        /** Nothing is chosen, and the tab says so. */
        async showsNothingChosen() {
            const what = `${name}, with nothing chosen`;

            await expectValue(combobox, '', what);
            await expectCount(statsCard, 0, what);
            await expectText(shownTab.getByText('No stats selected.'), 'No stats selected.', what);
        },
    };
}
