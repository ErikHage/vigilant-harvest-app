import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import PlantTagsDialog from '@/components/plants/PlantTagsDialog.vue';

function mountDialog(props) {
    return mountWithPlugins(PlantTagsDialog, {
        props: { onSubmit: vi.fn(), tags: ['Cold Tolerant'], ...props },
        attachTo: document.body,
    });
}

async function open(wrapper) {
    await wrapper.find('.v-btn').trigger('click');
    await flushPromises();
    return dialogTitled('Plant Tags');
}

// Each chip's tag, and whether it's selected
function chips(dialog) {
    return dialog.findAll('.v-chip').map(chip => [chip.text(), chip.classes('v-chip--selected')]);
}

async function toggle(dialog, tag) {
    await dialog.findAll('.v-chip').find(chip => chip.text() === tag).trigger('click');
    await flushPromises();
}

describe('PlantTagsDialog', () => {
    it('opens from a pencil button', async () => {
        const wrapper = mountDialog();
        expect(wrapper.find('.v-btn .mdi-pencil').exists()).toBe(true);
        expect(findDialog('Plant Tags')).toBeUndefined();

        await open(wrapper);

        expect(findDialog('Plant Tags').find('.v-card-subtitle').text()).toBe('select plant tags');
    });

    it("offers the four tags, with the plant's selected", async () => {
        const wrapper = mountDialog();

        const dialog = await open(wrapper);

        expect(chips(dialog)).toEqual([
            ['Container Friendly', false],
            ['Cold Tolerant', true],
            ['Determinate', false],
            ['Indeterminate', false],
        ]);
    });

    it('submits the tags as toggled, and closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        await toggle(dialog, 'Cold Tolerant');
        await toggle(dialog, 'Determinate');
        await buttonLabelled(dialog, 'Confirm').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(['Determinate']);
        expect(findDialog('Plant Tags')).toBeUndefined();
    });

    it("keeps a tag it doesn't offer, unseen, when nothing is toggled", async () => {
        const wrapper = mountDialog({ tags: ['Heirloom', 'Cold Tolerant'] });
        const dialog = await open(wrapper);
        expect(chips(dialog).map(([tag]) => tag)).not.toContain('Heirloom');

        await buttonLabelled(dialog, 'Confirm').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(['Heirloom', 'Cold Tolerant']);
    });

    // DocumentsCurrentBehavior: a tag the dialog doesn't offer has no chip, and
    // Vuetify's chip group drops a value with no chip as soon as any chip is
    // toggled. So editing the tags of a plant with such a tag silently removes
    // it. Should offer the plant's own tags as chips too
    it("drops a tag it doesn't offer once any chip is toggled", async () => {
        const wrapper = mountDialog({ tags: ['Heirloom', 'Cold Tolerant'] });
        const dialog = await open(wrapper);

        await toggle(dialog, 'Determinate');
        await buttonLabelled(dialog, 'Confirm').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(['Cold Tolerant', 'Determinate']);
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        await buttonLabelled(dialog, 'Cancel').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(findDialog('Plant Tags')).toBeUndefined();
    });

    // Back to the plant's tags (backlog A13)
    it('forgets a cancelled choice the next time it opens', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await toggle(dialog, 'Determinate');
        await buttonLabelled(dialog, 'Cancel').trigger('click');
        await flushPromises();

        dialog = await open(wrapper);

        expect(chips(dialog).find(([tag]) => tag === 'Determinate')).toEqual(['Determinate', false]);
    });

    it("follows new tags from its parent", async () => {
        const wrapper = mountDialog();

        await wrapper.setProps({ tags: ['Indeterminate'] });
        const dialog = await open(wrapper);

        expect(chips(dialog).filter(([, selected]) => selected).map(([tag]) => tag)).toEqual(['Indeterminate']);
    });

    it('selects nothing when given no tags', async () => {
        const wrapper = mountWithPlugins(PlantTagsDialog, { props: { onSubmit: vi.fn() }, attachTo: document.body });

        const dialog = await open(wrapper);

        expect(chips(dialog).some(([, selected]) => selected)).toBe(false);
    });
});
