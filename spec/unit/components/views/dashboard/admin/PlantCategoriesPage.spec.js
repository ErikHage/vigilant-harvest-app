import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PlantCategoriesPage from '@/components/views/dashboard/admin/PlantCategoriesPage.vue';
import { usePlantsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { apiError, serviceErrorBody } from '../../../../../helpers/http-errors';
import { inputLabelled } from '../../../../../helpers/fields';
import { dialogTitled } from '../../../../../helpers/dialogs';
import { isOpen, openAction, press } from '../../../../../helpers/action-dialogs';

// As GET /plants/categories sends them, in no set order. One is lower-case
const categories = [
    {
        categoryId: 'category-2',
        categoryName: 'Nightshades',
        subcategories: [{ subcategoryId: 'sub-3', subcategoryName: 'Tomatoes' }, { subcategoryId: 'sub-4', subcategoryName: 'Peppers' }],
    },
    {
        categoryId: 'category-1',
        categoryName: 'Legumes',
        subcategories: [{ subcategoryId: 'sub-1', subcategoryName: 'Beans' }, { subcategoryId: 'sub-2', subcategoryName: 'Peas' }],
    },
    { categoryId: 'category-3', categoryName: 'alliums', subcategories: [] },
];

async function mountPage({ state = {} } = {}) {
    const pinia = createTestingPinia({ initialState: { plants: { categories, ...state } } });
    const store = usePlantsStore(pinia);
    const wrapper = mountWithPlugins(PlantCategoriesPage, { global: { plugins: [pinia] }, attachTo: document.body });
    await flushPromises();
    return { wrapper, store };
}

// Each row: the category, and its subcategories
const rows = wrapper => wrapper.findAll('tbody tr').filter(row => row.findAll('td').length === 3).map(row => [
    row.find('td').text(),
    row.findAll('.v-chip').map(chip => chip.text()),
]);
const count = wrapper => wrapper.find('.text-body-2').text();

async function filterBy(wrapper, text) {
    await inputLabelled(wrapper, 'Filter categories').setValue(text);
    await flushPromises();
}

async function toggleSort(wrapper) {
    await wrapper.find('thead .v-icon').trigger('click');
    await flushPromises();
}

async function addSubcategoryTo(wrapper, categoryName, subcategoryName) {
    const row = wrapper.findAll('tbody tr').find(r => r.find('td').text() === categoryName);
    await row.find('.v-btn').trigger('click');
    await flushPromises();
    const dialog = dialogTitled('Add Subcategory');
    await inputLabelled(dialog, 'Subcategory Name').setValue(subcategoryName);
    await press(dialog, 'Add');
}

describe('PlantCategoriesPage', () => {
    it('loads the categories', async () => {
        const { store } = await mountPage();

        expect(store.fetchPlantCategories).toHaveBeenCalledTimes(1);
    });

    // Ignoring case, as utils/sorting does (backlog B32)
    it('lists the categories by name, with their subcategories', async () => {
        const { wrapper } = await mountPage();

        expect(rows(wrapper)).toEqual([
            ['alliums', []],
            ['Legumes', ['Beans', 'Peas']],
            ['Nightshades', ['Tomatoes', 'Peppers']],
        ]);
        expect(count(wrapper)).toBe('3 of 3 categories');
    });

    it('sorts the other way, and back, from the header', async () => {
        const { wrapper } = await mountPage();
        expect(wrapper.find('thead .v-icon').classes()).toContain('mdi-sort-ascending');

        await toggleSort(wrapper);
        expect(rows(wrapper).map(([name]) => name)).toEqual(['Nightshades', 'Legumes', 'alliums']);
        expect(wrapper.find('thead .v-icon').classes()).toContain('mdi-sort-descending');

        await toggleSort(wrapper);
        expect(rows(wrapper).map(([name]) => name)).toEqual(['alliums', 'Legumes', 'Nightshades']);
    });

    it('filters by category or subcategory, in any case, and counts what it shows', async () => {
        const { wrapper } = await mountPage();

        await filterBy(wrapper, 'pea');

        expect(rows(wrapper).map(([name]) => name)).toEqual(['Legumes']);
        expect(count(wrapper)).toBe('1 of 3 categories');
    });

    // Each name on its own: "Legumes" and "Beans" don't make "mesbea"
    // (backlog B32)
    it("doesn't match across the category and a subcategory", async () => {
        const { wrapper } = await mountPage();

        await filterBy(wrapper, 'mesbea');

        expect(rows(wrapper)).toEqual([]);
    });

    it('says when nothing matches', async () => {
        const { wrapper } = await mountPage();

        await filterBy(wrapper, 'zzz');

        expect(rows(wrapper)).toEqual([]);
        expect(wrapper.text()).toContain('No categories found');
        expect(count(wrapper)).toBe('0 of 3 categories');
    });

    it("shows the plants store's alert", async () => {
        const { wrapper } = await mountPage({ state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching plant categories' } });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching plant categories');
    });

    it('adds a category, then reloads', async () => {
        const { wrapper, store } = await mountPage();
        const dialog = await openAction(wrapper, 'Add Category', 'Add Category');
        await inputLabelled(dialog, 'Category Name').setValue('Brassicas');

        await press(dialog, 'Create');

        expect(store.createCategory).toHaveBeenCalledWith({ categoryName: 'Brassicas' });
        expect(store.fetchPlantCategories).toHaveBeenCalledTimes(2);
        expect(isOpen()).toBe(false);
    });

    it("adds a subcategory to the row's category, then reloads", async () => {
        const { wrapper, store } = await mountPage();

        await addSubcategoryTo(wrapper, 'Nightshades', 'Eggplants');

        expect(store.createSubcategory).toHaveBeenCalledWith({ categoryId: 'category-2', subcategoryName: 'Eggplants' });
        expect(store.fetchPlantCategories).toHaveBeenCalledTimes(2);
    });

    // createCategory and createSubcategory alert, and reject, so the
    // page's handler rejects, and the dialog, which waits for it, stays open
    // and says why
    it.each([
        ['category', 'createCategory', 'categoryName is required'],
        ['subcategory', 'createSubcategory', 'subcategoryName is required'],
    ])('keeps the %s dialog open, and says why, when the save fails', async (kind, action, message) => {
        const { wrapper, store } = await mountPage();
        store[action].mockImplementation(async () => {
            store.alertVisible = true;
            store.alertType = 'error';
            store.alertMessage = message;
            throw apiError(400, serviceErrorBody(400, message));
        });

        if (kind === 'category') {
            const dialog = await openAction(wrapper, 'Add Category', 'Add Category');
            await inputLabelled(dialog, 'Category Name').setValue('Brassicas');
            await press(dialog, 'Create');
        } else {
            await addSubcategoryTo(wrapper, 'Legumes', 'Lentils');
        }

        expect(isOpen()).toBe(true);
        expect(document.querySelector('.v-overlay--active').textContent).toContain(message);
        expect(wrapper.find('.v-alert').text()).toBe(message);
        expect(store.fetchPlantCategories).toHaveBeenCalledTimes(1);
    });
});
