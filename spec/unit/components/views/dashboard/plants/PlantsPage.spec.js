import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PlantsPage from '@/components/views/dashboard/plants/PlantsPage.vue';
import PlantsTable from '@/components/plants/PlantsTable.vue';
import AddPlantDialog from '@/components/plants/AddPlantDialog.vue';
import { usePlantsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../../../helpers/dialogs';

const plants = [
    { plantId: 'plant-1', friendlyName: 'Provider bush bean', category: 'Legumes', subcategory: 'Beans' },
    { plantId: 'plant-2', friendlyName: 'Cherokee Purple', category: 'Nightshades', subcategory: 'Tomatoes' },
];
const categories = [{ categoryId: 'category-1', categoryName: 'Legumes', subcategories: [] }];
const harvestTypes = [{ harvestTypeId: 1, harvestTypeName: 'unspecified' }];

async function mountPage(state = {}) {
    const pinia = createTestingPinia({ initialState: { plants: { plants, categories, harvestTypes, ...state } } });
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(PlantsPage, {
        global: { plugins: [pinia], mocks: { $router } },
        attachTo: document.body,
    });
    await flushPromises();
    return { wrapper, store: usePlantsStore(pinia), $router };
}

async function openAddDialog(wrapper) {
    await buttonLabelled(wrapper, 'Add').trigger('click');
    await flushPromises();
    return dialogTitled('Add Plant');
}

describe('PlantsPage', () => {
    it('loads the plants, the categories and the harvest types', async () => {
        const { wrapper, store } = await mountPage();

        expect(wrapper.find('.page-title').text()).toBe('Manage Plants');
        expect(store.fetchPlants).toHaveBeenCalledTimes(1);
        expect(store.fetchPlantCategories).toHaveBeenCalledTimes(1);
        expect(store.fetchHarvestTypes).toHaveBeenCalledTimes(1);
    });

    it('lists the plants, filtered by the search', async () => {
        const { wrapper } = await mountPage();
        const table = wrapper.findComponent(PlantsTable);
        expect(table.props('plants')).toHaveLength(2);
        expect(table.props('filter')).toBeNull();

        await inputLabelled(wrapper, 'Search...').setValue('bean');

        expect(table.props('filter')).toBe('bean');
        expect(wrapper.text()).toContain('1 of 2 plants');
    });

    it.each([
        ['.mdi-magnify', 'PlantDetailsPage'],
        ['.mdi-pencil', 'PlantEditPage'],
    ])("goes from a row's %s to its %s", async (icon, name) => {
        const { wrapper, $router } = await mountPage();

        await wrapper.findAll('tbody tr')[0].find(icon).trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name, params: { plantId: 'plant-2' } });
    });

    it('opens the add dialog, with the categories and harvest types', async () => {
        const { wrapper } = await mountPage();
        expect(findDialog('Add Plant')).toBeUndefined();

        await openAddDialog(wrapper);

        const dialog = wrapper.findComponent(AddPlantDialog);
        expect(dialog.props('show')).toBe(true);
        expect(dialog.props('categories')).toEqual(categories);
        expect(dialog.props('harvestTypes')).toEqual(harvestTypes);
    });

    it('closes the dialog on Cancel', async () => {
        const { wrapper } = await mountPage();
        const dialog = await openAddDialog(wrapper);

        await buttonLabelled(dialog, 'Cancel').trigger('click');
        await flushPromises();

        expect(findDialog('Add Plant')).toBeUndefined();
    });

    it('saves the plant, closes the dialog, and reloads', async () => {
        const { wrapper, store } = await mountPage();
        store.upsertPlant.mockResolvedValue(true);
        const dialog = await openAddDialog(wrapper);
        await inputLabelled(dialog, 'Name').setValue('Sugar snap pea');

        await buttonLabelled(dialog, 'Create').trigger('click');
        await flushPromises();

        expect(store.upsertPlant).toHaveBeenCalledWith(expect.objectContaining({ friendlyName: 'Sugar snap pea' }));
        expect(findDialog('Add Plant')).toBeUndefined();
        expect(store.fetchPlants).toHaveBeenCalledTimes(2);
    });

    // DocumentsCurrentBehavior: upsertPlant resolves false when the save fails,
    // but savePlant ignores it, so the dialog closes and the form is emptied:
    // what was typed is lost. Should keep the dialog open, with the form as it
    // was, so the alert's reason can be fixed
    it('closes the dialog, and empties the form, when the save fails', async () => {
        const { wrapper, store } = await mountPage();
        store.upsertPlant.mockResolvedValue(false);
        let dialog = await openAddDialog(wrapper);
        await inputLabelled(dialog, 'Name').setValue('Sugar snap pea');

        await buttonLabelled(dialog, 'Create').trigger('click');
        await flushPromises();

        expect(findDialog('Add Plant')).toBeUndefined();
        dialog = await openAddDialog(wrapper);
        expect(inputLabelled(dialog, 'Name').element.value).toBe('');
    });

    it("shows the plants store's alert", async () => {
        const { wrapper } = await mountPage({ alertVisible: true, alertType: 'error', alertMessage: 'error upserting plant' });

        expect(wrapper.find('.v-alert').text()).toBe('error upserting plant');
    });
});
