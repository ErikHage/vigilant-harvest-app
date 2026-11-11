import { flushPromises } from '@vue/test-utils';
import { httpError } from '../../../../../helpers/http-errors';
import { VDatePicker } from 'vuetify/components';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled } from '../../../../../helpers/fields';
import { dialogTitled } from '../../../../../helpers/dialogs';
import { aSaveInFlight, isOpen, openAction, press } from '../../../../../helpers/action-dialogs';
import AddJournalEntryDialog from '@/components/views/dashboard/garden/AddJournalEntryDialog.vue';

// The dialog reads the clock when it's created, and again when it resets,
// for its default entry date
function mountDialog({ now = '2026-07-04T10:00:00', ...props } = {}) {
    vi.useFakeTimers({ now: new Date(now), toFake: ['Date'] });
    return mountWithPlugins(AddJournalEntryDialog, {
        props: { onSubmit: vi.fn(), onCancel: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Record Entry', 'Record Journal Entry');

// Picks a date through the dialog's own date picker, as a user would
async function pickDate(wrapper, dialog, date) {
    await dialog.find('.v-btn .mdi-calendar').trigger('click');
    await flushPromises();
    if (date) {
        wrapper.findComponent(VDatePicker).vm.$emit('update:modelValue', date);
        await flushPromises();
    }
    await press(dialogTitled('Entry Date'), 'Confirm');
}

describe('AddJournalEntryDialog', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('opens from Record Entry, on today, with no text', async () => {
        const dialog = await open(mountDialog());

        expect(dialog.find('h3').text()).toBe('2026-07-04');
        expect(dialog.find('textarea').element.value).toBe('');
    });

    it('submits the date and the text, and closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await pickDate(wrapper, dialog, new Date(2026, 6, 1));
        await dialog.find('textarea').setValue('Beans up.\nPeas slow.');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
            entryDate: '2026-07-01T00:00:00',
            entry: 'Beans up.\nPeas slow.',
        });
        expect(isOpen()).toBe(false);
    });

    it('shows a picked date', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        await pickDate(wrapper, dialog, new Date(2026, 6, 1));

        expect(dialog.find('h3').text()).toBe('2026-07-01');
    });

    // An entry date is the user's wall-clock time, sent and returned with no
    // timezone, so a New York evening's entry stays on that evening
    it('sends the moment of a default date, as its local wall-clock time', async () => {
        const wrapper = mountDialog({ now: '2026-07-04T21:30:00' });
        const dialog = await open(wrapper);
        await dialog.find('textarea').setValue('Beans up.');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][0].entryDate).toBe('2026-07-04T21:30:00');
    });

    // The service would store an empty entry, which the journal shows as a
    // blank one for the day (backlog B28)
    it.each([[''], ['   ']])('offers Confirm only once there is text, not for %j', async text => {
        const dialog = await open(mountDialog());
        await dialog.find('textarea').setValue(text);
        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeDefined();

        await dialog.find('textarea').setValue('Beans up.');

        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeUndefined();
    });

    it('starts afresh after a submit', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await pickDate(wrapper, dialog, new Date(2026, 6, 1));
        await dialog.find('textarea').setValue('Beans up.');
        await press(dialog, 'Confirm');

        dialog = await open(wrapper);

        expect(dialog.find('h3').text()).toBe('2026-07-04');
        expect(dialog.find('textarea').element.value).toBe('');
    });

    it('clears the entry on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await pickDate(wrapper, dialog, new Date(2026, 6, 1));
        await dialog.find('textarea').setValue('never mind');

        await press(dialog, 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onCancel')).toHaveBeenCalledTimes(1);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        dialog = await open(wrapper);
        expect(dialog.find('h3').text()).toBe('2026-07-04');
        expect(dialog.find('textarea').element.value).toBe('');
    });

    // DocumentsCurrentBehavior: the date picker reads its date only when
    // created, so after a submit it still holds the last date picked, while
    // the dialog has gone back to today. Confirming the picker without
    // picking brings the old date back (backlog A21). Should open on the
    // dialog's own date
    it('keeps the last picked date in its picker after a submit', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await pickDate(wrapper, dialog, new Date(2026, 6, 1));
        await press(dialog, 'Confirm');

        dialog = await open(wrapper);
        await pickDate(wrapper, dialog);

        expect(dialog.find('h3').text()).toBe('2026-07-01');
    });

    it('waits for the save, open', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });
        const dialog = await open(wrapper);
        await dialog.find('textarea').setValue('Beans up.');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalled();
        expect(isOpen()).toBe(true);
    });

    it('stays open, with the entry, and says so, when the save fails', async () => {
        const wrapper = mountDialog({ onSubmit: vi.fn().mockRejectedValue(httpError(500)) });
        const dialog = await open(wrapper);
        await dialog.find('textarea').setValue('Beans up.');

        await press(dialog, 'Confirm');

        expect(isOpen()).toBe(true);
        expect(document.body.textContent).toContain("Couldn't save. Try again.");
        expect(document.querySelector('.v-overlay--active textarea').value).toBe('Beans up.');
    });
});
