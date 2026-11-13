import { randomInt, randomUUID } from 'node:crypto';

import { gardener } from './setup/config';
import { createDrivers } from './drivers/drivers';
import { FIXTURE_PREFIX, FIXTURE_YEARS } from './support/residue';
import { asGardener } from './support/sessions';
import { status } from './support/status-codes';
import {
    deleteActivitySchedule, deletePlant, deletePlantCategory, deletePlantSubcategory, deletePlanting,
    deletePlantingYear, deletePlot, listActivitySchedules, listPlantCategories, listPlantingYears, listPlantings,
    listPlants, listPlots, logout, searchHarvests, deleteHarvest, listJournalEntries, deleteJournalEntry,
    listActivityLog, deleteActivityLogEntry,
} from './support/service-client';

const suffix = () => randomUUID().slice(0, 8);
const isLeapYear = year => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

// The fixture years are split in slices, one for each worker running at
// once, so two workers never pick the same year: one's 409 would fail its
// test, and its cleanup, finding the year by number, would delete the
// other's journal and log entries. Playwright numbers the workers running
// at once from 0; past 8 of them, slices are shared again
const YEAR_SLICES = 8;
function yearSlice() {
    const size = Math.floor((FIXTURE_YEARS.max - FIXTURE_YEARS.min + 1) / YEAR_SLICES);
    const first = FIXTURE_YEARS.min + (Number(process.env.TEST_PARALLEL_INDEX ?? 0) % YEAR_SLICES) * size;
    // randomInt's upper bound is exclusive: the slice's last year is left out
    return { first, last: first + size - 1 };
}
const failed = reply => reply.error !== undefined || reply.status >= 300;

// For each [list, matches, remove]: lists, and removes what matches, warning
// of what it couldn't. What hangs off a thing the test named, deleted first
async function deleteEach(token, ...lists) {
    for (const [list, matches, remove] of lists) {
        const reply = await list();
        for (const each of (Array.isArray(reply.body) ? reply.body : []).filter(matches)) {
            const deleted = await remove(each);
            if (failed(deleted)) {
                console.warn(`cleanup: couldn't delete ${JSON.stringify(each).slice(0, 120)}: ${deleted.status ?? deleted.error}`);
            }
        }
    }
}

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
        // A plot renamed on the page is found by either name, saved or not
        matches: (plot, listed) => [plot.friendlyName, ...plot.formerNames].includes(listed.friendlyName),
        remove: (token, listed) => deletePlot(token, listed.plotId),
        describe: plot => `the plot ${plot.friendlyName}`,
    },
    planting: {
        list: listPlantings,
        matches: (planting, listed) => [planting.name, ...planting.formerNames].includes(listed.name),
        // Its harvests first: they're the test's, and hold it (409). The list
        // sends `plantingYears` empty, so its current year is searched too
        remove: async (token, listed) => {
            const years = new Set([listed.currentPlantingYear, ...(listed.plantingYears ?? [])]);
            await deleteEach(token, ...[...years].map(year => [
                () => searchHarvests(token, year),
                harvest => harvest.plantingId === listed.plantingId,
                harvest => deleteHarvest(token, harvest.harvestId),
            ]));
            return deletePlanting(token, listed.plantingId);
        },
        describe: planting => `the planting ${planting.name}`,
    },
    plantingYear: {
        list: listPlantingYears,
        matches: (year, listed) => listed.plantingYear === year.plantingYear,
        // Its journal and activity-log entries first: a year the test named is
        // a fixture year, so everything filed under it is the test's
        remove: async (token, listed) => {
            await deleteEach(token,
                [() => listJournalEntries(token, listed.plantingYear), () => true,
                    entry => deleteJournalEntry(token, entry.entryId)],
                [() => listActivityLog(token, listed.plantingYear), () => true,
                    entry => deleteActivityLogEntry(token, entry.entryId)]);
            return deletePlantingYear(token, listed.plantingYear);
        },
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
        // A schedule renamed on the page is found by either name, saved or
        // not. Its items go with it
        matches: (schedule, listed) => [schedule.name, ...schedule.formerNames].includes(listed.name),
        remove: (token, listed) => deleteActivitySchedule(token, listed.activityScheduleId),
        describe: schedule => `the activity schedule ${schedule.name}`,
    },
};

