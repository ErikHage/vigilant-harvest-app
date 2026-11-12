import { expectText, expectUrl, expectVisible } from './assertions';
import { escaped, urlOf } from './urls';

// The service's ids are UUIDs
const plantPageUrl = suffix => new RegExp(`^${escaped(urlOf('dashboard/plants/'))}[0-9a-f-]{36}/${suffix}$`);

// What a tab shows for a value: as stored, with nothing for none
const shown = value => (value === null || value === undefined ? '' : String(value));
// A yes or no, stored as a boolean or as "1" or "0", in words; else as stored
const yesOrNo = value => ({ true: 'Yes', 1: 'Yes', false: 'No', 0: 'No' }[String(value)] ?? shown(value));
const dateTime = /^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M$/;

/**
 * Each tab's rows, header and value, as the page shows them for `plant`. A
 * yes or no is in words, and each measure's header has its unit; they were
 * raw, and the depth had none (B22). The climbing height has a row only for a
 * climber.
 */
const tabRows = plant => ({
    Details: [
        ['Plant Id', /^[0-9a-f-]{36}$/],
        ['Created At', dateTime],
        ['Last Modified At', dateTime],
        ['Lifespan Type', shown(plant.lifespanType)],
        // A chip per tag, read as chips below: run together, the cell reads
        // "Cold TolerantHeirloom"
        ['Tags', /.*/],
        ['Description', shown(plant.description)],
    ],
    Taxonomy: [
        ['Family', shown(plant.taxonomy.family)],
        ['Genus', shown(plant.taxonomy.genus)],
        ['Species', shown(plant.taxonomy.species)],
    ],
    Sowing: [
        ['Indoors', yesOrNo(plant.sowing.indoor)],
        ['Direct', yesOrNo(plant.sowing.direct)],
        ['Germination Time', shown(plant.sowing.germinationDaysRange)],
        ['Germination Temperature', shown(plant.sowing.germinationTempRange)],
        ['Notes', shown(plant.sowing.sowingNotes)],
    ],
    Planting: [
        ['Planting Depth (in)', shown(plant.planting.depthInInches)],
        ['Plant Spacing (in)', shown(plant.planting.plantSpacingInches)],
        ['Row Spacing (in)', shown(plant.planting.rowSpacingInches)],
        ['Instructions', shown(plant.planting.instructions)],
    ],
    Growing: [
        ['Sun', shown(plant.growing.requiredSun)],
        ['Days to Maturity', shown(plant.growing.daysToMaturity)],
        ['Climbing', yesOrNo(plant.growing.isClimbing)],
        ...(plant.growing.isClimbing ? [['Climbing Height (ft)', shown(plant.growing.climbingHeightFeet)]] : []),
        ['Mature Size', shown(plant.growing.plantSize)],
        ['Notes', shown(plant.growing.growingNotes)],
    ],
    Harvesting: [
        ['Default Harvest Type', shown(plant.harvesting.defaultHarvestType)],
        ['Fruit Size', shown(plant.harvesting.fruitSize)],
        ['Shelf Stability', shown(plant.harvesting.shelfStability)],
        ['Instructions', shown(plant.harvesting.harvestInstructions)],
    ],
});

/** A plant's details page, with its seven tabs, as Playwright sees it. */
export function createPlantDetailsPageDriver(page) {
    const main = page.getByRole('main');
    // Vuetify's tab windows have no tabpanel role; the shown one has this class
    const shownTab = main.locator('.v-window-item--active');

    async function openTab(name) {
        await main.getByRole('tab', { name, exact: true }).click();
    }

    return {
        /** On the details page, titled with the plant's name, under it its category and subcategory. */
        async isShownFor({ friendlyName, categoryName, subcategoryName }) {
            const what = `showing the details of the plant ${friendlyName}`;

            await expectUrl(page, plantPageUrl('details'), what);
            await expectText(main.locator('.page-title'), friendlyName, what);
            await expectVisible(main.getByText(`${categoryName} / ${subcategoryName}`, { exact: true }), what);
        },

        /** Each tab but Schedules shows each of the plant's fields, and no others. */
        async showsPlant(plant) {
            for (const [tab, rows] of Object.entries(tabRows(plant))) {
                const what = `the ${tab} tab of the plant ${plant.friendlyName}`;

                await openTab(tab);
                // By element, not role: Chromium stops calling a header a
                // rowheader when its row's cell is empty, as Tags is with none
                await expectText(shownTab.locator('th'), rows.map(([header]) => header), what);
                await expectText(shownTab.locator('td'), rows.map(([, value]) => value), what);
                if (tab === 'Details') {
                    await expectText(shownTab.locator('.v-chip'), plant.tags, what);
                }
            }
        },

        /** The Schedules tab lists these schedules, by name and description, and no others. */
        async listsSchedules(schedules) {
            const what = 'the Schedules tab';

            await openTab('Schedules');
            await expectText(shownTab.getByRole('cell'), schedules.flatMap(({ name, description }) => [name, description]),
                what);
        },

        /** The Schedules tab says the plant has none. It once showed only its headers (B22). */
        async listsNoSchedules() {
            await openTab('Schedules');
            await expectText(shownTab.getByRole('cell'), ['No schedules'], 'the Schedules tab of a plant with none');
        },
    };
}
