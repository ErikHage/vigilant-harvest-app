// A planting as the service sends it, with any fields overridden. Its dates
// are days, YYYY-MM-DD, and its audit fields and history UTC instants
export function aPlanting(overrides = {}) {
    return {
        plantingId: 'planting-1',
        plotId: 'plot-1',
        plantId: 'plant-1',
        currentPlantingYear: 2026,
        plantingYears: [2025, 2026],
        name: 'Early beans',
        seedSource: "Johnny's",
        lotNumber: 'L-14',
        targetPlantingDate: '2026-05-17',
        leadTimeWeeks: 3,
        sowDate: '2026-04-20',
        sowType: 'INDOOR',
        numberSown: 24,
        transplantDate: '2026-05-18',
        numberTransplanted: 20,
        currentStatus: 'PLANTED',
        dateCreated: '2026-03-01T18:00:00Z',
        dateModified: '2026-05-18T13:30:00Z',
        statusHistory: [
            { plantingHistoryId: 'h-3', plantingStatus: 'PLANTED', comment: 'Into the north bed', dateCreated: '2026-05-18T13:30:00Z' },
            { plantingHistoryId: 'h-1', plantingStatus: 'CREATED', comment: '', dateCreated: '2026-03-01T18:00:00Z' },
            { plantingHistoryId: 'h-2', plantingStatus: 'STARTED', comment: 'Heat mat', dateCreated: '2026-04-20T12:00:00Z' },
            { plantingHistoryId: 'h-4', plantingStatus: 'COMMENT', comment: 'First beans\nin a week', dateCreated: '2026-06-01T22:00:00Z' },
        ],
        ...overrides,
    };
}
