// A plant as the service sends it, from GET /plants or GET /plants/:id
// (both use the same serializer), with any fields overridden
export function aPlant(overrides = {}) {
    return {
        plantId: 'plant-1',
        friendlyName: 'Provider bush bean',
        category: 'Legumes',
        subcategory: 'Beans',
        subcategoryId: 'subcategory-1',
        // The service stores it lower-case and sends it capitalised
        lifespanType: 'Annual',
        description: 'A reliable bush bean.\nGood for cool soil.',
        tags: ['Cold Tolerant', 'Container Friendly'],
        dateCreated: '2026-03-01T13:00:00.000Z',
        dateModified: '2026-04-02T14:30:00.000Z',
        taxonomy: { family: 'Fabaceae', genus: 'Phaseolus', species: 'vulgaris' },
        // The service stores a sowing boolean as the string "1" or "0"
        sowing: {
            indoor: '0',
            direct: '1',
            germinationDaysRange: '7-10',
            germinationTempRange: '70-85F',
            sowingNotes: 'Sow after the last frost.',
        },
        planting: { depthInInches: 1, plantSpacingInches: 3, rowSpacingInches: 18, instructions: 'Rows north to south.' },
        growing: {
            requiredSun: 'Full',
            daysToMaturity: 50,
            isClimbing: false,
            climbingHeightFeet: null,
            plantSize: '18 in',
            growingNotes: 'Keep evenly moist.',
        },
        harvesting: {
            defaultHarvestTypeId: 2,
            defaultHarvestType: 'pounds',
            fruitSize: '5 in',
            shelfStability: 'A week, refrigerated',
            harvestInstructions: 'Pick young.',
        },
        activitySchedules: [
            { activityScheduleId: 'schedule-1', name: 'Beans', description: 'Feed every two weeks' },
        ],
        ...overrides,
    };
}
