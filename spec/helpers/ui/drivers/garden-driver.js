import { expectThat } from './assertions';
import { asGardener } from '../support/sessions';
import {
    assignPlantSchedules, insertActivitySchedule, insertPlantCategory, insertPlantSubcategory, insertPlanting,
    insertJournalEntry, insertPlantingYear, listActivitySchedules, listHarvestTypes, listPlantCategories, listPlants,
    listPlots,
    performPlantingAction, upsertPlant, upsertPlot,
} from '../support/service-client';
import { status } from '../support/status-codes';

const describe = reply => reply.error ?? `${reply.status} ${JSON.stringify(reply.body)}`;
const answered = (reply, code) => reply.error === undefined && reply.status === code;

/** Finds one thing in a list the service sent, or says what was there instead. */
function findIn(reply, matches, what) {
    const found = Array.isArray(reply.body) ? reply.body.find(matches) : undefined;
    expectThat(found !== undefined, `the service to list ${what}`, describe(reply), `looking up ${what}`);
    return found;
}

/** The service's ids for a category, by its name, and for one of its subcategories. */
async function categoryIds(token, { categoryName, subcategoryName }) {
    const category = findIn(await listPlantCategories(token), each => each.categoryName === categoryName,
        `the plant category ${categoryName}`);
    if (subcategoryName === undefined) {
        return { categoryId: category.categoryId };
    }
    const subcategory = findIn({ body: category.subcategories }, each => each.subcategoryName === subcategoryName,
        `the subcategory ${subcategoryName} in ${categoryName}`);
    return { categoryId: category.categoryId, subcategoryId: subcategory.subcategoryId };
}

/** A plant's details as the world keeps them, as the service takes them. */
function plantRequest(plant, subcategoryId, defaultHarvestTypeId) {
    const { defaultHarvestType, ...harvesting } = plant.harvesting;
    return {
        subcategoryId,
        friendlyName: plant.friendlyName,
        lifespanType: plant.lifespanType,
        tags: plant.tags,
        description: plant.description,
        taxonomy: plant.taxonomy,
        sowing: plant.sowing,
        planting: plant.planting,
        growing: plant.growing,
        harvesting: { ...harvesting, defaultHarvestTypeId },
    };
}

/**
 * Arranges, through the service's API, what a test needs but isn't about,
 * as the gardener. Each method asserts its call succeeded, so a test can't
 * go on over a garden that isn't as it says.
 */
