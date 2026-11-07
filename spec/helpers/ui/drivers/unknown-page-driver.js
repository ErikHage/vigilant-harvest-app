import { expectThat, expectUrl, expectVisible } from './assertions';
import { openPath, urlOf } from './urls';

/** A path the router has no route for, as Playwright sees it. */
export function createUnknownPageDriver(page) {
    const main = page.getByRole('main');
    const appBarTitle = page.getByRole('banner').getByText('Vigilant Harvest');

    return {
        async open(path) {
            await openPath(page, path);
        },

        /**
         * The browser stayed at `path`, and the page shows nothing but the app
         * bar: no route matches, so nothing renders, and nothing sends the
         * visitor elsewhere (backlog A8). The app bar showing is the sign that
         * the app has rendered; then the main area is read once.
         */
        async isEmptyAt(path) {
            const what = `visiting ${path}, which the app has no page for`;

            await expectUrl(page, urlOf(path), what);
            await expectVisible(appBarTitle, what);
            const shown = (await main.innerText()).trim();
            expectThat(shown === '', 'an empty main area', JSON.stringify(shown), what);
        },
    };
}
