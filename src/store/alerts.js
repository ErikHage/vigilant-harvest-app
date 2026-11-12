// Each store's alert hides after three seconds. A store keeps one timer, so a
// new alert restarts the clock instead of being hidden early by an older one's
const hideTimers = new WeakMap();

export function showAlert(store, type, message) {
    clearTimeout(hideTimers.get(store));
    store.alertVisible = true;
    store.alertType = type;
    store.alertMessage = message;
    hideTimers.set(store, setTimeout(() => {
        store.alertVisible = false;
    }, 3000));
}

/**
 * Every store's `setAlertMessage` action: logs `err`, when there is one, and
 * shows the alert. Called as an action, so `this` is the store.
 */
export function setAlertMessage(err, type, message) {
    if (err) {
        console.error(err);
    }
    showAlert(this, type, message);
}

/** A store's alert, as a page's `alerts` list passes it to `FadeOutAlert`. */
export function alertOf(store) {
    return {
        isVisible: store.alertVisible,
        type: store.alertType,
        message: store.alertMessage,
    };
}
