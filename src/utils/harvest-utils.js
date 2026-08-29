const unspecifiedHarvestTypeId = 1;
const unspecifiedHarvestTypeName = 'unspecified';

function harvestTypeLabel(harvestType) {
    if (!harvestType || harvestType === unspecifiedHarvestTypeName) {
        return '';
    }
    return harvestType;
}

function formatQuantity(quantity, harvestType) {
    const label = harvestTypeLabel(harvestType);
    return label ? `${quantity} ${label}` : `${quantity}`;
}

function sortByQuantityDescending(a, b) {
    return b.quantity - a.quantity;
}

export default {
    unspecifiedHarvestTypeId,
    unspecifiedHarvestTypeName,
    harvestTypeLabel,
    formatQuantity,
    sortByQuantityDescending,
};
