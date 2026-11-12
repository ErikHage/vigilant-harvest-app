// Whether `filter` occurs in any one of `values`, ignoring case. Each value is
// matched on its own, so the end of one and the start of the next don't
// match together. A missing value matches nothing.
export function matchesAny(filter, ...values) {
    const wanted = filter.toUpperCase();
    return values.some(value => value != null && String(value).toUpperCase().includes(wanted));
}
