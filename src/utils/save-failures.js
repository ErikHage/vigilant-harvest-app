import harvestUtils from '@/utils/harvest-utils';

// What a dialog says when its save fails, while it stays open with what was
// entered: the service's reason for a 400, which names the field, or that
// nothing was saved
export function saveFailureMessage(err, fallback = "Couldn't save. Try again.") {
    return harvestUtils.upsertErrorMessage(err, fallback);
}
