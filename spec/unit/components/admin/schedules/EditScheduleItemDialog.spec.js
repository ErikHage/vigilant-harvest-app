import { flushPromises } from '@vue/test-utils';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../helpers/fields';
import { dialogTitled } from '../../../../helpers/dialogs';
import { isOpen, press } from '../../../../helpers/action-dialogs';
import { activityTypes, aScheduleItem } from '../../../../helpers/schedules';
import MonthDaySelect from '@/components/utils/MonthDaySelect.vue';
import EditScheduleItemDialog from '@/components/admin/schedules/EditScheduleItemDialog.vue';

// An error thrown by a handler goes to `errorHandler`, as an app's would
function mountDialog({ errorHandler, ...props } = {}) {
    return mountWithPlugins(EditScheduleItemDialog, {
        props: { activityTypes, scheduleItem: aScheduleItem(), onSubmit: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

// Its button is a bare pencil icon, with no text
async function open(wrapper) {
    await wrapper.find('.v-btn .mdi-pencil').trigger('click');
    await flushPromises();
    return dialogTitled('Edit Activity Schedule Item');
}

const dialog = () => dialogTitled('Edit Activity Schedule Item');
const selects = (wrapper, label) => wrapper.findAllComponents(VSelect).filter(s => s.props('label') === label);
const select = (wrapper, label) => selects(wrapper, label)[0];

// What the form holds: type and subtype by name, frequency, interval, the
// dates with their offsets, and the notes
function form(wrapper) {
    const [start, end] = wrapper.findAllComponents(MonthDaySelect);
    return {
        type: select(wrapper, 'Activity Type').props('modelValue')?.name ?? null,
        subType: select(wrapper, 'Subcategory').props('modelValue')?.name ?? null,
        frequency: select(wrapper, 'Frequency').props('modelValue'),
        interval: inputLabelled(dialog(), 'Interval').element.value,
        start: start.props('modelValue'),
        startOffset: selects(wrapper, 'Year Offset')[0].props('modelValue'),
        end: end.props('modelValue'),
        endOffset: selects(wrapper, 'Year Offset')[1].props('modelValue'),
        notes: inputLabelled(dialog(), 'Notes').element.value,
    };
}

const saveDisabled = () => buttonLabelled(dialog(), 'Save').attributes('disabled') !== undefined;

async function choose(component, value) {
    await component.setValue(value);
    await flushPromises();
}

describe('EditScheduleItemDialog', () => {
    it('opens on the item, its rule read back into a frequency and interval', async () => {
        const wrapper = mountDialog();
        await open(wrapper);

        expect(form(wrapper)).toEqual({
            type: 'Fertilize', subType: 'Blood Meal', frequency: 'weekly', interval: '2',
            start: '05-01', startOffset: 0, end: '09-30', endOffset: 0, notes: 'Side-dress the tomatoes',
        });
        expect(saveDisabled()).toBe(false);
    });

    it('submits the edited item with its id, by names, with the rule rebuilt, then closes', async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await choose(select(wrapper, 'Activity Type'), activityTypes[1]);
        await choose(select(wrapper, 'Subcategory'), activityTypes[1].subTypes[0]);
        await choose(select(wrapper, 'Frequency'), 'monthly');
        await inputLabelled(dialog(), 'Interval').setValue('1');
        const [start, end] = wrapper.findAllComponents(MonthDaySelect);
        start.vm.$emit('update:modelValue', '04-15');
        end.vm.$emit('update:modelValue', '10-15');
        await choose(selects(wrapper, 'Year Offset')[0], -1);
        await choose(selects(wrapper, 'Year Offset')[1], 1);

        await press(dialog(), 'Save');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
            entryId: 'item-1',
            activityType: 'Treatment',
            subType: 'Neem Oil',
            recurrenceRule: 'RRULE:FREQ=MONTHLY;INTERVAL=1',
            startDate: '04-15',
            startDateYearOffset: -1,
            endDate: '10-15',
            endDateYearOffset: 1,
            notes: 'Side-dress the tomatoes',
        });
        expect(isOpen()).toBe(false);
    });

    // The activity log's types and the schedules' share no names (B11), so
    // an item's type may not be one the dialog offers
    it("opens with no type or subcategory for names it doesn't offer, and Save disabled", async () => {
        const wrapper = mountDialog({ scheduleItem: aScheduleItem({ activityType: 'FERTILIZE', subType: 'CalMag' }) });
        await open(wrapper);

        expect(form(wrapper)).toMatchObject({ type: null, subType: null });
        expect(saveDisabled()).toBe(true);
    });

    it("opens with no subcategory for one its type doesn't have", async () => {
        const wrapper = mountDialog({ scheduleItem: aScheduleItem({ subType: 'Neem Oil' }) });
        await open(wrapper);

        expect(form(wrapper)).toMatchObject({ type: 'Fertilize', subType: null });
    });

    // The page loads the types after the schedule, so they can arrive later
    it('fills in the type once the types arrive', async () => {
        const wrapper = mountDialog({ activityTypes: [] });

        await wrapper.setProps({ activityTypes });
        await open(wrapper);

        expect(form(wrapper)).toMatchObject({ type: 'Fertilize', subType: 'Blood Meal' });
    });

    it('takes up a new item given to it', async () => {
        const wrapper = mountDialog();

        await wrapper.setProps({ scheduleItem: aScheduleItem({ notes: 'Every other week', recurrenceRule: 'RRULE:FREQ=DAILY;INTERVAL=3' }) });
        await open(wrapper);

        expect(form(wrapper)).toMatchObject({ frequency: 'daily', interval: '3', notes: 'Every other week' });
    });

    // The service takes an item without notes, as it may have been saved
    it('keeps Save disabled for an item with no notes, until some are written', async () => {
        const wrapper = mountDialog({ scheduleItem: aScheduleItem({ notes: null }) });
        await open(wrapper);
        expect(saveDisabled()).toBe(true);

        await inputLabelled(dialog(), 'Notes').setValue('Side-dress');

        expect(saveDisabled()).toBe(false);
    });

    it('closes on Save with no onSubmit given', async () => {
        const wrapper = mountDialog({ onSubmit: undefined });
        await open(wrapper);

        await press(dialog(), 'Save');

        expect(isOpen()).toBe(false);
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();
        await open(wrapper);

        await press(dialog(), 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
    });

    // DocumentsCurrentBehavior: Cancel keeps the edits, so the next open
    // shows them, not the item, and Save sends them (backlog A13). The same
    // after a failed save: the store swallows (A6), the page reloads the
    // unchanged item, and only then is the form reset. Should go back to the
    // item on Cancel
    it('keeps a cancelled edit for the next time it opens', async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await inputLabelled(dialog(), 'Notes').setValue('never mind');
        await press(dialog(), 'Cancel');

        await open(wrapper);

        expect(form(wrapper).notes).toBe('never mind');
    });

    // It waits for onSubmit; the page's never rejects, since the store
    // swallows (A6)
    it('stays open when the save rejects', async () => {
        const errorHandler = vi.fn();
        const wrapper = mountDialog({ errorHandler, onSubmit: vi.fn().mockRejectedValue(new Error('error updating activity schedule item')) });
        await open(wrapper);

        await press(dialog(), 'Save');

        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(isOpen()).toBe(true);
    });

    // DocumentsCurrentBehavior: only a blank or 0 interval disables Save, so
    // a negative one goes into the rule (backlog A29). Should take a whole
    // number of at least 1
    it('saves an interval of -1', async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await inputLabelled(dialog(), 'Interval').setValue('-1');

        await press(dialog(), 'Save');

        expect(wrapper.props('onSubmit').mock.calls[0][0].recurrenceRule).toBe('RRULE:FREQ=WEEKLY;INTERVAL=-1');
    });
});
