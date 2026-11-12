const plantingActions = {
    start: 'START',
    split: 'SPLIT',
    plant: 'PLANT',
    retire: 'RETIRE',
    comment: 'COMMENT',
    delete: 'DELETE',
};

const plantingStatuses = {
    created: 'CREATED',
    started: 'STARTED',
    planted: 'PLANTED',
    retired: 'RETIRED',
};

const plantingStatusColorMap = {
    [plantingStatuses.created]: 'info',
    [plantingStatuses.started]: 'secondary',
    [plantingStatuses.planted]: 'success',
    [plantingStatuses.retired]: 'error',
};

function mapPlantingStatusToColor(status) {
    return plantingStatusColorMap[status] ?? 'default';
}

// A planting's fields, as a history entry names them
const fieldNames = {
    plantId: 'plant',
    name: 'name',
    seedSource: 'seed source',
    lotNumber: 'lot number',
    targetPlantingDate: 'target planting date',
    plotId: 'plot',
    numberTransplanted: 'number planted',
    leadTimeWeeks: 'lead time (weeks)',
    sowDate: 'sow date',
    sowType: 'sow type',
    numberSown: 'number sown',
    transplantDate: 'transplant date',
    notes: 'notes',
};

// Named without their values: ids, and notes, which can run long
const namedOnly = ['plantId', 'plotId', 'notes'];

const isDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

function describeField([field, value]) {
    const name = fieldNames[field] ?? field;
    if (namedOnly.includes(field) || value === null || value === '') {
        return name;
    }
    return typeof value === 'number' || isDay(value) ? `${name} ${value}` : `${name} "${value}"`;
}

function parsedObject(text) {
    try {
        const parsed = JSON.parse(text);
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * A history entry's comment, as it reads. The service files a planting's
 * creation as its fields in JSON, and an update as `Updated: ` and the fields
 * sent, in JSON: those read as "Created as ..." and "Updated: name "...", plot,
 * ...". Any other comment, a person's or a split's, is as written.
 */
function describeHistoryComment(comment) {
    if (typeof comment !== 'string') {
        return comment;
    }

    const created = parsedObject(comment);
    if (created?.plantingId) {
        return created.name ? `Created as "${created.name}"` : 'Created';
    }

    const updatePrefix = 'Updated: ';
    const updated = comment.startsWith(updatePrefix) ? parsedObject(comment.slice(updatePrefix.length)) : null;
    if (updated) {
        const fields = Object.entries(updated).map(describeField);
        return fields.length ? `Updated: ${fields.join(', ')}` : 'Updated';
    }

    return comment;
}

export default {
    plantingActions,
    plantingStatuses,
    plantingStatusesList: Object.values(plantingStatuses),
    mapPlantingStatusToColor,
    describeHistoryComment,
};
