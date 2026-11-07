import { appUrl } from '../setup/config';

/** Opens `path` in the app, e.g. `dashboard/plots`; `''` is the login page. */
export async function openPath(page, path) {
    await page.goto(`${appUrl}${path}`);
}

/** The app's URL for `path`, for drivers to check where the browser is. */
export const urlOf = path => `${appUrl}${path}`;

/** For a URL to match literally inside a RegExp. */
export const escaped = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
