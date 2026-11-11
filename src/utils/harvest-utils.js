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

// the selects bind an id, but the label has to follow it live, so resolve from the cached list
function harvestTypeNameById(harvestTypes, harvestTypeId) {
    const match = harvestTypes.find(harvestType => harvestType.harvestTypeId === harvestTypeId);
    return match ? match.harvestTypeName : '';
}

// a 400 names the field the service refused and why (a quantity, a date, a
// subcategory...); show that, and the fallback for anything else
function upsertErrorMessage(err, fallback) {
    const serverMessage = err?.data?.errors?.[0]?.message;
    return err?.status === 400 && serverMessage ? serverMessage : fallback;
}

function sortByQuantityDescending(a, b) {
    return b.quantity - a.quantity;
}

export default {
    unspecifiedHarvestTypeId,
    unspecifiedHarvestTypeName,
    harvestTypeLabel,
    formatQuantity,
    harvestTypeNameById,
    upsertErrorMessage,
    sortByQuantityDescending,
};
