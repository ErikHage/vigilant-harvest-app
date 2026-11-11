import { flushPromises } from '@vue/test-utils';
import { httpError } from '../../../../../helpers/http-errors';
import { VDatePicker, VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled } from '../../../../../helpers/fields';
import { dialogTitled } from '../../../../../helpers/dialogs';
import { aSaveInFlight, isOpen, openAction, press } from '../../../../../helpers/action-dialogs';
import AddActivityLogEntryDialog from '@/components/views/dashboard/garden/AddActivityLogEntryDialog.vue';

// A short version of the activity-log store's fixed list
const activityTypes = [
    { name: 'FERTILIZE', subTypes: ['Miracle Grow', 'CalMag'] },
    { name: 'TREAT', subTypes: ['Neem Oil'] },
];

// The dialog reads the clock when it's created, and again when it resets,
// for its default entry date. An error thrown by a handler goes to
// `errorHandler`, as an app's would
function mountDialog({ now = '2026-07-04T10:00:00', errorHandler, ...props } = {}) {
    vi.useFakeTimers({ now: new Date(now), toFake: ['Date'] });
    return mountWithPlugins(AddActivityLogEntryDialog, {
        props: { activityTypes, onSubmit: vi.fn(), onCancel: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

const open = wrapper => openAction(wrapper, 'Log Activity', 'Log Activity');

const select = (wrapper, label) => wrapper.findAllComponents(VSelect).find(s => s.props('label') === label);

async function choose(wrapper, label, value) {
    await select(wrapper, label).setValue(value);
    await flushPromises();
}

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

describe('AddActivityLogEntryDialog', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('opens from Log Activity, on today, with nothing chosen', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        expect(dialog.find('h3').text()).toBe('2026-07-04');
        expect(select(wrapper, 'Activity').props('items')).toEqual(activityTypes);
        expect(select(wrapper, 'Activity').props('modelValue')).toBeNull();
        expect(select(wrapper, 'SubType').props('items')).toEqual([]);
        expect(dialog.find('textarea').element.value).toBe('');
    });

    it('offers no activities when given none', async () => {
        const wrapper = mountDialog({ activityTypes: undefined });
        await open(wrapper);

        expect(select(wrapper, 'Activity').props('items')).toEqual([]);
    });

    it("offers the chosen activity's subtypes", async () => {
        const wrapper = mountDialog();
        await open(wrapper);

        await choose(wrapper, 'Activity', activityTypes[0]);

        expect(select(wrapper, 'SubType').props('items')).toEqual(['Miracle Grow', 'CalMag']);
    });

    it('clears the subtype when the activity changes', async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await choose(wrapper, 'Activity', activityTypes[0]);
        await choose(wrapper, 'SubType', 'CalMag');

        await choose(wrapper, 'Activity', activityTypes[1]);

        expect(select(wrapper, 'SubType').props('modelValue')).toBeNull();
        expect(select(wrapper, 'SubType').props('items')).toEqual(['Neem Oil']);
    });

    it('submits the date, the activity by name, its subtype and the comments, and closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await pickDate(wrapper, dialog, new Date(2026, 6, 1));
        await choose(wrapper, 'Activity', activityTypes[0]);
        await choose(wrapper, 'SubType', 'CalMag');
        await dialog.find('textarea').setValue('Tomatoes only');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
            entryDate: '2026-07-01T00:00:00',
            activityType: 'FERTILIZE',
            subType: 'CalMag',
            comments: 'Tomatoes only',
        });
        expect(isOpen()).toBe(false);
    });

    it('submits a null subtype when none is chosen', async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await choose(wrapper, 'Activity', activityTypes[1]);

        await press(dialogTitled('Log Activity'), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][0]).toMatchObject({ activityType: 'TREAT', subType: null, comments: '' });
    });

    // An entry date is the user's wall-clock time, sent and returned with no
    // timezone, so a New York evening's entry stays on that evening
    it('sends the moment of a default date, as its local wall-clock time', async () => {
        const wrapper = mountDialog({ now: '2026-07-04T21:30:00' });
        await open(wrapper);
        await choose(wrapper, 'Activity', activityTypes[0]);

        await press(dialogTitled('Log Activity'), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][0].entryDate).toBe('2026-07-04T21:30:00');
    });

    it('starts afresh after a submit', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await pickDate(wrapper, dialog, new Date(2026, 6, 1));
        await choose(wrapper, 'Activity', activityTypes[0]);
        await choose(wrapper, 'SubType', 'CalMag');
        await dialog.find('textarea').setValue('Tomatoes only');
        await press(dialog, 'Confirm');

        dialog = await open(wrapper);

        expect(dialog.find('h3').text()).toBe('2026-07-04');
        expect(select(wrapper, 'Activity').props('modelValue')).toBeNull();
        expect(select(wrapper, 'SubType').props('modelValue')).toBeNull();
        expect(dialog.find('textarea').element.value).toBe('');
    });

    it('clears the entry on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await choose(wrapper, 'Activity', activityTypes[0]);
        await dialog.find('textarea').setValue('never mind');

        await press(dialog, 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onCancel')).toHaveBeenCalledTimes(1);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        dialog = await open(wrapper);
        expect(select(wrapper, 'Activity').props('modelValue')).toBeNull();
        expect(dialog.find('textarea').element.value).toBe('');
    });

    // The service requires an activity (validation-fixes doc, fix 4)
    it('offers Confirm only once an activity is chosen', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await dialog.find('textarea').setValue('Tomatoes only');
        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeDefined();

        await choose(wrapper, 'Activity', activityTypes[0]);

        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeUndefined();
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
        await choose(wrapper, 'Activity', activityTypes[0]);
        await press(dialog, 'Confirm');

        dialog = await open(wrapper);
        await pickDate(wrapper, dialog);

        expect(dialog.find('h3').text()).toBe('2026-07-01');
    });

    it('waits for the save, open', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });
        const dialog = await open(wrapper);
        await choose(wrapper, 'Activity', activityTypes[0]);

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalled();
        expect(isOpen()).toBe(true);
    });

    it('stays open, with the entry, and says so, when the save fails', async () => {
        const wrapper = mountDialog({ onSubmit: vi.fn().mockRejectedValue(httpError(500)) });
        const dialog = await open(wrapper);
        await choose(wrapper, 'Activity', activityTypes[0]);

        await press(dialog, 'Confirm');

        expect(isOpen()).toBe(true);
        expect(document.body.textContent).toContain("Couldn't save. Try again.");
        expect(select(wrapper, 'Activity').props('modelValue')).toEqual(activityTypes[0]);
    });
});