export function createGardenDriver() {
    return {
        async createPlot({ friendlyName, lengthInInches, widthInInches, plotType }) {
            const what = `arranging the plot ${friendlyName}`;

            const reply = await asGardener(token => upsertPlot(token, {
                friendlyName, lengthInInches, widthInInches, plotType, isActive: true,
            }));
            expectThat(answered(reply, status.created), 'the service to create it (201)', describe(reply), what);
        },

        async createPlantingYear(year) {
            const what = `arranging the planting year ${year.plantingYear}`;

            const reply = await asGardener(token => insertPlantingYear(token, year));
            expectThat(answered(reply, status.created), 'the service to create it (201)', describe(reply), what);
        },

        async createCategory({ categoryName }) {
            const what = `arranging the plant category ${categoryName}`;

            const reply = await asGardener(token => insertPlantCategory(token, categoryName));
            expectThat(answered(reply, status.created), 'the service to create it (201)', describe(reply), what);
        },

        async createSubcategory({ categoryName, subcategoryName }) {
            const what = `arranging the subcategory ${subcategoryName} in ${categoryName}`;

            const reply = await asGardener(async token => {
                const { categoryId } = await categoryIds(token, { categoryName });
                return insertPlantSubcategory(token, categoryId, subcategoryName);
            });
            expectThat(answered(reply, status.created), 'the service to create it (201)', describe(reply), what);
        },

        async createSchedule(schedule) {
            const what = `arranging the activity schedule ${schedule.name}`;

            const reply = await asGardener(token => insertActivitySchedule(token, schedule));
            expectThat(answered(reply, status.created), 'the service to create it (201)', describe(reply), what);
        },

        /**
         * Creates `planting`; if its status is STARTED or PLANTED, starts it
         * too, sown on its sow date, and if PLANTED plants it out, in no plot.
         * Dates go out at noon UTC, so they're that day in any zone the
         * service runs in.
         */
        async createPlanting(planting) {
            const what = `arranging the planting ${planting.name}`;

            const replies = await asGardener(async token => {
                const plant = findIn(await listPlants(token), each => each.friendlyName === planting.plantName,
                    `the plant ${planting.plantName}`);
                const created = await insertPlanting(token, {
                    name: planting.name,
                    plantId: plant.plantId,
                    plantingYear: planting.plantingYear,
                    seedSource: planting.seedSource,
                    lotNumber: planting.lotNumber,
                    leadTimeWeeks: planting.leadTimeWeeks,
                    targetPlantingDate: planting.targetPlantingDate,
                });
                if (!answered(created, status.created) || planting.status === 'CREATED') {
                    return { created };
                }
                const { plantingId } = created.body;
                const started = await performPlantingAction(token, plantingId, 'START', {
                    sowDate: `${planting.sowDate}T12:00:00.000Z`, numberSown: planting.numberSown, comment: null,
                });
                if (!answered(started, status.ok) || planting.status === 'STARTED') {
                    return { created, started };
                }
                const plotId = planting.plotName === null ? null : findIn(await listPlots(token),
                    each => each.friendlyName === planting.plotName, `the plot ${planting.plotName}`).plotId;
                return {
                    created,
                    started,
                    planted: await performPlantingAction(token, plantingId, 'PLANT', {
                        transplantDate: `${planting.transplantDate}T12:00:00.000Z`,
                        numberTransplanted: planting.numberTransplanted, plotId, comment: null,
                    }),
                };
            });
            expectThat(answered(replies.created ?? replies, status.created), 'the service to create it (201)',
                describe(replies.created ?? replies), what);
            for (const [step, reply] of [['start', replies.started], ['plant', replies.planted]]) {
                if (reply) {
                    expectThat(answered(reply, status.ok), `the service to ${step} it (200)`, describe(reply), what);
                }
            }
        },

        /** Records a journal entry, dated noon in New York, so it's its day there. */
        async createJournalEntry({ plantingYear, entryDate, entry }) {
            const what = `arranging the journal entry ${entry}`;

            const reply = await asGardener(token => insertJournalEntry(token, {
                plantingYear, entry, entryDate: new Date(`${entryDate}T12:00:00-04:00`).toISOString(),
            }));
            expectThat(reply.error === undefined && reply.status < 300, 'the service to record it', describe(reply), what);
        },

        /** Creates `plant`, then assigns it the schedules named in `scheduleNames`. */
        async createPlant(plant, scheduleNames) {
            const what = `arranging the plant ${plant.friendlyName}`;

            const replies = await asGardener(async token => {
                const { subcategoryId } = await categoryIds(token, plant);
                const harvestType = findIn(await listHarvestTypes(token),
                    each => each.harvestTypeName === plant.harvesting.defaultHarvestType,
                    `the harvest type ${plant.harvesting.defaultHarvestType}`);
                const created = await upsertPlant(token, plantRequest(plant, subcategoryId, harvestType.harvestTypeId));
                if (!answered(created, status.created) || scheduleNames.length === 0) {
                    return { created };
                }
                const schedules = await listActivitySchedules(token);
                const assign = scheduleNames.map(name => findIn(schedules, each => each.name === name,
                    `the activity schedule ${name}`).activityScheduleId);
                return { created, assigned: await assignPlantSchedules(token, created.body.plantId, { assign }) };
            });
            expectThat(answered(replies.created ?? replies, status.created), 'the service to create it (201)',
                describe(replies.created ?? replies), what);
            if (replies.assigned) {
                expectThat(answered(replies.assigned, status.ok), 'the service to assign its schedules (200)',
                    describe(replies.assigned), what);
            }
        },
    };
}
