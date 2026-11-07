import { flushPromises } from '@vue/test-utils';
import { VDatePicker } from 'vuetify/components';
import { mountWithPlugins } from '../../../../../helpers/mount';
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
            entryDate: new Date(2026, 6, 1).toISOString(),
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

    // Unlike a planting's dates, an entry date is a TIMESTAMP: the service
    // keeps the instant, and sends it back as one, so the journal files a New
    // York evening's entry under the local day (GardenJournalPage.spec.js)
    it('sends the moment of a default date, as its UTC instant', async () => {
        const wrapper = mountDialog({ now: '2026-07-04T21:30:00' });

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][0].entryDate).toBe('2026-07-05T01:30:00.000Z');
    });

    // The service stores it too (entry is optional), and the journal shows a
    // blank entry for the day
    it('submits an empty entry', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][0].entry).toBe('');
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

    // DocumentsCurrentBehavior: it doesn't wait for onSubmit, so it closes,
    // and forgets the entry, before the save is done. If the save fails, the
    // entry is lost, whatever the store does (backlog A6; its own TODO).
    // Should wait, and stay open if the save fails
    it('closes before the save is done', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });
        let dialog = await open(wrapper);
        await dialog.find('textarea').setValue('Beans up.');

        await press(dialog, 'Confirm');

        expect(isOpen()).toBe(false);
        dialog = await open(wrapper);
        expect(dialog.find('textarea').element.value).toBe('');
    });
});
