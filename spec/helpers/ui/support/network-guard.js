import { appUrl, authAppUrl, authServiceUrl, serviceUrl } from '../setup/config';

// The only places the browser may reach: the app, the two services the suite
// checks and cleans up through, and feral's app, whose login page the
// round-trip spec goes through. Anything else could be a live service the app
// was built against (.env.production names them), and the suite must never
// write there
const allowedOrigins = new Set([appUrl, serviceUrl, authServiceUrl, authAppUrl].map(url => new URL(url).origin));

// The app loads Roboto from Google Fonts. Answered empty, so the browser falls
// back to another font rather than reaching out
const fontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

/**
 * Keeps a browser context to the local app and services. Every other request
 * is aborted before it leaves the machine, and remembered. Routes set on a
 * page take precedence over these.
 *
 * Call `check()` when the context is done with: it throws, naming each
 * blocked request, so a test that strayed fails with the reason rather than
 * only the timeout that followed.
 */
export async function guardNetwork(context) {
    const blocked = [];

    await context.route('**/*', route => {
        const url = new URL(route.request().url());

        if (allowedOrigins.has(url.origin)) {
            return route.continue();
        }
        if (fontHosts.has(url.hostname)) {
            return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        }
        blocked.push(`${route.request().method()} ${url.href}`);
        return route.abort('blockedbyclient');
    });

    return {
        blocked,

        check() {
            if (blocked.length > 0) {
                throw new Error(`${describeBlocked(blocked)} ${wiringHint}`);
            }
        },
    };
}

export const describeBlocked = blocked => 'The browser tried to reach somewhere other than the local '
    + `app and services, and was stopped:\n  ${blocked.join('\n  ')}\n`;

export const wiringHint = 'The app under test must call the services at UI_SERVICE_URL and '
    + 'UI_AUTH_SERVICE_URL. A production build (vite build, vite preview, npm run serve) reads '
    + '.env.production, which names the live services: run the suite against the dev server '
    + '(../start-vigilant-harvest.sh) instead.';
