import { appUrl, serviceUrl } from '../setup/config';

const appOrigin = new URL(appUrl).origin;

/**
 * Holds or fails the app's own calls to the service, for pins on how a page
 * takes a slow or failed load. A held or failed call is still recorded by
 * `service-calls.js`. Everything else falls through to the network guard.
 *
 * Only calls to the service match, by their path under its base: the app's
 * own pages have paths like the service's (`dashboard/planting-years`), and
 * failing one of those fails the page itself, not its call.
 */
export function controlServiceCalls(page) {
    let release = () => {};

    const matching = (method, path) => request => request.method() === method
        && request.url().startsWith(serviceUrl)
        && path.test(request.url().slice(serviceUrl.length).split('?')[0]);

    return {
        /**
         * Holds each `method` call to a path under the service matching `path`
         * (a RegExp, `/^\/planting-years$/`), until `release`.
         */
        async hold(method, path) {
            const gate = new Promise(resolve => {
                release = resolve;
            });
            const held = matching(method, path);
            await page.route(() => true, async route => {
                if (held(route.request())) {
                    await gate;
                }
                await route.fallback();
            });
        },

        /** Lets the held calls go on. */
        release() {
            release();
        },

        /**
         * Answers each `method` call to a path matching `path` with `status`
         * and an error body, as the service would, with the CORS header the
         * browser needs to read it.
         */
        async fail(method, path, status) {
            const failed = matching(method, path);
            await page.route(() => true, async route => {
                if (!failed(route.request())) {
                    await route.fallback();
                    return;
                }
                await route.fulfill({
                    status,
                    contentType: 'application/json',
                    headers: { 'access-control-allow-origin': appOrigin },
                    body: JSON.stringify({ errors: [{ name: 'FeralError', message: 'failed by the UI suite', status }] }),
                });
            });
        },
    };
}
