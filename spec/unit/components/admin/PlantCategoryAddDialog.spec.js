import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../helpers/fields';
import { dialogTitled } from '../../../helpers/dialogs';
import { isOpen, openAction, press } from '../../../helpers/action-dialogs';
import PlantCategoryAddDialog from '@/components/admin/PlantCategoryAddDialog.vue';

// An error thrown by a handler goes to `errorHandler`, as an app's would
function mountDialog({ errorHandler, ...props } = {}) {
    return mountWithPlugins(PlantCategoryAddDialog, {
        props: { onSubmit: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

const open = wrapper => openAction(wrapper, 'Add Category', 'Add Category');

describe('PlantCategoryAddDialog', () => {
    // Its name is AddCategoryDialog (B13)
    it('is named AddCategoryDialog', () => {
        expect(PlantCategoryAddDialog.name).toBe('AddCategoryDialog');
    });

    it('opens from Add Category, empty, with Create disabled', async () => {
        const dialog = await open(mountDialog());

        expect(inputLabelled(dialog, 'Category Name').element.value).toBe('');
        expect(buttonLabelled(dialog, 'Create').attributes('disabled')).toBeDefined();
    });

    it('submits the name, trimmed, then empties and closes', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Category Name').setValue('  Alliums ');

        await press(dialog, 'Create');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({ categoryName: 'Alliums' });
        expect(isOpen()).toBe(false);
        dialog = await open(wrapper);
        expect(inputLabelled(dialog, 'Category Name').element.value).toBe('');
    });

    it('empties and closes on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Category Name').setValue('Alliums');

        await press(dialog, 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        dialog = await open(wrapper);
        expect(inputLabelled(dialog, 'Category Name').element.value).toBe('');
    });

    // It waits for onSubmit, so a page whose save rejected would keep it open.
    // PlantCategoriesPage's doesn't reject: the store swallows (A6)
    it('stays open, with the name, when the save rejects', async () => {
        const errorHandler = vi.fn();
        const wrapper = mountDialog({ errorHandler, onSubmit: vi.fn().mockRejectedValue(new Error('error creating category')) });
        const dialog = await open(wrapper);
        await inputLabelled(dialog, 'Category Name').setValue('Alliums');

        await press(dialog, 'Create');

        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(isOpen()).toBe(true);
        expect(inputLabelled(dialogTitled('Add Category'), 'Category Name').element.value).toBe('Alliums');
    });

    // DocumentsCurrentBehavior: Create is enabled by any text, but the name
    // is trimmed when sent, so a name of spaces goes out as ''. The service
    // rejects it (categoryName is required), the store shows only "error
    // creating category", and the dialog closes, since the store swallows
    // (backlog A16, A6). Should keep Create disabled until the trimmed name
    // has something in it
    it('submits a name of spaces as an empty name', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await inputLabelled(dialog, 'Category Name').setValue('   ');
        expect(buttonLabelled(dialog, 'Create').attributes('disabled')).toBeUndefined();

        await press(dialog, 'Create');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({ categoryName: '' });
    });
});
