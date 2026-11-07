import { applicationId, authServiceUrl, serviceUrl } from '../setup/config';

/**
 * The only place the suite calls `fetch`: the two services, and the apps'
 * addresses for the preflight. The browser makes the app's own calls; this
 * is for the preflight, for signing on, for arranging what a test only
 * needs, and for cleaning up what a test created.
 *
 * Every call has a short timeout, so a request a service never answers
 * can't hang a run. Nothing here throws or asserts: each call resolves to
 * `{ status, body }`, or `{ error }` when no reply came, and the caller
 * decides what that means.
 */

const requestTimeoutMs = 5_000;

async function call(baseUrl, method, path, { token, body } = {}) {
    try {
        const response = await fetch(`${baseUrl}${path}`, {
            method,
            headers: {
                ...(body === undefined ? {} : { 'content-type': 'application/json' }),
                ...(token === undefined ? {} : { 'x-feral-auth-token': token }),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(requestTimeoutMs),
        });
        const text = await response.text();
        let parsed = text;
        try {
            parsed = JSON.parse(text);
        } catch {
            // not JSON; keep the text
        }
        return { status: response.status, body: parsed };
    } catch (err) {
        return { error: err.cause?.code || err.name || err.message };
    }
}

const auth = (method, path, options) => call(authServiceUrl, method, path, options);
const garden = (method, path, options) => call(serviceUrl, method, path, options);

// feral-authentication-service

/** Any reply means feral is up: without a token, this answers 401. It has no health route. */
export const pingAuth = () => auth('POST', '/tokens/verify');

/** Logs in for the app's application; `body.token` on success. */
export const login = (username, password) => auth('POST', '/login', {
    body: { username, password, applicationId },
});

/**
 * What feral's login page asks for once the user is in: a new session for the
 * app, as `body.redirectUrl`, which carries its single sign-on token as `?sso=`.
 */
export const signOnRedirect = token => auth('GET', `/login/${applicationId}`, { token });

/** Ends the session behind `token`. */
export const logout = token => auth('POST', '/logout', { token });

// vigilant-harvest-service

export const health = () => garden('GET', '/health');

export const listPlots = token => garden('GET', '/plots', { token });

/** Creates a plot, or updates the one with `plot.plotId`; the reply is the plot. */
export const upsertPlot = (token, plot) => garden('PUT', '/plots', { token, body: plot });

export const deletePlot = (token, plotId) => garden('DELETE', `/plots/${plotId}`, { token });

export const listPlants = token => garden('GET', '/plants', { token });

export const listPlantings = token => garden('GET', '/plantings', { token });

/** Each with its subcategories. */
export const listPlantCategories = token => garden('GET', '/plant-categories', { token });

export const listActivitySchedules = token => garden('GET', '/activity-schedules', { token });

export const listPlantingYears = token => garden('GET', '/planting-years', { token });

/** An app's own address, outside the services; any status. */
export async function probeApp(url) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(requestTimeoutMs) });
        return { status: response.status };
    } catch (err) {
        return { error: err.cause?.code || err.name || err.message };
    }
}
