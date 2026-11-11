// The harvest types as GET /harvest-types sends them
export const harvestTypes = [
    { harvestTypeId: 1, harvestTypeName: 'unspecified' },
    { harvestTypeId: 2, harvestTypeName: 'pounds' },
    { harvestTypeId: 3, harvestTypeName: 'count' },
];

// The date the service sends for a harvest filed on `day`: the day itself,
// YYYY-MM-DD, with no time or timezone
export function filedOn(day) {
    return day;
}

// A harvest as GET /harvests/search sends it, with any fields overridden
export function aHarvest(overrides = {}) {
    return {
        harvestId: 'harvest-1',
        plantingId: 'planting-1',
        quantity: 2,
        harvestDate: filedOn('2026-07-10'),
        harvestTypeId: 2,
        harvestType: 'pounds',
        ...overrides,
    };
}
