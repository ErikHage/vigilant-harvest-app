import { flushPromises } from '@vue/test-utils';
import { apiError, serviceErrorBody } from '../../../helpers/http-errors';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../helpers/fields';
import { dialogTitled } from '../../../helpers/dialogs';
import { isOpen, press } from '../../../helpers/action-dialogs';
import PlantSubcategoryAddDialog from '@/components/admin/PlantSubcategoryAddDialog.vue';

const category = { categoryId: 'category-1', categoryName: 'Legumes', subcategories: [] };

// An error thrown by a handler goes to `errorHandler`, as an app's would
function mountDialog({ errorHandler, ...props } = {}) {
    return mountWithPlugins(PlantSubcategoryAddDialog, {
        props: { category, onSubmit: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

// Its button is a bare plus icon, with no text
async function open(wrapper) {
    await wrapper.find('.v-btn .mdi-plus').trigger('click');
    await flushPromises();
    return dialogTitled('Add Subcategory');
}

describe('PlantSubcategoryAddDialog', () => {
    it('opens from its plus button, naming the category, with Add disabled', async () => {
        const dialog = await open(mountDialog());

        expect(dialog.find('.v-card-subtitle').text()).toBe('Category: Legumes');
        expect(inputLabelled(dialog, 'Subcategory Name').element.value).toBe('');
        expect(buttonLabelled(dialog, 'Add').attributes('disabled')).toBeDefined();
    });

    it("submits the name, trimmed, with the category's id, then empties and closes", async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Subcategory Name').setValue(' Lentils ');

        await press(dialog, 'Add');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({ categoryId: 'category-1', subcategoryName: 'Lentils' });
        expect(isOpen()).toBe(false);
        dialog = await open(wrapper);
        expect(inputLabelled(dialog, 'Subcategory Name').element.value).toBe('');
    });

    it('empties and closes on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Subcategory Name').setValue('Lentils');

        await press(dialog, 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        dialog = await open(wrapper);
        expect(inputLabelled(dialog, 'Subcategory Name').element.value).toBe('');
    });

    // A failed save keeps it open, with what was entered, and it says why: the
    // service's reason for a 400
    it('stays open, with the name, and says why, when the save fails', async () => {
        const errorHandler = vi.fn();
        const wrapper = mountDialog({ errorHandler, onSubmit: vi.fn().mockRejectedValue(apiError(400, serviceErrorBody(400, 'subcategoryName is required'))) });
        const dialog = await open(wrapper);
        await inputLabelled(dialog, 'Subcategory Name').setValue('Lentils');

        await press(dialog, 'Add');

        expect(errorHandler).not.toHaveBeenCalled();
        expect(document.body.textContent).toContain("subcategoryName is required");
        expect(isOpen()).toBe(true);
        expect(inputLabelled(dialog, 'Subcategory Name').element.value).toBe('Lentils');
    });

    // DocumentsCurrentBehavior: Add is enabled by any text, but the name is
    // trimmed when sent, so a name of spaces goes out as ''. The service
    // rejects it (subcategoryName is required), and the dialog stays open,
    // saying so (backlog A16). Should keep Add disabled until the trimmed name
    // has something in it
    it('submits a name of spaces as an empty name', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await inputLabelled(dialog, 'Subcategory Name').setValue('   ');

        await press(dialog, 'Add');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({ categoryId: 'category-1', subcategoryName: '' });
    });
});
