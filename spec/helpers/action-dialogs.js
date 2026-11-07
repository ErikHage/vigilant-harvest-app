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

export async function press(dialog, label) {
    await buttonLabelled(dialog, label).trigger('click');
    await flushPromises();
}

export function isOpen() {
    return document.querySelector('.v-overlay--active') !== null;
}

// An onSubmit that never settles, as a save still in flight
export function aSaveInFlight() {
    return vi.fn(() => new Promise(() => {}));
}
