const plantingStatusMap = {
    'CREATED': 'info',
    'INDOOR SOWN': 'success',
    'OUTDOOR SOWN': 'success',
    'RETIRED': 'error',
};

function mapPlantingStatusToColor(status) {
    return plantingStatusMap[status] ?? 'default';
}

export default {
    mapPlantingStatusToColor,
};