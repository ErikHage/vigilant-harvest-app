// What a form needs before its save is offered: the service's own rules, so
// the button waits for them rather than the service refusing the save

/** Something other than spaces: the service reads a blank string as missing. */
export function hasText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

/**
 * A whole number of at least `min`. As `v-model.number` gives it, a cleared
 * box is '', and a value loaded from elsewhere (an interval read from a rule)
 * may be a string of digits.
 */
export function isWholeNumber(value, min = 0) {
    const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return Number.isInteger(number) && number >= min;
}

/** A number more than nothing, as a quantity must be. */
export function isPositiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Chosen: not null, undefined or ''. */
export function isChosen(value) {
    return value !== null && value !== undefined && value !== '';
}
