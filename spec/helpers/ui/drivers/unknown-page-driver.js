import { expectText, expectUrl, expectVisible } from './assertions';
import { openPath, urlOf } from './urls';

/** A path the router has no route for, as Playwright sees it. */
export function createUnknownPageDriver(page) {
    const main = page.getByRole('main');

    return {
        async open(path) {
            await openPath(page, path);
        },

        /** At `path`, the not-found page says there's no page there. */
        async saysNoPageAt(path) {
            const what = `visiting ${path}, which the app has no page for`;

            await expectUrl(page, urlOf(path), what);
            await expectVisible(main.getByRole('heading', { name: 'Page not found' }), what);
            await expectText(main.locator('p'), `There's no page at /${path}.`, what);
        },
    };
}
