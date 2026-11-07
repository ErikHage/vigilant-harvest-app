import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Where the suite finds the app and the services, and who it signs on as.
 * The URL defaults match ../start-vigilant-harvest.sh. Everything can be set
 * from the shell; values in spec/helpers/ui/.env.ui fill in the rest.
 */

// Playwright compiles the suite to CommonJS (the package isn't "type":
// "module"), so __dirname is defined and import.meta is not
const envFile = path.join(__dirname, '..', '.env.ui');

// Values already set in the shell win over the file
if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
}

const withTrailingSlash = url => (url.endsWith('/') ? url : `${url}/`);
const withoutTrailingSlash = url => url.replace(/\/+$/, '');

// The suite adds and deletes garden data, so it only ever runs against
// services on this machine
const localHosts = ['localhost', '127.0.0.1', '[::1]'];

function localOnly(name, url) {
    if (!localHosts.includes(new URL(url).hostname)) {
        throw new Error(`${name} is ${url}, which isn't on this machine. The UI suite only runs `
            + `against a local app and services (${localHosts.join(', ')}).`);
    }
    return url;
}

// baseURL must end in a slash, or page.goto('dashboard') drops the app's
// base path
export const appUrl = localOnly('UI_APP_URL', withTrailingSlash(
    process.env.UI_APP_URL || 'http://localhost:5174/apps/vigilant-harvest/'));

/** vigilant-harvest-service, which holds the garden. */
export const serviceUrl = localOnly('UI_SERVICE_URL', withoutTrailingSlash(
    process.env.UI_SERVICE_URL || 'http://localhost:8002/api/vigilant-harvest-service/v0'));

/** feral-authentication-service, which signs the gardener on. */
export const authServiceUrl = localOnly('UI_AUTH_SERVICE_URL', withoutTrailingSlash(
    process.env.UI_AUTH_SERVICE_URL || 'http://localhost:8003/api/feral-authentication-service/v0'));

/** feral-authentication's app, whose login page the round-trip spec goes through. */
export const authAppUrl = localOnly('UI_AUTH_APP_URL', withTrailingSlash(
    process.env.UI_AUTH_APP_URL || 'http://localhost:5173/auth/'));

// The application the app signs on to (its VITE_APPLICATION_ID). The
// gardener needs a grant to it, or feral refuses the login with a 403
export const applicationId = process.env.UI_APPLICATION_ID
    || '82d7d287-978b-4df1-bc3d-526838b2465b';

/** The reserved `user: gardener`. Empty when .env.ui is missing; the preflight says so. */
export const gardener = {
    username: process.env.UI_GARDENER_USERNAME || '',
    password: process.env.UI_GARDENER_PASSWORD || '',
};

export const envFileHint = 'Copy spec/helpers/ui/.env.ui.example to spec/helpers/ui/.env.ui and fill it in.';

export const startHint = 'Start them with ../start-vigilant-harvest.sh (the services need MySQL), '
    + 'or point the UI_*_URL settings at running ones.';
