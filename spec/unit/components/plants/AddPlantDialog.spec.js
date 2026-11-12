import { flushPromises } from '@vue/test-utils';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import { httpError } from '../../../helpers/http-errors';
import AddPlantDialog from '@/components/plants/AddPlantDialog.vue';

const categories = [
    {
        categoryId: 'category-1',
        categoryName: 'Legumes',
        subcategories: [
            { subcategoryId: 'subcategory-1', subcategoryName: 'Beans' },
            { subcategoryId: 'subcategory-2', subcategoryName: 'Peas' },
        ],
    },
    {
        categoryId: 'category-2',
        categoryName: 'Nightshades',
        subcategories: [{ subcategoryId: 'subcategory-3', subcategoryName: 'Tomatoes' }],
    },
];
const harvestTypes = [
    { harvestTypeId: 1, harvestTypeName: 'unspecified' },
    { harvestTypeId: 2, harvestTypeName: 'pounds' },
];

async function mountDialog(props) {
    const wrapper = mountWithPlugins(AddPlantDialog, {
        props: { show: true, categories, harvestTypes, onSubmit: vi.fn(), onCancel: vi.fn(), ...props },
        attachTo: document.body,
    });
    await flushPromises();
    return wrapper;
}

const select = (wrapper, label) => wrapper.findAllComponents(VSelect).find(s => s.props('label') === label);

// Fills in the form as a user would, with the fields' own events
async function fillIn(wrapper) {
    const dialog = dialogTitled('Add Plant');
    await inputLabelled(dialog, 'Name').setValue('Provider bush bean');
    await select(wrapper, 'Category').setValue(categories[0]);
    await select(wrapper, 'Subcategory').setValue('subcategory-1');
    await select(wrapper, 'Lifespan Type').setValue('Annual');
    await select(wrapper, 'Default Harvest Type').setValue(2);
    await dialog.find('textarea').setValue('A reliable bush bean.');
    await flushPromises();
}

describe('AddPlantDialog', () => {
    it('is open while show is true', async () => {
        const wrapper = await mountDialog({ show: false });
        expect(findDialog('Add Plant')).toBeUndefined();

        await wrapper.setProps({ show: true });
        await flushPromises();

        expect(findDialog('Add Plant')).toBeDefined();
    });

    it('offers the categories, the four lifespan types and the harvest types', async () => {
        const wrapper = await mountDialog();

        expect(select(wrapper, 'Category').props('items')).toEqual(categories);
        expect(select(wrapper, 'Lifespan Type').props('items')).toEqual(['Annual', 'Perennial', 'Biennial', 'Unknown']);
        expect(select(wrapper, 'Default Harvest Type').props('items')).toEqual(harvestTypes);
    });

    it('offers no categories or harvest types when given none', async () => {
        const wrapper = mountWithPlugins(AddPlantDialog, { props: { show: true }, attachTo: document.body });
        await flushPromises();

        expect(select(wrapper, 'Category').props('items')).toEqual([]);
        expect(select(wrapper, 'Default Harvest Type').props('items')).toEqual([]);
    });

    it('starts on the unspecified harvest type', async () => {
        const wrapper = await mountDialog();

        expect(select(wrapper, 'Default Harvest Type').props('modelValue')).toBe(1);
    });

    it("disables the subcategory until a category is chosen, then offers that category's", async () => {
        const wrapper = await mountDialog();
        expect(select(wrapper, 'Subcategory').props('disabled')).toBe(true);
        expect(select(wrapper, 'Subcategory').props('items')).toEqual([]);

        await select(wrapper, 'Category').setValue(categories[0]);

        expect(select(wrapper, 'Subcategory').props('disabled')).toBe(false);
        expect(select(wrapper, 'Subcategory').props('items')).toEqual(categories[0].subcategories);
    });

    it('clears the subcategory when the category changes', async () => {
        const wrapper = await mountDialog();
        await select(wrapper, 'Category').setValue(categories[0]);
        await select(wrapper, 'Subcategory').setValue('subcategory-1');

        await select(wrapper, 'Category').setValue(categories[1]);

        expect(select(wrapper, 'Subcategory').props('modelValue')).toBeNull();
    });

    // With no reason from the service, it says the save failed. Cancel forgets
    // the message, so the next open starts clean
    it('says the save failed, keeping the form, and forgets it on Cancel', async () => {
        const wrapper = await mountDialog({ onSubmit: vi.fn().mockRejectedValue(httpError(500)) });
        await fillIn(wrapper);

        await buttonLabelled(dialogTitled('Add Plant'), 'Create').trigger('click');
        await flushPromises();

        expect(findDialog('Add Plant').text()).toContain("Couldn't save. Try again.");
        expect(inputLabelled(dialogTitled('Add Plant'), 'Name').element.value).toBe('Provider bush bean');

        await buttonLabelled(dialogTitled('Add Plant'), 'Cancel').trigger('click');
        await flushPromises();

        expect(findDialog('Add Plant').text()).not.toContain("Couldn't save");
    });

    it('submits the plant, with its default harvest type under harvesting', async () => {
        const wrapper = await mountDialog();
        await fillIn(wrapper);

        await buttonLabelled(dialogTitled('Add Plant'), 'Create').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
            subcategoryId: 'subcategory-1',
            friendlyName: 'Provider bush bean',
            lifespanType: 'Annual',
            description: 'A reliable bush bean.',
            harvesting: { defaultHarvestTypeId: 2 },
        });
    });

    it('sends the unspecified harvest type when the choice is cleared', async () => {
        const wrapper = await mountDialog();
        await fillIn(wrapper);
        await select(wrapper, 'Default Harvest Type').setValue(null);

        await buttonLabelled(dialogTitled('Add Plant'), 'Create').trigger('click');

        expect(wrapper.props('onSubmit').mock.calls[0][0].harvesting).toEqual({ defaultHarvestTypeId: 1 });
    });

    it('empties the form once the submit is done', async () => {
        const wrapper = await mountDialog();
        await fillIn(wrapper);

        await buttonLabelled(dialogTitled('Add Plant'), 'Create').trigger('click');
        await flushPromises();

        expect(inputLabelled(dialogTitled('Add Plant'), 'Name').element.value).toBe('');
        expect(select(wrapper, 'Category').props('modelValue')).toBeNull();
        expect(select(wrapper, 'Default Harvest Type').props('modelValue')).toBe(1);
    });

    it('empties the form, and calls onCancel, on Cancel', async () => {
        const wrapper = await mountDialog();
        await fillIn(wrapper);

        await buttonLabelled(dialogTitled('Add Plant'), 'Cancel').trigger('click');
        await flushPromises();

        expect(wrapper.props('onCancel')).toHaveBeenCalledTimes(1);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(inputLabelled(dialogTitled('Add Plant'), 'Name').element.value).toBe('');
    });

    // What the service requires: a name, of more than spaces, and a
    // subcategory (backlog A16)
    it('offers Create only once a name and subcategory are given', async () => {
        const wrapper = await mountDialog();
        const create = () => buttonLabelled(dialogTitled('Add Plant'), 'Create');
        expect(create().attributes('disabled')).toBeDefined();

        await inputLabelled(dialogTitled('Add Plant'), 'Name').setValue('   ');
        await select(wrapper, 'Category').setValue(categories[0]);
        await select(wrapper, 'Subcategory').setValue('subcategory-1');
        expect(create().attributes('disabled')).toBeDefined();

        await inputLabelled(dialogTitled('Add Plant'), 'Name').setValue('Provider bush bean');
        expect(create().attributes('disabled')).toBeUndefined();
    });
});
