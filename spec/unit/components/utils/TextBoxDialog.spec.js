import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import TextBoxDialog from '@/components/utils/TextBoxDialog.vue';

function mountTextBox(props) {
    return mountWithPlugins(TextBoxDialog, {
        props: { title: 'Notes', onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

async function open(wrapper) {
    await wrapper.find('.v-btn').trigger('click');
    await flushPromises();
    return dialogTitled('Notes');
}

async function type(dialog, text) {
    const textarea = dialog.find('textarea');
    await textarea.setValue(text);
    await flushPromises();
}

describe('TextBoxDialog', () => {
    it('opens from a button with its text', async () => {
        const wrapper = mountTextBox({ buttonText: 'Edit notes' });

        expect(wrapper.find('.v-btn').text()).toBe('Edit notes');
        await open(wrapper);

        expect(findDialog('Notes')).toBeDefined();
    });

    it('opens from a pencil icon when it has no text', () => {
        const wrapper = mountTextBox();

        expect(wrapper.find('.v-btn .mdi-pencil').exists()).toBe(true);
    });

    it('shows its subtitle', async () => {
        const wrapper = mountTextBox({ subtitle: 'Provider bush bean' });

        const dialog = await open(wrapper);

        expect(dialog.find('.v-card-subtitle').text()).toBe('Provider bush bean');
    });

    it('starts from the value it was given', async () => {
        const wrapper = mountTextBox({ value: 'Sow after the last frost' });

        const dialog = await open(wrapper);

        expect(dialog.find('textarea').element.value).toBe('Sow after the last frost');
    });

    it('submits the edited text, and closes', async () => {
        const wrapper = mountTextBox({ value: 'Sow after the last frost' });
        const dialog = await open(wrapper);

        await type(dialog, 'Sow two weeks after the last frost');
        await buttonLabelled(dialog, 'Confirm').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('Sow two weeks after the last frost');
        expect(findDialog('Notes')).toBeUndefined();
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountTextBox();
        const dialog = await open(wrapper);

        await buttonLabelled(dialog, 'Cancel').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(findDialog('Notes')).toBeUndefined();
    });

    // Back to the value it was given (backlog A13)
    it('forgets a cancelled edit the next time it opens', async () => {
        const wrapper = mountTextBox({ value: 'Sow after the last frost' });
        await type(await open(wrapper), 'a cancelled edit');
        await buttonLabelled(dialogTitled('Notes'), 'Cancel').trigger('click');
        await flushPromises();

        const dialog = await open(wrapper);

        expect(dialog.find('textarea').element.value).toBe('Sow after the last frost');
    });

    it('follows a new value from its parent', async () => {
        const wrapper = mountTextBox({ value: 'first' });

        await wrapper.setProps({ value: 'second' });
        const dialog = await open(wrapper);

        expect(dialog.find('textarea').element.value).toBe('second');
    });
});
