import { chromium } from '@playwright/test';

import { appUrl, authServiceUrl, envFileHint, gardener, serviceUrl, startHint } from './config';
import { createLoginPageDriver } from '../drivers/login-page-driver';
import { recordServiceCalls } from '../drivers/service-calls';
import { describeBlocked, guardNetwork, wiringHint } from '../support/network-guard';
import { checkForResidue } from '../support/residue';
import { health, listPlots, logout, pingAuth, probeApp } from '../support/service-client';
import { asGardener } from '../support/sessions';

/**
 * Preflight: checks the services, the gardener's login and the app once,
 * before any test runs, and turns each way the suite can be misconfigured
 * into a message naming the fix, rather than a wall of identical timeouts.
 *
 * It returns the run's teardown, the residue check, rather than naming a
 * second file, so a failed preflight isn't followed by a teardown burying its
 * message.
 *
 * The suite never starts anything; ../start-vigilant-harvest.sh does.
 */

const describe = reply => reply.error || `status ${reply.status}`;

export default async function globalSetup() {
    if (!gardener.username || !gardener.password) {
        throw new Error(`UI_GARDENER_USERNAME and UI_GARDENER_PASSWORD are not set. ${envFileHint}`);
    }

    const auth = await pingAuth();
    if (auth.error) {
        throw new Error(`feral-authentication-service is not answering at ${authServiceUrl} (${auth.error}). ${startHint}`);
    }

    const service = await health();
    if (service.error || service.status !== 200) {
        throw new Error(`vigilant-harvest-service is not answering at ${serviceUrl} (${describe(service)}). ${startHint}`);
    }

    const plots = await asGardener(token => listPlots(token));
    if (plots.error) {
        throw new Error(`${plots.error}. Check UI_GARDENER_USERNAME and UI_GARDENER_PASSWORD in `
            + 'spec/helpers/ui/.env.ui. A 403 means the user has no grant to the application '
            + '(UI_APPLICATION_ID): the service\'s acceptance README says how to give it one.');
    }
    if (plots.status !== 200) {
        throw new Error(`vigilant-harvest-service refused the gardener's token (${describe(plots)}). `
            + 'Its SESSION_PUBLIC_KEY must be the public half of the key feral signs the '
            + 'application\'s tokens with.');
    }

    const app = await probeApp(appUrl);
    if (app.error || app.status !== 200) {
        throw new Error(`the app is not answering at ${appUrl} (${describe(app)}). ${startHint}`);
    }

    await checkAppCallsTheServices();

    return checkForResidue;
}

/**
 * The checks above reach the services the suite was told about; the app in
 * the browser calls whichever ones it was built with. So sign on through the
 * page, and check where its calls went: the token's exchange to feral, then
 * the dashboard's first load to the vigilant service. The network guard
 * aborts either before it leaves if it's going anywhere else.
 *
 * The token is minted locally, for a user that exists only locally, and is
 * good for one exchange, so a misdirected browser has nothing to use there.
 */
async function checkAppCallsTheServices() {
    const browser = await chromium.launch();

    try {
        const context = await browser.newContext();
        const guard = await guardNetwork(context);
        const page = await context.newPage();
        const serviceCalls = recordServiceCalls(page);
        const requestTo = (method, ending) => page.waitForRequest(
            request => request.method() === method && new URL(request.url()).pathname.endsWith(ending),
            { timeout: 15_000 },
        ).catch(() => undefined);
        const exchange = requestTo('POST', '/tokens/sso/execute');
        const years = requestTo('GET', '/planting-years');

        await createLoginPageDriver(page, serviceCalls).logIn(gardener);
        const exchanged = await exchange;
        const loaded = await years;

        if (guard.blocked.length > 0) {
            throw new Error(`${describeBlocked(guard.blocked)}${wiringHint}`);
        }
        if (!exchanged) {
            throw new Error(`signing on at ${appUrl}landing sent no token to feral. Is UI_APP_URL vigilant-harvest-app?`);
        }
        if (exchanged.url() !== `${authServiceUrl}/tokens/sso/execute`) {
            throw new Error(`the app signs on at ${exchanged.url()}, not at ${authServiceUrl}. ${wiringHint}`);
        }
        // Reaching feral isn't enough: if its CORS_ORIGINS doesn't list the app,
        // the browser hides the answer, and the sign-on fails
        const exchangeAnswer = await exchanged.response();
        if (!exchangeAnswer || exchanged.failure()) {
            const why = exchanged.failure()?.errorText ?? 'no response';
            throw new Error(`the browser couldn't read feral's answer to the sign-on (${why}). If it blocked it `
                + `for CORS, add ${new URL(appUrl).origin} to CORS_ORIGINS in feral-authentication-service's .env, `
                + 'and restart it.');
        }
        if (!loaded) {
            throw new Error(`signing on reached feral, which answered ${exchangeAnswer.status()}, but the dashboard `
                + 'never asked the service for the planting years.');
        }
        if (!loaded.url().startsWith(`${serviceUrl}/`)) {
            throw new Error(`the app reads the garden from ${loaded.url()}, not from ${serviceUrl}. ${wiringHint}`);
        }

        // Reaching the service isn't enough: if its CORS settings don't list the
        // app, the browser hides the answer
        const answer = await loaded.response();
        if (!answer || answer.status() !== 200 || loaded.failure()) {
            throw new Error(`the dashboard's call to ${loaded.url()} failed (${loaded.failure()?.errorText ?? answer?.status()}). `
                + `If the browser blocked it for CORS, let ${new URL(appUrl).origin} through in `
                + 'vigilant-harvest-service\'s settings, and restart it.');
        }

        const token = await page.evaluate(() => localStorage.getItem('vigilant-token'));
        if (token) {
            await logout(token);
        }
    } finally {
        await browser.close();
    }
}
