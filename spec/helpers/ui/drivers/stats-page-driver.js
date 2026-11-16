import { expectText } from './assertions';
import { dateString } from './days';
import { createRoutedPageDriver } from './routed-page-driver';

// Each tab, by name
const tabNames = { plants: 'Plants', plantings: 'Plantings' };

/**
 * The stats page: the chosen year's totals, above a tab for plants and one
 * for plantings. Each tab is a component, with its own driver
 * (stats-tab-driver.js). They were two pages, then one page told which by
 * its route (backlog B29).
 */
export function createStatsPageDriver(page) {
    const name = 'the stats page';
    const main = page.getByRole('main');
    const totals = main.locator('.v-card').filter({ hasText: 'Number of Harvest Days' });

    return {
        ...createRoutedPageDriver(page, {
            name,
            path: 'dashboard/stats',
            marker: main => main.locator('.page-title', { hasText: /^Harvest Stats$/ }),
        }),

        /**
         * The year's totals: its `first` and `last` harvest days, `YYYY-MM-DD`,
         * the days from one to the other, and how many had a harvest.
         */
        async showsTotals({ first, last, days, harvestDays }) {
            await expectText(totals.locator('td'), [dateString(first), dateString(last), String(days), String(harvestDays)],
                `the year's totals on ${name}`);
        },

        /** Shows the tab, `plants` or `plantings`. */
        async showTab(tab) {
            await main.getByRole('tab', { name: tabNames[tab], exact: true }).click();
        },
    };
}
