import { flushPromises } from '@vue/test-utils';
import { VDatePicker } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';

function mountActivator(props) {
    return mountWithPlugins(DatePickerDialogActivator, {
        props: { title: 'Sown on', onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

async function open(wrapper) {
    await wrapper.find('.v-btn').trigger('click');
    await flushPromises();
    return dialogTitled('Sown on');
}

async function pick(wrapper, date) {
    wrapper.findComponent(VDatePicker).vm.$emit('update:modelValue', date);
    await flushPromises();
}

describe('DatePickerDialogActivator', () => {
    it('shows a calendar button, and opens on a click', async () => {
        const wrapper = mountActivator();
        await flushPromises();
        expect(wrapper.find('.v-btn .mdi-calendar').exists()).toBe(true);
        expect(findDialog('Sown on')).toBeUndefined();

        await open(wrapper);

        expect(findDialog('Sown on')).toBeDefined();
    });

    it('disables the button when told to', () => {
        const wrapper = mountActivator({ disabled: true });

        expect(wrapper.find('.v-btn').attributes('disabled')).toBeDefined();
    });

    it('submits the picked date, and closes', async () => {
        const wrapper = mountActivator();
        const dialog = await open(wrapper);
        const picked = new Date(2026, 2, 15);

        await pick(wrapper, picked);
        await buttonLabelled(dialog, 'Confirm').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(picked);
        expect(findDialog('Sown on')).toBeUndefined();
    });

    it('submits the date it was given, if none is picked', async () => {
        const date = new Date(2026, 2, 1);
        const wrapper = mountActivator({ date });
        const dialog = await open(wrapper);

        await buttonLabelled(dialog, 'Confirm').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(date);
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountActivator();
        const dialog = await open(wrapper);

        await buttonLabelled(dialog, 'Cancel').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(findDialog('Sown on')).toBeUndefined();
    });

    // DocumentsCurrentBehavior: Cancel closes the dialog but keeps the date that
    // was picked, so opening it again and confirming submits the cancelled
    // choice. Should go back to the date it was given
    it('keeps a cancelled date for the next time it opens', async () => {
        const given = new Date(2026, 2, 1);
        const cancelled = new Date(2026, 2, 20);
        const wrapper = mountActivator({ date: given });
        const dialog = await open(wrapper);
        await pick(wrapper, cancelled);
        await buttonLabelled(dialog, 'Cancel').trigger('click');
        await flushPromises();

        await buttonLabelled(await open(wrapper), 'Confirm').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(cancelled);
    });

    // The date is read once, when the component is created
    it('ignores a new date given after it was created', async () => {
        const wrapper = mountActivator({ date: new Date(2026, 2, 1) });
        await wrapper.setProps({ date: new Date(2026, 3, 1) });

        await buttonLabelled(await open(wrapper), 'Confirm').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(new Date(2026, 2, 1));
    });
});
