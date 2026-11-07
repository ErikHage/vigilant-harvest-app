// The harvest types as GET /harvest-types sends them
export const harvestTypes = [
    { harvestTypeId: 1, harvestTypeName: 'unspecified' },
    { harvestTypeId: 2, harvestTypeName: 'pounds' },
    { harvestTypeId: 3, harvestTypeName: 'count' },
];

// The date the service sends for a harvest filed on `day` (YYYY-MM-DD). It
// files a harvest under its UTC day, stored as that day's midnight, and its
// search and stats send that midnight back as a UTC instant
export function filedOn(day) {
    return `${day}T00:00:00.000Z`;
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
