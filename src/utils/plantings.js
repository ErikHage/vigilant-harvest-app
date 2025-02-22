const plantingStatusMap = {
    'CREATED': 'info',
    'STARTED': 'success',
    'PLANTED': 'success',
    'RETIRED': 'error',
};

function mapPlantingStatusToColor(status) {
    return plantingStatusMap[status] ?? 'default';
}

export default {
    mapPlantingStatusToColor,
};