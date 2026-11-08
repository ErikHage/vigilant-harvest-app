import { expectText, expectUrl } from './assertions';
import { shortDate } from './planting-years-page-driver';
import { urlOf } from './urls';

const statuses = ['CREATED', 'STARTED', 'PLANTED', 'RETIRED'];

/** A planting year's details page, as Playwright sees it. It has no page title, only a card's. */
export function createPlantingYearDetailsPageDriver(page, callControl) {
    const main = page.getByRole('main');
    const title = main.locator('.v-card-title').first();
    const dateUnder = label => main.locator('.v-card', { has: page.locator('.v-card-subtitle', { hasText: label }) })
        .locator('.text-h5');
    const counts = main.locator('.v-list-item');

    return {
        /** At the year's URL, titled with the year. */
        async isShownFor({ plantingYear }) {
            const what = `showing the planting year ${plantingYear}`;

            await expectUrl(page, urlOf(`dashboard/planting-years/${plantingYear}`), what);
            await expectText(title, `Planting Year ${plantingYear}`, what);
        },

        /**
         * Its two dates, as `MMM D`, and how many of its plantings have each
         * status: `byStatus` maps a status to a count, and any left out is 0.
         */
        async showsYear({ plantingYear, lastFrostDate, targetPlantingDate }, byStatus) {
            const what = `the details of the planting year ${plantingYear}`;

            await expectText(dateUnder('Last Frost Date'), shortDate(lastFrostDate), what);
            await expectText(dateUnder('Target Planting Date'), shortDate(targetPlantingDate), what);
            await expectText(counts.locator('.text-h5'), statuses.map(each => String(byStatus[each] ?? 0)), what);
        },

        /**
         * Pinned (A15): while the year's own details are held, the page shows
         * the year viewed before, `last`. Then lets them go, and the page shows
         * `year`.
         */
        async showsTheLastYearViewedWhileLoading(year, last) {
            const what = `opening the planting year ${year.plantingYear}, after ${last.plantingYear}`;

            await expectUrl(page, urlOf(`dashboard/planting-years/${year.plantingYear}`), what);
            await expectText(title, `Planting Year ${last.plantingYear}`, what);
            callControl.release();
            await expectText(title, `Planting Year ${year.plantingYear}`, what);
        },
    };
}
