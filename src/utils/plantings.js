const plantingActions = {
    start: 'START',
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

export default {
    plantingActions,
    plantingStatuses,
    mapPlantingStatusToColor,
};