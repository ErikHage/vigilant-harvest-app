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

/** Creates a plant, or updates the one with `plant.plantId`; the reply is the plant. */
export const upsertPlant = (token, plant) => garden('PUT', '/plants', { token, body: plant });

export const deletePlant = (token, plantId) => garden('DELETE', `/plants/${plantId}`, { token });

/** Assigns and unassigns schedules, each a list of ids. */
export const assignPlantSchedules = (token, plantId, { assign = [], unassign = [] }) =>
    garden('PUT', `/plants/${plantId}/activity-schedules`, { token, body: { assign, unassign } });

/** Every planting, of every year. */
export const listPlantings = token => garden('GET', '/plantings', { token });

/** The reply is the planting, CREATED, with its id. */
export const insertPlanting = (token, planting) => garden('POST', '/plantings', { token, body: planting });

/** `action` is START, PLANT, SPLIT, RETIRE, COMMENT or DELETE; the reply is the planting. */
export const performPlantingAction = (token, plantingId, actionType, data) =>
    garden('POST', `/plantings/${plantingId}`, { token, body: { actionType, ...data } });

export const deletePlanting = (token, plantingId) => garden('DELETE', `/plantings/${plantingId}`, { token });

/** Every harvest filed under the planting year, each with its id and planting's id. */
export const searchHarvests = (token, year) => garden('GET', `/harvests/search?year=${year}`, { token });

/** Files harvests: each a planting's id, a quantity and an instant, of its plant's default type. */
export const upsertHarvests = (token, harvests) => garden('PUT', '/harvests', { token, body: { harvests } });

export const deleteHarvest = (token, harvestId) => garden('DELETE', `/harvests/${harvestId}`, { token });

/** The year's journal entries, each with its id. */
export const listJournalEntries = (token, plantingYear) => garden('GET', `/journal/${plantingYear}`, { token });

/** Records a journal entry: `{ plantingYear, entryDate, entry }`, the date an instant. */
export const insertJournalEntry = (token, entry) => garden('PUT', '/journal', { token, body: entry });

export const deleteJournalEntry = (token, entryId) => garden('DELETE', `/journal/entries/${entryId}`, { token });

/** The year's activity-log entries, each with its id. */
export const listActivityLog = (token, plantingYear) => garden('GET', `/activity-log/${plantingYear}`, { token });

export const deleteActivityLogEntry = (token, entryId) => garden('DELETE', `/activity-log/entries/${entryId}`, { token });

/** Each with its subcategories. */
export const listPlantCategories = token => garden('GET', '/plant-categories', { token });

/** The reply is the category, with its id. */
export const insertPlantCategory = (token, categoryName) =>
    garden('POST', '/plant-categories', { token, body: { categoryName } });

/** Refused (409) while it has subcategories. */
export const deletePlantCategory = (token, categoryId) => garden('DELETE', `/plant-categories/${categoryId}`, { token });

/** The reply is the subcategory, with its id. */
export const insertPlantSubcategory = (token, categoryId, subcategoryName) =>
    garden('POST', `/plant-categories/${categoryId}/plant-subcategories`, { token, body: { subcategoryName } });

export const deletePlantSubcategory = (token, categoryId, subcategoryId) =>
    garden('DELETE', `/plant-categories/${categoryId}/plant-subcategories/${subcategoryId}`, { token });

/** The service's fixed list of harvest types, each an id and a name. */
export const listHarvestTypes = token => garden('GET', '/harvest-types', { token });

export const listActivitySchedules = token => garden('GET', '/activity-schedules', { token });

/** The reply is the schedule, with its id. */
export const insertActivitySchedule = (token, schedule) =>
    garden('POST', '/activity-schedules', { token, body: schedule });

/** Adds an item to the schedule: its activity, rule, dates and notes. */
export const insertScheduleItem = (token, activityScheduleId, item) =>
    garden('POST', `/activity-schedules/${activityScheduleId}/schedule-items`, { token, body: item });

/** Answers 204. Its items, and its assignments to plants, go with it. */
export const deleteActivitySchedule = (token, activityScheduleId) =>
    garden('DELETE', `/activity-schedules/${activityScheduleId}`, { token });

export const listPlantingYears = token => garden('GET', '/planting-years', { token });

/** Creates a planting year; the reply is empty. */
export const insertPlantingYear = (token, year) => garden('PUT', '/planting-years', { token, body: year });

export const deletePlantingYear = (token, plantingYear) => garden('DELETE', `/planting-years/${plantingYear}`, { token });

/** An app's own address, outside the services; any status. */
export async function probeApp(url) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(requestTimeoutMs) });
        return { status: response.status };
    } catch (err) {
        return { error: err.cause?.code || err.name || err.message };
    }
}
