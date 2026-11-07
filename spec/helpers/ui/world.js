import { randomInt, randomUUID } from 'node:crypto';

import { gardener } from './setup/config';
import { createDrivers } from './drivers/drivers';
import { FIXTURE_PREFIX, FIXTURE_YEARS } from './support/residue';
import { asGardener } from './support/sessions';
import { deletePlantingYear, deletePlot, listPlantingYears, listPlots, logout } from './support/service-client';

const suffix = () => randomUUID().slice(0, 8);
const failed = reply => reply.error !== undefined || reply.status >= 300;

// The app keeps the browser's session token here (src/utils/storage-utils.js)
const tokenKey = 'vigilant-token';

/**
 * How cleanup finds and deletes each kind of thing a test names. None has an
 * id the test can see, so each is looked up in its list by its unique name.
 */
const kinds = {
    plot: {
        list: listPlots,
        matches: (plot, listed) => listed.friendlyName === plot.friendlyName,
        remove: (token, listed) => deletePlot(token, listed.plotId),
        describe: plot => `the plot ${plot.friendlyName}`,
    },
    plantingYear: {
        list: listPlantingYears,
        matches: (year, listed) => listed.plantingYear === year.plantingYear,
        remove: (token, listed) => deletePlantingYear(token, listed.plantingYear),
        describe: year => `the planting year ${year.plantingYear}`,
    },
};

/**
 * Deletes what a test named, in the order given, over the API, as the
 * gardener. Best effort: something already gone is skipped, and a failure is
 * reported but never thrown, so it can't hide the test's own result. The
 * residue check after the run fails it if anything stays.
 */
async function deleteAll(named) {
    const remaining = () => named.map(({ kind, details }) => kinds[kind].describe(details)).join(', ');

    const result = await asGardener(async token => {
        const listed = {};
        for (const { kind, details } of named) {
            if (listed[kind] === undefined) {
                const reply = await kinds[kind].list(token);
                listed[kind] = Array.isArray(reply.body) ? reply.body : [];
            }
            const found = listed[kind].find(each => kinds[kind].matches(details, each));
            if (found) {
                const deleted = await kinds[kind].remove(token, found);
                if (failed(deleted)) {
                    console.warn(`cleanup: couldn't delete ${kinds[kind].describe(details)}: ${deleted.status ?? deleted.error}`);
                }
            }
        }
    });
    if (result?.error) {
        console.warn(`cleanup: ${result.error}, so these remain: ${remaining()}`);
    }
}

/**
 * Ends the browser's own session in feral. The app's Logout doesn't (backlog
 * A2), so without this every test would leave one open there. Best effort:
 * the page may be closed, or elsewhere.
 */
async function endBrowserSession(page) {
    try {
        const token = await page.evaluate(key => localStorage.getItem(key), tokenKey);
        if (token) {
            await logout(token);
        }
    } catch {
        // no page to read it from, or not the app's origin
    }
}

/**
 * What a spec has named so far, plus the drivers for this test.
 *
 * Page objects are stateless; a plot named on one page is checked on
 * another, so the names live here. `gardener` is reserved: it resolves to
 * the account in .env.ui.
 */
export function createWorld(page) {
    const plotsByAlias = new Map();
    const plantingYearsByAlias = new Map();
    // Newest first, the order cleanup deletes in
    const named = [];

    function known(map, alias, what, step) {
        const value = map.get(alias);
        if (value === undefined) {
            throw new Error(`no ${what} called "${alias}" in this test -- name one first with ${step}('${what}: ${alias}')`);
        }
        return { ...value };
    }

    // `kind` is a key of `kinds`, which says how cleanup deletes it
    function remember(kind, map, alias, details) {
        if (map.has(alias)) {
            throw new Error(`there is already ${kinds[kind].describe(details).replace(/^the /, 'a ')} called "${alias}" in this test`);
        }
        map.set(alias, details);
        named.unshift({ kind, details });
        return { ...details };
    }

    return {
        /** So a page object can be handed the driver it drives. */
        drivers: createDrivers(page),

        /**
         * Makes up the details of a new plot called `alias`, unique to this
         * run, and remembers them. From here on cleanup deletes any plot with
         * that name, so name the plot before the step that adds it.
         */
        newPlot(alias) {
            return remember('plot', plotsByAlias, alias, {
                friendlyName: `${FIXTURE_PREFIX}${alias}-${suffix()}`,
                lengthInInches: 96,
                widthInInches: 48,
                plotType: 'Raised Bed',
            });
        },

        plotNamed: alias => known(plotsByAlias, alias, 'plot', 'plotsPage.addPlot'),

        /**
         * As `newPlot`, for a planting year: a year from 8000 to 8999, picked at
         * random so parallel workers rarely meet, with its frost and planting
         * dates in that year.
         */
        newPlantingYear(alias) {
            const taken = new Set([...plantingYearsByAlias.values()].map(year => year.plantingYear));
            let plantingYear;
            do {
                plantingYear = randomInt(FIXTURE_YEARS.min, FIXTURE_YEARS.max + 1);
            } while (taken.has(plantingYear));
            return remember('plantingYear', plantingYearsByAlias, alias, {
                plantingYear,
                lastFrostDate: `${plantingYear}-04-15`,
                targetPlantingDate: `${plantingYear}-05-01`,
            });
        },

        plantingYearNamed: alias => known(plantingYearsByAlias, alias, 'year', 'garden.hasPlantingYear'),

        /** The username and password behind `user: <name>`. Only `gardener` for now. */
        credentialsFor(name) {
            if (name !== 'gardener') {
                throw new Error(`no user called "${name}": the suite signs on only as the reserved "gardener"`);
            }
            return { ...gardener };
        },

        /** Deletes what this test named, newest first, ends its session, and forgets it all. */
        async cleanup() {
            const toDelete = named.splice(0, named.length);
            plotsByAlias.clear();
            plantingYearsByAlias.clear();

            await endBrowserSession(page);
            if (toDelete.length > 0) {
                await deleteAll(toDelete);
            }
        },
    };
}
