import { flushPromises } from '@vue/test-utils';
import { buttonLabelled } from './fields';
import { dialogTitled } from './dialogs';

// The planting action dialogs each open from a button with the action's
// name, into a dialog titled with their headline

export async function openAction(wrapper, button, headline) {
    await buttonLabelled(wrapper, button).trigger('click');
    await flushPromises();
    return dialogTitled(headline);
}

// Presses the button labelled `label`. When that closes the dialog, waits out
// the lock Vuetify 4 puts on its activator, so a test can open it again
export async function press(dialog, label) {
    await buttonLabelled(dialog, label).trigger('click');
    await flushPromises();
    if (!isOpen()) {
        await waitOutReopenLock();
    }
}

// For 50ms after an overlay closes, Vuetify 4 ignores a click on its
// activator, so the click that closed it can't open it again
export function waitOutReopenLock() {
    return new Promise(resolve => setTimeout(resolve, 60));
}

export function isOpen() {
    return document.querySelector('.v-overlay--active') !== null;
}

// An onSubmit that never settles, as a save still in flight
export function aSaveInFlight() {
    return vi.fn(() => new Promise(() => {}));
}
