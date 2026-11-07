import { asGardener } from './sessions';
import {
    listActivitySchedules, listPlantCategories, listPlantingYears, listPlantings, listPlants, listPlots,
} from './service-client';

/**
 * What the suite names, so it can be found afterwards: a `ui-` prefix on
 * every name, and planting years from 8000 to 8999. The service's acceptance
 * suite uses `acc-` and 9000–9999, so neither suite flags the other's data.
 */
export const FIXTURE_PREFIX = 'ui-';
export const FIXTURE_YEARS = { min: 8000, max: 8999 };

const isFixtureName = name => typeof name === 'string' && name.startsWith(FIXTURE_PREFIX);
const isFixtureYear = year => year >= FIXTURE_YEARS.min && year <= FIXTURE_YEARS.max;

/**
 * Each kind of thing the suite can leave behind, and how to see it in its
 * list. Harvests, journal entries, activity-log entries and schedule items
 * have no list of their own: they hang off a planting, a year or a schedule
 * listed here, and the service's foreign keys tie them to it.
 */
const kinds = [
    {
        what: 'plot', list: listPlots,
        leftovers: plots => plots.filter(plot => isFixtureName(plot.friendlyName)).map(plot => plot.friendlyName),
    },
    {
        what: 'plant', list: listPlants,
        leftovers: plants => plants.filter(plant => isFixtureName(plant.friendlyName)).map(plant => plant.friendlyName),
    },
    {
        what: 'planting', list: listPlantings,
        leftovers: plantings => plantings
            .filter(planting => isFixtureName(planting.name) || isFixtureYear(planting.currentPlantingYear))
            .map(planting => planting.name),
    },
    {
        what: 'plant category or subcategory', list: listPlantCategories,
        leftovers: categories => categories.flatMap(category => [
            ...(isFixtureName(category.categoryName) ? [category.categoryName] : []),
            ...(category.subcategories ?? [])
                .filter(subcategory => isFixtureName(subcategory.subcategoryName))
                .map(subcategory => `${category.categoryName} / ${subcategory.subcategoryName}`),
        ]),
    },
    {
        what: 'activity schedule', list: listActivitySchedules,
        leftovers: schedules => schedules.filter(schedule => isFixtureName(schedule.name)).map(schedule => schedule.name),
    },
    {
        what: 'planting year', list: listPlantingYears,
        leftovers: years => years.filter(year => isFixtureYear(year.plantingYear)).map(year => String(year.plantingYear)),
    },
];

/**
 * Lists what the suite left behind, as the gardener. Resolves to
 * `{ leftovers }`, a line per thing found, or to `{ error }` when a list
 * couldn't be read, which the caller must treat as a failure too: a check
 * that can't be made hasn't passed.
 */
export async function findResidue() {
    return asGardener(async token => {
        const leftovers = [];

        for (const kind of kinds) {
            const reply = await kind.list(token);
            if (!Array.isArray(reply.body)) {
                return { error: `couldn't list each ${kind.what} (${reply.error ?? `status ${reply.status}`})` };
            }
            leftovers.push(...kind.leftovers(reply.body).map(name => `${kind.what}: ${name}`));
        }
        return { leftovers };
    });
}

/**
 * The run's last check, after every test: fails the run if anything named by
 * the suite is still there, or if it can't look, since a check that can't be
 * made hasn't passed.
 *
 * It throws. Playwright reports an error thrown in global teardown outside
 * any test, and exits 1. Setting `process.exitCode` doesn't work here, unlike
 * Vitest: Playwright sets its own exit code afterwards, and a run that left
 * data behind exited 0.
 */
export async function checkForResidue() {
    const { leftovers, error } = await findResidue();

    if (error) {
        throw new Error(`The residue check couldn't run: ${error}. Treating the run as failed.`);
    }
    if (leftovers.length > 0) {
        throw new Error(`The run left ${leftovers.length} thing(s) behind, which cleanup should have deleted:\n  `
            + `${leftovers.join('\n  ')}\nDelete them by hand (spec/ui/README.md, Cleanup), and find out why `
            + 'cleanup missed them.');
    }
}
