// Where a visit was going when the guard sent it to sign on, kept through the
// round trip to feral-authentication. It returns to this app's own origin, so
// sessionStorage, which is per tab and per origin, survives it.

const destinationKey = 'sign-on-destination';

// Only a page of this app's dashboard is followed, so the stored value can't
// send anyone elsewhere: an open redirect
const isDashboardPath = path => typeof path === 'string' && /^\/dashboard(\/|\?|#|$)/.test(path);

export function rememberDestination(path) {
    try {
        if (isDashboardPath(path)) {
            sessionStorage.setItem(destinationKey, path);
        }
    } catch {
        // no storage: sign-on lands on the dashboard, as it did
    }
}

// The destination, once: it's forgotten as it's read
export function takeDestination() {
    try {
        const path = sessionStorage.getItem(destinationKey);
        sessionStorage.removeItem(destinationKey);
        return isDashboardPath(path) ? path : null;
    } catch {
        return null;
    }
}
