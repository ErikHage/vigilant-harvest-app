import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import MonthDaySelect from '@/components/utils/MonthDaySelect.vue';

function mountSelect(props) {
    return mountWithPlugins(MonthDaySelect, { props });
}

function selects(wrapper) {
    const [month, day] = wrapper.findAllComponents(VSelect);
    return { month, day };
}

// What the component last emitted for v-model
function lastEmitted(wrapper) {
    const emitted = wrapper.emitted('update:modelValue');
    return emitted[emitted.length - 1][0];
}

describe('MonthDaySelect', () => {
    it('labels its selects Month and Day by default, or as told', () => {
        expect(selects(mountSelect()).month.props('label')).toBe('Month');
        expect(selects(mountSelect()).day.props('label')).toBe('Day');

        const labelled = selects(mountSelect({ monthLabel: 'Start month', dayLabel: 'Start day' }));
        expect(labelled.month.props('label')).toBe('Start month');
        expect(labelled.day.props('label')).toBe('Start day');
    });

    it('starts from an MM-DD value', () => {
        const { month, day } = selects(mountSelect({ modelValue: '05-15' }));

        expect(month.props('modelValue')).toBe('05');
        expect(day.props('modelValue')).toBe('15');
    });

    it.each([null, '5-15', '2026-05-15'])('starts empty from %s', modelValue => {
        const { month, day } = selects(mountSelect({ modelValue }));

        expect(month.props('modelValue')).toBeNull();
        expect(day.props('modelValue')).toBeNull();
    });

    it('follows a new value from its parent', async () => {
        const wrapper = mountSelect({ modelValue: '05-15' });

        await wrapper.setProps({ modelValue: '09-01' });

        expect(selects(wrapper).month.props('modelValue')).toBe('09');
        expect(selects(wrapper).day.props('modelValue')).toBe('01');
    });

    it('disables the day until a month is chosen', async () => {
        const wrapper = mountSelect();
        expect(selects(wrapper).day.props('disabled')).toBe(true);
        expect(selects(wrapper).day.props('items')).toEqual([]);

        await selects(wrapper).month.setValue('04');

        expect(selects(wrapper).day.props('disabled')).toBe(false);
    });

    it.each([
        ['01', 31],
        ['04', 30],
        ['12', 31],
    ])('offers each day of month %s, 1 to %i', async (monthValue, days) => {
        const wrapper = mountSelect();

        await selects(wrapper).month.setValue(monthValue);

        const items = selects(wrapper).day.props('items');
        expect(items).toHaveLength(days);
        expect(items[0]).toBe('01');
        expect(items[days - 1]).toBe(String(days));
    });

    // scheduling.getFormattedDateRange formats '02-29' (spec/unit/utils), but
    // this select can't produce it
    it('offers February only 28 days', async () => {
        const wrapper = mountSelect();

        await selects(wrapper).month.setValue('02');

        expect(selects(wrapper).day.props('items')).toHaveLength(28);
    });

    it('emits MM-DD once both are chosen, and null before', async () => {
        const wrapper = mountSelect();

        await selects(wrapper).month.setValue('05');
        expect(lastEmitted(wrapper)).toBeNull();

        await selects(wrapper).day.setValue('15');
        expect(lastEmitted(wrapper)).toBe('05-15');
    });

    it('keeps the day when the new month has it', async () => {
        const wrapper = mountSelect({ modelValue: '05-30' });

        await selects(wrapper).month.setValue('06');

        expect(lastEmitted(wrapper)).toBe('06-30');
    });

    it("clears the day, and emits null, when the new month doesn't have it", async () => {
        const wrapper = mountSelect({ modelValue: '05-31' });

        await selects(wrapper).month.setValue('06');

        expect(selects(wrapper).day.props('modelValue')).toBeNull();
        expect(lastEmitted(wrapper)).toBeNull();
    });
});
