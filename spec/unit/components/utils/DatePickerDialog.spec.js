import { flushPromises } from '@vue/test-utils';
import { VDatePicker } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import DatePickerDialog from '@/components/utils/DatePickerDialog.vue';

// Nothing in the app uses this component. DatePickerDialogActivator and
// DatePickerDialogDayJs are the two in use
function mountDialog(props) {
    return mountWithPlugins(DatePickerDialog, {
        props: { title: 'Last frost', onSubmit: vi.fn(), onCancel: vi.fn(), ...props },
        attachTo: document.body,
    });
}

describe('DatePickerDialog', () => {
    it('is open while show is true', async () => {
        const wrapper = mountDialog({ show: false });
        await flushPromises();
        expect(findDialog('Last frost')).toBeUndefined();

        await wrapper.setProps({ show: true });
        await flushPromises();

        expect(findDialog('Last frost')).toBeDefined();
    });

    it('submits the date it was given, if none is picked', async () => {
        const date = new Date(2026, 4, 10);
        const wrapper = mountDialog({ show: true, date });
        await flushPromises();

        await buttonLabelled(dialogTitled('Last frost'), 'Ok').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(date);
    });

    it('submits the picked date', async () => {
        const wrapper = mountDialog({ show: true });
        await flushPromises();
        const picked = new Date(2026, 4, 12);

        wrapper.findComponent(VDatePicker).vm.$emit('update:modelValue', picked);
        await flushPromises();
        await buttonLabelled(dialogTitled('Last frost'), 'Ok').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(picked);
    });

    it('cancels without submitting', async () => {
        const wrapper = mountDialog({ show: true });
        await flushPromises();

        await buttonLabelled(dialogTitled('Last frost'), 'Cancel').trigger('click');

        expect(wrapper.props('onCancel')).toHaveBeenCalledTimes(1);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
    });
});
