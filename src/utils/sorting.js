// Comparators for Array.sort. Sort a copy ([...list].sort(...)), not a list a
// component was given or a store holds: sorting in place reorders it for
// everyone else who reads it.

// Text ignoring case, with a missing value as empty, so first
const lower = value => String(value ?? '').toLowerCase();

function compareText(a, b) {
    const textA = lower(a);
    const textB = lower(b);

    if (textA < textB) return -1;
    if (textA > textB) return 1;
    return 0;
}

// Plots and plants alike
function sortByFriendlyName(a, b) {
    return compareText(a.friendlyName, b.friendlyName);
}

function sortByPlantingName(a, b) {
    return compareText(a.name, b.name);
}

function sortPlantingHistoryByDateCreated(a, b) {
    const createdA = new Date(a.dateCreated);
    const createdB = new Date(b.dateCreated);

    if (createdA < createdB) return -1;
    if (createdA > createdB) return 1;
    return 0;
}

// By a text `property`, ignoring case: `-property` sorts it descending. For
// the tables whose column headers choose the sort
function byProperty(property) {
    const descending = property.startsWith('-');
    const field = descending ? property.substring(1) : property;

    return (a, b) => compareText(a[field], b[field]) * (descending ? -1 : 1);
}

export default {
    sortByFriendlyName,
    sortByPlantingName,
    sortPlantingHistoryByDateCreated,
    byProperty,
}
