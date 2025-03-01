function sortByPlotFriendlyName(a, b) {
    const nameA = a.friendlyName.toLowerCase();
    const nameB = b.friendlyName.toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
}

function sortByPlantFriendlyName(a, b) {
    const nameA = a.friendlyName.toLowerCase();
    const nameB = b.friendlyName.toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
}

function sortByPlantingName(a, b) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
}

function sortPlantingHistoryByDateCreated(a, b) {
    const createdA = new Date(a.dateCreated);
    const createdB = new Date(b.dateCreated);

    if (createdA < createdB) return -1;
    if (createdA > createdB) return 1;
    return 0;
}

export default {
    sortByPlotFriendlyName,
    sortByPlantFriendlyName,
    sortByPlantingName,
    sortPlantingHistoryByDateCreated,
}