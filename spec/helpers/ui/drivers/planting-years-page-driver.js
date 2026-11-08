import { expectText, expectThat, expectVisible } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { escaped } from './urls';
import { serviceUrl } from '../setup/config';
import { status } from '../support/status-codes';

// Paths under the service's base, for the call control
const yearsPath = /^\/planting-years$/;
const yearPath = year => new RegExp(`^/planting-years/${year}$`);
// The same list call, by its full path, as service-calls.js records it
const yearsCallPath = new RegExp(`^${escaped(new URL(serviceUrl).pathname)}/planting-years$`);

// How the table shows a date: `MMM D`, of the date as the service sends it
const shortDate = dateString => {
    const [, month, day] = dateString.split('-').map(Number);
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} ${day}`;
};

/** The planting years page, as Playwright sees it. */
export function createPlantingYearsPageDriver(page, serviceCalls, callControl) {
    const main = page.getByRole('main');
    const rows = main.getByRole('table').getByRole('row').filter({ has: page.getByRole('cell') });
    // The table lists every year, unpaged, in a scrolling box
    const rowOf = year => rows.filter({ has: page.getByRole('cell', { name: String(year), exact: true }) });
    // Set by openWithTheListFailing, for the check that follows it
    let listFinished = Promise.resolve();

    return {
        ...createRoutedPageDriver(page, {
            name: 'the planting years page',
            path: 'dashboard/planting-years',
            marker: main => main.locator('.page-title', { hasText: /^Manage Planting Years$/ }),
        }),

        /** The year is listed with its target planting date and last frost date. */
        async listsYear({ plantingYear, targetPlantingDate, lastFrostDate }) {
            const what = `listing the planting year ${plantingYear}`;

            await expectVisible(rowOf(plantingYear), what);
            await expectText(rowOf(plantingYear).getByRole('cell'), [
                String(plantingYear), shortDate(targetPlantingDate), shortDate(lastFrostDate), /.*/,
            ], what);
        },

        /** Opens the year's details page, by its row's magnifier, named only by its glyph. */
        async viewYear({ plantingYear }) {
            await expectVisible(rowOf(plantingYear), `viewing the planting year ${plantingYear}`);
            await rowOf(plantingYear).locator('.mdi-magnify').click();
        },

        /** As `viewYear`, but the service's answer for the year is held until the details page lets it go. */
        async viewYearWhileItLoads(year) {
            await callControl.hold('GET', yearPath(year.plantingYear));
            await this.viewYear(year);
        },

        async addYear() {
            await main.getByRole('button', { name: 'Add Year' }).click();
        },

        /** Opens the page, with the service failing to list the years (500). */
        async openWithTheListFailing() {
            await callControl.fail('GET', yearsPath, status.serverError);
            listFinished = page.waitForEvent('requestfinished',
                request => request.method() === 'GET' && yearsCallPath.test(new URL(request.url()).pathname));
            await this.open();
        },

        /**
         * Pinned (A10): once the list has failed, the page shows no alert, and
         * no years. Nothing follows the failure to wait for, so this waits for
         * the failed call to finish, then two frames, for the store to take it
         * and the page to render, and reads the page once.
         */
        async saysNothingWhenTheYearsFailToLoad() {
            const what = 'the planting years page, after the list failed to load';

            // The page itself, so a failure that took it down can't pass for this
            await this.isShown();
            await listFinished;
            expectThat(serviceCalls.wereAnswered('GET', yearsCallPath, status.serverError),
                'the list call to have been answered with 500', 'another answer', what);
            await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
            expectThat(await main.locator('.v-alert').count() === 0, 'no alert', 'an alert', what);
            expectThat(await rows.count() === 0, 'no years listed', 'years listed', what);
        },
    };
}

export { shortDate };
