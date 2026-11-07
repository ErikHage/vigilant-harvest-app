// A planting as the service sends it, with any fields overridden. The
// service reads DATE columns with mysql2's dateStrings, so its dates come as
// plain YYYY-MM-DD strings, unlike a planting year's
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
        dateCreated: '2026-03-01 13:00:00',
        dateModified: '2026-05-18 09:30:00',
        statusHistory: [
            { plantingHistoryId: 'h-3', plantingStatus: 'PLANTED', comment: 'Into the north bed', dateCreated: '2026-05-18 09:30:00' },
            { plantingHistoryId: 'h-1', plantingStatus: 'CREATED', comment: '', dateCreated: '2026-03-01 13:00:00' },
            { plantingHistoryId: 'h-2', plantingStatus: 'STARTED', comment: 'Heat mat', dateCreated: '2026-04-20 08:00:00' },
            { plantingHistoryId: 'h-4', plantingStatus: 'COMMENT', comment: 'First beans\nin a week', dateCreated: '2026-06-01 18:00:00' },
        ],
        ...overrides,
    };
}
