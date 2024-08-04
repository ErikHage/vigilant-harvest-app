function sortByPlotFriendlyName(a, b) {
    const nameA = a.friendlyName.toLowerCase();
    const nameB = b.friendlyName.toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
}

export default {
    sortByPlotFriendlyName,
}