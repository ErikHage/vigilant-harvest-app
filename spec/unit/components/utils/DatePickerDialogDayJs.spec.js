import dayjs from 'dayjs';
import { flushPromises } from '@vue/test-utils';
import { VDatePicker } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import DatePickerDialogDayJs from '@/components/utils/DatePickerDialogDayJs.vue';

function mountPicker(props) {
    return mountWithPlugins(DatePickerDialogDayJs, {
        props: { title: 'Start date', onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

async function open(wrapper) {
    await wrapper.find('.v-btn').trigger('click');
    await flushPromises();
    return dialogTitled('Start date');
}

describe('DatePickerDialogDayJs', () => {
    it('is named DatePickerDialogActivator, the name of the component it was copied from', () => {
        expect(DatePickerDialogDayJs.name).toBe('DatePickerDialogActivator');
    });

    it.each([
        ['a Date', new Date(2026, 4, 15)],
        ['a dayjs date', dayjs('2026-05-15')],
        ['an ISO string', '2026-05-15'],
    ])('accepts %s, and submits it as a dayjs date', async (_, date) => {
        const wrapper = mountPicker({ date });

        await buttonLabelled(await open(wrapper), 'Confirm').trigger('click');

        const [submitted] = wrapper.props('onSubmit').mock.calls[0];
        expect(dayjs.isDayjs(submitted)).toBe(true);
        expect(submitted.format('YYYY-MM-DD')).toBe('2026-05-15');
    });

    it('submits the picked date as a dayjs date, and closes', async () => {
        const wrapper = mountPicker();
        const dialog = await open(wrapper);

        wrapper.findComponent(VDatePicker).vm.$emit('update:modelValue', new Date(2026, 5, 1));
        await flushPromises();
        await buttonLabelled(dialog, 'Confirm').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit').mock.calls[0][0].format('YYYY-MM-DD')).toBe('2026-06-01');
        expect(findDialog('Start date')).toBeUndefined();
    });

    // Confirm is never disabled, so with no date given or picked it submits
    // dayjs(null), which is an invalid date
    it('submits an invalid date when none was given or picked', async () => {
        const wrapper = mountPicker();

        await buttonLabelled(await open(wrapper), 'Confirm').trigger('click');

        expect(wrapper.props('onSubmit').mock.calls[0][0].isValid()).toBe(false);
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountPicker();

        await buttonLabelled(await open(wrapper), 'Cancel').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(findDialog('Start date')).toBeUndefined();
    });
});
