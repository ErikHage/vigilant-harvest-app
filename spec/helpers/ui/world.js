import { randomInt, randomUUID } from 'node:crypto';

import { gardener } from './setup/config';
import { createDrivers } from './drivers/drivers';
import { FIXTURE_PREFIX, FIXTURE_YEARS } from './support/residue';
import { asGardener } from './support/sessions';
import {
    deleteActivitySchedule, deletePlant, deletePlantCategory, deletePlantSubcategory, deletePlantingYear, deletePlot,
    listActivitySchedules, listPlantCategories, listPlantingYears, listPlants, listPlots, logout,
} from './support/service-client';

const suffix = () => randomUUID().slice(0, 8);
const failed = reply => reply.error !== undefined || reply.status >= 300;

// Every subcategory, each with its category's id and name, as one list
async function listPlantSubcategories(token) {
    const reply = await listPlantCategories(token);
    if (!Array.isArray(reply.body)) {
        return reply;
    }
    return {
        ...reply,
        body: reply.body.flatMap(category => (category.subcategories ?? []).map(subcategory => ({
            ...subcategory, categoryId: category.categoryId, categoryName: category.categoryName,
        }))),
    };
}

// The app keeps the browser's session token here (src/utils/storage-utils.js)
const tokenKey = 'vigilant-token';