// What a plant added through the Add dialog has besides what the dialog asks
// for: the service's defaults
const emptyPlant = {
    tags: [],
    taxonomy: { family: null, genus: null, species: null, cultivar: null },
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

// A planting as it is once created: named, of a plant in a year, with
// nothing sown or planted yet. Dates are `YYYY-MM-DD`, as the details tab
// shows them; `comments` are those added on the page, oldest first. A harvest
// is of its plant's default type; `harvests` are each a day, `YYYY-MM-DD`
// (null if the page chose it), and a quantity, and `harvested` tallies them
const newPlantingDetails = (alias, plant, plantingYear) => ({
    name: `${FIXTURE_PREFIX}${alias}-${suffix()}`,
    formerNames: [],
    plantName: plant.friendlyName,
    harvestType: plant.harvesting.defaultHarvestType,
    harvests: [],
    harvested: 0,
    plantingYear,
    seedSource: 'Seed Savers',
    lotNumber: 'LOT-7',
    leadTimeWeeks: 6,
    targetPlantingDate: null,
    status: 'CREATED',
    numberSown: null,
    sowDate: null,
    plotName: null,
    numberTransplanted: null,
    transplantDate: null,
    comments: [],
});

/**
 * Deletes what a test named, in the order given, over the API, as the
 * gardener. Best effort: something already gone is skipped, and a failure is
 * reported but never thrown, so it can't hide the test's own result. The
 * residue check after the run fails it if anything stays.
 */
async function deleteAll(named) {
    const remaining = () => named.map(({ kind, details }) => kinds[kind].describe(details)).join(', ');

    const result = await asGardener(async token => {
        // Each pass lists afresh, and deletes what it finds, in order
        async function pass(toDelete, warn) {
            const listed = {};
            const refused = [];
            for (const each of toDelete) {
                const { kind, details } = each;
                if (listed[kind] === undefined) {
                    const reply = await kinds[kind].list(token);
                    listed[kind] = Array.isArray(reply.body) ? reply.body : [];
                }
                const found = listed[kind].find(listedOne => kinds[kind].matches(details, listedOne));
                if (found) {
                    const deleted = await kinds[kind].remove(token, found);
                    if (deleted.status === status.conflict && !warn) {
                        refused.push(each);
                    } else if (failed(deleted)) {
                        console.warn(`cleanup: couldn't delete ${kinds[kind].describe(details)}: ${deleted.status ?? deleted.error}`);
                    }
                }
            }
            return refused;
        }

        // Newest first is right but for what the service made on the side: a
        // planting carried forward into a year the test added is older than
        // that year, and holds it (409). So what's refused is tried once more,
        // after the rest
        const refused = await pass(named, false);
        if (refused.length > 0) {
            await pass(refused, true);
        }
    });
    if (result?.error) {
        console.warn(`cleanup: ${result.error}, so these remain: ${remaining()}`);
    }
}

/**
 * Ends the browser's own session in feral. Most tests never press Logout, so
 * without this every test would leave one open there. Best effort: the page
 * may be closed, or elsewhere, and a session already ended is refused (401).
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
    // Schedule items: not deleted on their own, but with their schedule
    const scheduleItemsByAlias = new Map();
    const plantingsByAlias = new Map();
    // Journal and activity-log entries: not deleted on their own, but with their year
    const entriesByAlias = new Map();
    // Names typed for a plant but never saved, so nothing to delete
    const unsavedNamesByAlias = new Map();
    let unknownPlantingId;
    const aliasMaps = [
        plotsByAlias, plantingYearsByAlias, categoriesByAlias, subcategoriesByAlias, plantsByAlias, schedulesByAlias,
        plantingsByAlias, entriesByAlias, scheduleItemsByAlias, unsavedNamesByAlias,
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
                formerNames: [],
                lengthInInches: 96,
                widthInInches: 48,
                plotType: 'Raised Bed',
            });
        },

        plotNamed: alias => known(plotsByAlias, alias, 'plot', 'plotsPage.addPlot'),

        /**
         * Makes up new details for the plot called `alias`, a name, sizes and
         * type, and remembers them as the plot's from now on. Cleanup finds the
         * plot by its old name too, in case they're never saved.
         */
        editPlot(alias) {
            known(plotsByAlias, alias, 'plot', 'plotsPage.addPlot');
            const plot = plotsByAlias.get(alias);
            plot.formerNames.push(plot.friendlyName);
            Object.assign(plot, { friendlyName: madeUpName(alias), lengthInInches: 120, widthInInches: 36, plotType: 'Planter' });
            return copyOf(plot);
        },

        /**
         * As `newPlot`, for a planting of the plant called `plantAlias` in the
         * planting year called `yearAlias`, as it is once created: its seed
         * source, lot, lead time and target planting date made up, nothing
         * sown or planted yet.
         */
        newPlanting(alias, plantAlias, yearAlias) {
            const plant = known(plantsByAlias, plantAlias, 'plant', 'garden.hasPlant');
            const { plantingYear } = known(plantingYearsByAlias, yearAlias, 'year', 'garden.hasPlantingYear');
            return remember('planting', plantingsByAlias, alias, {
                ...newPlantingDetails(alias, plant, plantingYear),
                targetPlantingDate: `${plantingYear}-05-01`,
            });
        },

        /** As `newPlanting`, for one added through the Add dialog, which asks for no target date. */
        newPlantingFromDialog(alias, plantAlias, yearAlias) {
            const plant = known(plantsByAlias, plantAlias, 'plant', 'garden.hasPlant');
            const { plantingYear } = known(plantingYearsByAlias, yearAlias, 'year', 'garden.hasPlantingYear');
            return remember('planting', plantingsByAlias, alias, newPlantingDetails(alias, plant, plantingYear));
        },

        /**
         * As `newPlanting`, for a planting split from the one called
         * `sourceAlias`, with `count` of its seedlings. It's like its source,
         * started, and the source keeps what's left.
         */
        newSplit(alias, sourceAlias, count) {
            const source = known(plantingsByAlias, sourceAlias, 'planting', 'garden.hasPlanting');
            plantingsByAlias.get(sourceAlias).numberSown -= count;
            return remember('planting', plantingsByAlias, alias, {
                ...source, name: madeUpName(alias), formerNames: [], numberSown: count, comments: [],
            });
        },

        /**
         * Planting out fewer seedlings than were sown, the service splits the
         * rest off as a planting of their own, still started, named for its
         * source: "<name>(2 Remaining)". Names it, as `<alias>-remainder`, from
         * the source as it was, before the planting out is remembered.
         */
        newRemainder(alias, remaining) {
            const source = known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting');
            return remember('planting', plantingsByAlias, `${alias}-remainder`, {
                ...source, name: `${source.name}(${remaining} Remaining)`, formerNames: [], numberSown: remaining,
                comments: [],
            });
        },

        plantingNamed: alias => known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting'),

        /** Remembers what a step changed about the planting called `alias`: its status, counts, dates, plot. */
        updatePlanting(alias, changes) {
            known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting');
            Object.assign(plantingsByAlias.get(alias), changes);
            return copyOf(plantingsByAlias.get(alias));
        },

        /** As `editPlot`, a new name for the planting called `alias`. */
        renamePlanting(alias) {
            known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting');
            const planting = plantingsByAlias.get(alias);
            planting.formerNames.push(planting.name);
            planting.name = madeUpName(alias);
            return copyOf(planting);
        },

        /** Forgets the harvest from the planting called `alias` `on` a day: it was removed. */
        forgetHarvest(alias, on) {
            known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting');
            const planting = plantingsByAlias.get(alias);
            const harvest = planting.harvests.find(each => each.on === on);
            if (harvest === undefined) {
                throw new Error(`no harvest of the planting "${alias}" on ${on} in this test -- file one first with garden.hasHarvest`);
            }
            planting.harvests = planting.harvests.filter(each => each !== harvest);
            planting.harvested -= harvest.quantity;
            return copyOf(planting);
        },

        /**
         * Remembers `quantity` more harvested from the planting called `alias`,
         * of its plant's default harvest type, `on` a day, `YYYY-MM-DD`, or
         * null if the page chose it. Its harvests go with it.
         */
        recordHarvest(alias, quantity, on = null) {
            known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting');
            const planting = plantingsByAlias.get(alias);
            planting.harvests.push({ on, quantity });
            planting.harvested += quantity;
            return copyOf(planting);
        },

        /** Remembers the harvest from the planting called `alias` `on` a day as `quantity` now. */
        reviseHarvest(alias, on, quantity) {
            known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting');
            const planting = plantingsByAlias.get(alias);
            const harvest = planting.harvests.find(each => each.on === on);
            if (harvest === undefined) {
                throw new Error(`no harvest of the planting "${alias}" on ${on} in this test -- file one first with garden.hasHarvest`);
            }
            planting.harvested += quantity - harvest.quantity;
            harvest.quantity = quantity;
            return copyOf(planting);
        },

        /**
         * Makes up a journal entry called `alias`, in the year called
         * `yearAlias`: its text, which names it, and `entryDate`, `YYYY-MM-DD`.
         * It goes with its year, so cleanup needs nothing more.
         */
        newJournalEntry(alias, yearAlias, entryDate) {
            const { plantingYear } = known(plantingYearsByAlias, yearAlias, 'year', 'garden.hasPlantingYear');
            if (entriesByAlias.has(alias)) {
                throw new Error(`there is already an entry called "${alias}" in this test`);
            }
            entriesByAlias.set(alias, { plantingYear, entryDate, entry: `${madeUpName(alias)}: a day in the garden.` });
            return copyOf(entriesByAlias.get(alias));
        },

        /**
         * As `newJournalEntry`, for an activity-log entry: fertilized with
         * CalMag, its comments naming it.
         */
        newLogEntry(alias, yearAlias, entryDate) {
            const { plantingYear } = known(plantingYearsByAlias, yearAlias, 'year', 'garden.hasPlantingYear');
            if (entriesByAlias.has(alias)) {
                throw new Error(`there is already an entry called "${alias}" in this test`);
            }
            entriesByAlias.set(alias, {
                plantingYear, entryDate, activityType: 'FERTILIZE', subType: 'CalMag',
                comments: `${madeUpName(alias)}: fed the beds.`,
            });
            return copyOf(entriesByAlias.get(alias));
        },

        entryNamed: alias => known(entriesByAlias, alias, 'entry', 'journalPage.recordEntry'),

        /** Remembers what a step learnt about the entry called `alias`, such as its day. */
        updateEntry(alias, changes) {
            known(entriesByAlias, alias, 'entry', 'journalPage.recordEntry');
            Object.assign(entriesByAlias.get(alias), changes);
            return copyOf(entriesByAlias.get(alias));
        },

        /** A planting id the service has never issued, remembered for the step that checks it. */
        newUnknownPlantingId() {
            unknownPlantingId = randomUUID();
            return unknownPlantingId;
        },

        unknownPlantingId() {
            if (unknownPlantingId === undefined) {
                throw new Error('no unknown planting in this test -- open one first with plantingDetailsPage.openUnknown()');
            }
            return unknownPlantingId;
        },

        /** A comment for the planting called `alias`, made up, and remembered as its latest. */
        newComment(alias) {
            known(plantingsByAlias, alias, 'planting', 'garden.hasPlanting');
            const comment = `A note from the UI suite, ${suffix()}.`;
            plantingsByAlias.get(alias).comments.push(comment);
            return comment;
        },

        /**
         * As `newPlot`, for a planting year: a year from 8000 to 8999, picked at
         * random from this worker's own slice of them, with its frost and
         * planting dates in that year. `leap` is `yes` for a leap year, `no`
         * for any other, and left out for either.
         */
        newPlantingYear(alias, leap) {
            const taken = new Set([...plantingYearsByAlias.values()].map(year => year.plantingYear));
            const { first, last } = yearSlice();
            let plantingYear;
            // Never the slice's last, so the year after is this worker's too,
            // for newNextPlantingYear
            do {
                plantingYear = randomInt(first, last);
            } while (taken.has(plantingYear) || taken.has(plantingYear + 1)
                || (leap !== undefined && isLeapYear(plantingYear) !== (leap === 'yes')));
            return remember('plantingYear', plantingYearsByAlias, alias, {
                plantingYear,
                lastFrostDate: `${plantingYear}-04-15`,
                targetPlantingDate: `${plantingYear}-05-01`,
            });
        },

        plantingYearNamed: alias => known(plantingYearsByAlias, alias, 'year', 'garden.hasPlantingYear'),

        /**
         * As `newPlantingYear`, for the year after the one called `afterAlias`,
         * with the dates the test picks: `YYYY-MM-DD`.
         */
        newNextPlantingYear(alias, afterAlias, { lastFrostDate, targetPlantingDate }) {
            const { plantingYear } = known(plantingYearsByAlias, afterAlias, 'year', 'garden.hasPlantingYear');
            return remember('plantingYear', plantingYearsByAlias, alias, {
                plantingYear: plantingYear + 1, lastFrostDate, targetPlantingDate,
            });
        },

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
                taxonomy: { family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', cultivar: 'Brandywine' },
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
         * Makes up new values for the plant called `alias`, a name, a family, a
         * cultivar and a description, and remembers them as the plant's from now
         * on. Cleanup finds the plant by its old name too, in case they're never
         * saved.
         */
        editPlant(alias) {
            known(plantsByAlias, alias, 'plant', 'garden.hasPlant');
            const plant = plantsByAlias.get(alias);
            plant.formerNames.push(plant.friendlyName);
            plant.friendlyName = madeUpName(alias);
            plant.taxonomy.family = 'Rosaceae';
            plant.taxonomy.cultivar = 'Cherokee Purple';
            plant.description = 'Edited by the UI suite.';
            return copyOf(plant);
        },

        /**
         * A name for the plant called `alias` that is typed but never saved:
         * the same one each time it's asked for, in a test.
         */
        unsavedPlantName(alias) {
            known(plantsByAlias, alias, 'plant', 'garden.hasPlant');
            if (!unsavedNamesByAlias.has(alias)) {
                unsavedNamesByAlias.set(alias, madeUpName(`${alias}-unsaved`));
            }
            return unsavedNamesByAlias.get(alias);
        },

        /** As `newPlot`, for an activity schedule, with no items. */
        newSchedule(alias) {
            return remember('activitySchedule', schedulesByAlias, alias, {
                name: madeUpName(alias), formerNames: [], description: 'Made up by the UI suite.',
            });
        },

        scheduleNamed: alias => known(schedulesByAlias, alias, 'schedule', 'garden.hasSchedule'),

        /**
         * As `editPlot`, a new name and description for the schedule called
         * `alias`. Cleanup finds it by its old name too.
         */
        editSchedule(alias) {
            known(schedulesByAlias, alias, 'schedule', 'garden.hasSchedule');
            const schedule = schedulesByAlias.get(alias);
            schedule.formerNames.push(schedule.name);
            Object.assign(schedule, { name: madeUpName(alias), description: 'Edited by the UI suite.' });
            return copyOf(schedule);
        },

        /**
         * Makes up an item called `alias` for the schedule called
         * `scheduleAlias`: bone meal every 2 weeks, May 15 to June 30 of the
         * current year, with notes that name it. `interval` is as given, 2 if
         * left out. It goes with its schedule, so cleanup needs nothing more.
         */
        newScheduleItem(alias, scheduleAlias, interval = 2) {
            const { name } = known(schedulesByAlias, scheduleAlias, 'schedule', 'garden.hasSchedule');
            if (scheduleItemsByAlias.has(alias)) {
                throw new Error(`there is already a schedule item called "${alias}" in this test`);
            }
            scheduleItemsByAlias.set(alias, {
                scheduleName: name,
                activityType: 'Fertilize',
                subType: 'Bone Meal',
                frequency: 'weekly',
                interval,
                startDate: '05-15',
                startDateYearOffset: 0,
                endDate: '06-30',
                endDateYearOffset: 0,
                notes: `${madeUpName(alias)}: feed the roses.`,
            });
            return copyOf(scheduleItemsByAlias.get(alias));
        },

        scheduleItemNamed: alias => known(scheduleItemsByAlias, alias, 'item', 'garden.hasScheduleItem'),

        /** New notes for the schedule item called `alias`, and a different subtype: blood meal. */
        editScheduleItem(alias) {
            known(scheduleItemsByAlias, alias, 'item', 'garden.hasScheduleItem');
            const item = scheduleItemsByAlias.get(alias);
            Object.assign(item, { subType: 'Blood Meal', notes: `${madeUpName(alias)}: feed the roses again.` });
            return copyOf(item);
        },

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
