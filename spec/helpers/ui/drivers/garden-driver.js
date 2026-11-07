import { expectThat } from './assertions';
import { asGardener } from '../support/sessions';
import {
    assignPlantSchedules, insertActivitySchedule, insertPlantCategory, insertPlantSubcategory, insertPlantingYear,
    listActivitySchedules, listHarvestTypes, listPlantCategories, upsertPlant, upsertPlot,
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
        async createPlot(plot) {
            const what = `arranging the plot ${plot.friendlyName}`;

            const reply = await asGardener(token => upsertPlot(token, plot));
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
