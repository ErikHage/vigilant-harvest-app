const plantingActions = {
    sow: 'SOW',
    transplant: 'TRANSPLANT',
    retire: 'RETIRE',
    comment: 'COMMENT',
};

const plantingStatuses = {
    created: 'CREATED',
    started: 'STARTED',
    planted: 'PLANTED',
    retired: 'RETIRED',
};

const plantingStatusColorMap = {
    [plantingStatuses.created]: 'info',
    [plantingStatuses.started]: 'success',
    [plantingStatuses.planted]: 'success',
    [plantingStatuses.retired]: 'error',
};

function mapPlantingStatusToColor(status) {
    return plantingStatusColorMap[status] ?? 'default';
}

export default {
    plantingActions,
    plantingStatuses,
    mapPlantingStatusToColor,
};