import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled, inputLabelled, typeInto } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import NoCarryForwardDialog from '@/components/years/NoCarryForwardDialog.vue';

const title = 'Carry nothing forward?';

async function mountDialog(props) {
    const wrapper = mountWithPlugins(NoCarryForwardDialog, {
        props: {
            show: true,
            plantingYear: 2027,
            onConfirm: vi.fn(),
            onCancel: vi.fn(),
            ...props,
        },
        attachTo: document.body,
    });
    await flushPromises();
    return wrapper;
}

const create = () => buttonLabelled(dialogTitled(title), 'Create without plantings');

describe('NoCarryForwardDialog', () => {
    let wrapper;

    afterEach(() => {
        wrapper?.unmount();
    });

    it('warns that nothing will be carried into the year, and says what to type', async () => {
        wrapper = await mountDialog();

        const text = dialogTitled(title).text();
        expect(text).toContain("No plantings will be carried into 2027. Perennials planted in earlier years won't appear in it.");
        expect(text).toContain('Type carry nothing forward to create the year anyway.');
    });

    it('offers Create only once the phrase is typed', async () => {
        wrapper = await mountDialog();
        expect(create().attributes('disabled')).toBeDefined();

        await typeInto(dialogTitled(title), 'Confirmation', 'carry nothing forward');

        expect(create().attributes('disabled')).toBeUndefined();
    });

    it.each([
        ['in another case', 'Carry nothing forward'],
        ['with a space after it', 'carry nothing forward '],
        ['with a space before it', ' carry nothing forward'],
        ['in part', 'carry nothing'],
    ])('wants the phrase exactly, not %s', async (_, typed) => {
        wrapper = await mountDialog();

        await typeInto(dialogTitled(title), 'Confirmation', typed);

        expect(create().attributes('disabled')).toBeDefined();
    });

    it.each([
        ['Cancel', 'onCancel'],
        ['Create without plantings', 'onConfirm'],
    ])('calls %s through %s, and leaves closing to its parent', async (label, handler) => {
        wrapper = await mountDialog();
        await typeInto(dialogTitled(title), 'Confirmation', 'carry nothing forward');

        await buttonLabelled(dialogTitled(title), label).trigger('click');
        await flushPromises();

        expect(wrapper.props(handler)).toHaveBeenCalledTimes(1);
        expect(findDialog(title)).toBeDefined();
    });

    it('starts empty each time it opens', async () => {
        wrapper = await mountDialog();
        await typeInto(dialogTitled(title), 'Confirmation', 'carry nothing forward');

        await wrapper.setProps({ show: false });
        await flushPromises();
        expect(findDialog(title)).toBeUndefined();
        await wrapper.setProps({ show: true });
        await flushPromises();

        expect(inputLabelled(dialogTitled(title), 'Confirmation').element.value).toBe('');
        expect(create().attributes('disabled')).toBeDefined();
    });
});