/**
 * How cleanup finds and deletes each kind of thing a test names. None has an
 * id the test can see, so each is looked up in its list by its unique name.
 * A category goes only once its subcategories have, and a subcategory once
 * its plants have, which newest first gives.
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
    plant: {
        list: listPlants,
        // A plant renamed on the page is found by either name, saved or not
        matches: (plant, listed) => [plant.friendlyName, ...plant.formerNames].includes(listed.friendlyName),
        remove: (token, listed) => deletePlant(token, listed.plantId),
        describe: plant => `the plant ${plant.friendlyName}`,
    },
    plantCategory: {
        list: listPlantCategories,
        matches: (category, listed) => listed.categoryName === category.categoryName,
        remove: (token, listed) => deletePlantCategory(token, listed.categoryId),
        describe: category => `the plant category ${category.categoryName}`,
    },
    plantSubcategory: {
        list: listPlantSubcategories,
        matches: (subcategory, listed) => listed.subcategoryName === subcategory.subcategoryName
            && listed.categoryName === subcategory.categoryName,
        remove: (token, listed) => deletePlantSubcategory(token, listed.categoryId, listed.subcategoryId),
        describe: subcategory => `the plant subcategory ${subcategory.subcategoryName}`,
    },
    activitySchedule: {
        list: listActivitySchedules,
        matches: (schedule, listed) => listed.name === schedule.name,
        remove: (token, listed) => deleteActivitySchedule(token, listed.activityScheduleId),
        describe: schedule => `the activity schedule ${schedule.name}`,
    },
};

// What a plant added through the Add dialog has besides what the dialog asks
// for: the service's defaults
const emptyPlant = {
    tags: [],
    taxonomy: { family: null, genus: null, species: null },
    sowing: { indoor: null, direct: null, germinationDaysRange: null, germinationTempRange: null, sowingNotes: null },
    planting: { depthInInches: null, plantSpacingInches: null, rowSpacingInches: null, instructions: null },
    growing: {
        requiredSun: null, daysToMaturity: null, isClimbing: false, climbingHeightFeet: null, plantSize: null,
        growingNotes: null,
    },
    harvesting: { fruitSize: null, shelfStability: null, harvestInstructions: null },
};

// A deep copy, so a step can't change the world's details behind its back
const copyOf = details => structuredClone(details);

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
    const categoriesByAlias = new Map();
    const subcategoriesByAlias = new Map();
    const plantsByAlias = new Map();
    const schedulesByAlias = new Map();
    const aliasMaps = [
        plotsByAlias, plantingYearsByAlias, categoriesByAlias, subcategoriesByAlias, plantsByAlias, schedulesByAlias,
    ];
    // Newest first, the order cleanup deletes in
    const named = [];

    function known(map, alias, what, step) {
        const value = map.get(alias);
        if (value === undefined) {
            throw new Error(`no ${what} called "${alias}" in this test -- name one first with ${step}('${what}: ${alias}')`);
        }
        return copyOf(value);
    }

    // `kind` is a key of `kinds`, which says how cleanup deletes it
    function remember(kind, map, alias, details) {
        if (map.has(alias)) {
            throw new Error(`there is already ${kinds[kind].describe(details).replace(/^the /, 'a ')} called "${alias}" in this test`);
        }
        map.set(alias, details);
        named.unshift({ kind, details });
        return copyOf(details);
    }

    const madeUpName = alias => `${FIXTURE_PREFIX}${alias}-${suffix()}`;

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

        /** As `newPlot`, for a plant category, with no subcategories. */
        newCategory(alias) {
            return remember('plantCategory', categoriesByAlias, alias, { categoryName: madeUpName(alias) });
        },

        categoryNamed: alias => known(categoriesByAlias, alias, 'category', 'garden.hasCategory'),

        /** As `newPlot`, for a subcategory of the category called `categoryAlias`. */
        newSubcategory(alias, categoryAlias) {
            const { categoryName } = known(categoriesByAlias, categoryAlias, 'category', 'garden.hasCategory');
            return remember('plantSubcategory', subcategoriesByAlias, alias, {
                subcategoryName: madeUpName(alias), categoryName,
            });
        },

        subcategoryNamed: alias => known(subcategoriesByAlias, alias, 'subcategory', 'garden.hasSubcategory'),

        /**
         * As `newPlot`, for a plant in the subcategory called `subcategoryAlias`,
         * with every field made up, and `tags` as given. Its default harvest
         * type is by name; the service's id for it is the driver's to look up.
         */
        newPlant(alias, subcategoryAlias, tags) {
            const { categoryName, subcategoryName } = known(subcategoriesByAlias, subcategoryAlias, 'subcategory',
                'garden.hasSubcategory');
            return remember('plant', plantsByAlias, alias, {
                friendlyName: madeUpName(alias),
                formerNames: [],
                categoryName,
                subcategoryName,
                lifespanType: 'Perennial',
                tags,
                description: 'Made up by the UI suite.\nOn two lines.',
                taxonomy: { family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum' },
                sowing: {
                    indoor: '6 weeks before last frost', direct: 'Not recommended', germinationDaysRange: '5-10',
                    germinationTempRange: '70-85F', sowingNotes: 'Keep the soil moist.',
                },
                planting: {
                    depthInInches: 0.25, plantSpacingInches: 24, rowSpacingInches: 36,
                    instructions: 'Bury the stem up to the first leaves.',
                },
                growing: {
                    requiredSun: 'Full Sun (>= 6 hours)', daysToMaturity: 75, isClimbing: true,
                    climbingHeightFeet: 6, plantSize: 'Tall', growingNotes: 'Stake it early.',
                },
                harvesting: {
                    defaultHarvestType: 'count', fruitSize: 'Small', shelfStability: 'A week',
                    harvestInstructions: 'Pick when fully coloured.',
                },
            });
        },

        /**
         * As `newPlant`, for a plant added through the Add dialog: only what the
         * dialog asks for is made up, and the rest is as the service leaves it.
         */
        newPlantFromDialog(alias, subcategoryAlias) {
            const { categoryName, subcategoryName } = known(subcategoriesByAlias, subcategoryAlias, 'subcategory',
                'garden.hasSubcategory');
            return remember('plant', plantsByAlias, alias, {
                ...copyOf(emptyPlant),
                friendlyName: madeUpName(alias),
                formerNames: [],
                categoryName,
                subcategoryName,
                lifespanType: 'Annual',
                description: 'Added through the dialog.\nOn two lines.',
                harvesting: { ...emptyPlant.harvesting, defaultHarvestType: 'count' },
            });
        },

        plantNamed: alias => known(plantsByAlias, alias, 'plant', 'garden.hasPlant'),

        /**
         * Makes up new values for the plant called `alias`, a name, a family and
         * a description, and remembers them as the plant's from now on. Cleanup
         * finds the plant by its old name too, in case they're never saved.
         */
        editPlant(alias) {
            known(plantsByAlias, alias, 'plant', 'garden.hasPlant');
            const plant = plantsByAlias.get(alias);
            plant.formerNames.push(plant.friendlyName);
            plant.friendlyName = madeUpName(alias);
            plant.taxonomy.family = 'Rosaceae';
            plant.description = 'Edited by the UI suite.';
            return copyOf(plant);
        },

        /** A name for the plant called `alias` that is typed but never saved. */
        unsavedPlantName(alias) {
            known(plantsByAlias, alias, 'plant', 'garden.hasPlant');
            return madeUpName(`${alias}-unsaved`);
        },

        /** As `newPlot`, for an activity schedule, with no items. */
        newSchedule(alias) {
            return remember('activitySchedule', schedulesByAlias, alias, {
                name: madeUpName(alias), description: 'Made up by the UI suite.',
            });
        },

        scheduleNamed: alias => known(schedulesByAlias, alias, 'schedule', 'garden.hasSchedule'),

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
            aliasMaps.forEach(map => map.clear());

            await endBrowserSession(page);
            if (toDelete.length > 0) {
                await deleteAll(toDelete);
            }
        },
    };
}
