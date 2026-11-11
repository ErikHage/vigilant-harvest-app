import { flushPromises } from '@vue/test-utils';
import { apiError, serviceErrorBody } from '../../../../helpers/http-errors';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../helpers/fields';
import { dialogTitled } from '../../../../helpers/dialogs';
import { isOpen, openAction, press } from '../../../../helpers/action-dialogs';
import { activityTypes } from '../../../../helpers/schedules';
import MonthDaySelect from '@/components/utils/MonthDaySelect.vue';
import AddScheduleItemDialog from '@/components/admin/schedules/AddScheduleItemDialog.vue';

// An error thrown by a handler goes to `errorHandler`, as an app's would
function mountDialog({ errorHandler, ...props } = {}) {
    return mountWithPlugins(AddScheduleItemDialog, {
        props: { activityTypes, onSubmit: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

const open = wrapper => openAction(wrapper, 'Add Item', 'Add Activity Schedule Item');
const dialog = () => dialogTitled('Add Activity Schedule Item');

const selects = (wrapper, label) => wrapper.findAllComponents(VSelect).filter(s => s.props('label') === label);
const select = (wrapper, label) => selects(wrapper, label)[0];

async function choose(component, value) {
    await component.setValue(value);
    await flushPromises();
}

// Fills in every field, as a user would, with any left out or changed
async function fillIn(wrapper, {
    type = activityTypes[0], subType = activityTypes[0].subTypes[1], frequency = 'weekly', interval = '2',
    start = '05-01', startOffset = 0, end = '09-30', endOffset = 0, notes = 'Side-dress the tomatoes',
} = {}) {
    if (type) await choose(select(wrapper, 'Activity Type'), type);
    if (subType) await choose(select(wrapper, 'Subcategory'), subType);
    if (frequency) await choose(select(wrapper, 'Frequency'), frequency);
    await inputLabelled(dialog(), 'Interval').setValue(interval);
    const [startDay, endDay] = wrapper.findAllComponents(MonthDaySelect);
    if (start) startDay.vm.$emit('update:modelValue', start);
    if (end) endDay.vm.$emit('update:modelValue', end);
    const [startYear, endYear] = selects(wrapper, 'Year Offset');
    await choose(startYear, startOffset);
    await choose(endYear, endOffset);
    if (notes) await inputLabelled(dialog(), 'Notes').setValue(notes);
    await flushPromises();
}

const createDisabled = () => buttonLabelled(dialog(), 'Create').attributes('disabled') !== undefined;

describe('AddScheduleItemDialog', () => {
    it('opens empty, once a week by default, in the current year, with Create disabled', async () => {
        const wrapper = mountDialog();
        await open(wrapper);

        expect(select(wrapper, 'Activity Type').props('items')).toEqual(activityTypes);
        expect(select(wrapper, 'Subcategory').props('disabled')).toBe(true);
        expect(select(wrapper, 'Frequency').props('items')).toEqual(['yearly', 'monthly', 'weekly', 'daily', 'hourly']);
        expect(inputLabelled(dialog(), 'Interval').element.value).toBe('1');
        expect(selects(wrapper, 'Year Offset').map(s => s.props('modelValue'))).toEqual([0, 0]);
        expect(selects(wrapper, 'Year Offset')[0].props('items').map(i => i.label)).toEqual(['previous', 'current', 'next']);
        expect(createDisabled()).toBe(true);
    });

    // Subtype ids restart in each type (B5), but only one type's are offered
    // at a time, so a chosen id can't match another type's
    it("offers the chosen type's subcategories, and clears the subcategory when the type changes", async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await choose(select(wrapper, 'Activity Type'), activityTypes[0]);
        await choose(select(wrapper, 'Subcategory'), activityTypes[0].subTypes[0]);

        await choose(select(wrapper, 'Activity Type'), activityTypes[1]);

        expect(select(wrapper, 'Subcategory').props('modelValue')).toBeNull();
        expect(select(wrapper, 'Subcategory').props('items')).toEqual(activityTypes[1].subTypes);
    });

    it('enables Create once every field is given', async () => {
        const wrapper = mountDialog();
        await open(wrapper);

        await fillIn(wrapper);

        expect(createDisabled()).toBe(false);
    });

    // The service takes an item without a subtype, a rule, dates or notes
    it.each([
        ['a type', { type: null, subType: null }],
        ['a subcategory', { subType: null }],
        ['a frequency', { frequency: null }],
        ['an interval', { interval: '' }],
        ['an interval above 0', { interval: '0' }],
        ['a start date', { start: null }],
        ['an end date', { end: null }],
        ['notes', { notes: null }],
    ])('keeps Create disabled without %s', async (_, missing) => {
        const wrapper = mountDialog();
        await open(wrapper);

        await fillIn(wrapper, missing);

        expect(createDisabled()).toBe(true);
    });

    it('submits the item by names, with the rule built from the frequency and interval, then empties and closes', async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await fillIn(wrapper, { startOffset: -1, endOffset: 1 });

        await press(dialog(), 'Create');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
            activityType: 'Fertilize',
            subType: 'Blood Meal',
            recurrenceRule: 'RRULE:FREQ=WEEKLY;INTERVAL=2',
            startDate: '05-01',
            startDateYearOffset: -1,
            endDate: '09-30',
            endDateYearOffset: 1,
            notes: 'Side-dress the tomatoes',
        });
        expect(isOpen()).toBe(false);
        await open(wrapper);
        expect(select(wrapper, 'Activity Type').props('modelValue')).toBeNull();
        expect(createDisabled()).toBe(true);
    });

    it('closes on Create with no onSubmit given', async () => {
        const wrapper = mountDialog({ onSubmit: undefined });
        await open(wrapper);
        await fillIn(wrapper);

        await press(dialog(), 'Create');

        expect(isOpen()).toBe(false);
    });

    it('empties and closes on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        await open(wrapper);
        await fillIn(wrapper);

        await press(dialog(), 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        await open(wrapper);
        expect(inputLabelled(dialog(), 'Notes').element.value).toBe('');
    });

    // A failed save keeps it open, with what was entered, and it says why: the
    // service's reason for a 400
    it('stays open, with the entry, and says why, when the save fails', async () => {
        const errorHandler = vi.fn();
        const wrapper = mountDialog({ errorHandler, onSubmit: vi.fn().mockRejectedValue(apiError(400, serviceErrorBody(400, 'activityType is required'))) });
        await open(wrapper);
        await fillIn(wrapper);

        await press(dialog(), 'Create');

        expect(errorHandler).not.toHaveBeenCalled();
        expect(document.body.textContent).toContain("activityType is required");
        expect(isOpen()).toBe(true);
        expect(inputLabelled(dialog(), 'Notes').element.value).toBe('Side-dress the tomatoes');
    });

    // DocumentsCurrentBehavior: only a blank or 0 interval disables Create,
    // so a negative or fractional one goes into the rule. The service doesn't
    // check the rule, and the schedule page shows it as "every -1 weeks"
    // (backlog A29). Should take a whole number of at least 1
    it.each([
        ['-1', 'RRULE:FREQ=WEEKLY;INTERVAL=-1'],
        ['1.5', 'RRULE:FREQ=WEEKLY;INTERVAL=1.5'],
    ])('saves an interval of %s', async (interval, rule) => {
        const wrapper = mountDialog();
        await open(wrapper);
        await fillIn(wrapper, { interval });

        await press(dialog(), 'Create');

        expect(wrapper.props('onSubmit').mock.calls[0][0].recurrenceRule).toBe(rule);
    });
});
