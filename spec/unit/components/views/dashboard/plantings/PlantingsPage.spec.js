import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VAutocomplete, VSelect } from 'vuetify/components';
import PlantingsPage from '@/components/views/dashboard/plantings/PlantingsPage.vue';
import PlantingsTable from '@/components/plantings/PlantingsTable.vue';
import AddPlantingDialog from '@/components/plantings/AddPlantingDialog.vue';
import { useCommonStore, usePlantingsStore, usePlantsStore, usePlotsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../../../helpers/dialogs';

const plants = [{ plantId: 'plant-1', friendlyName: 'Provider bush bean' }];
const plantsById = { 'plant-1': plants[0] };
const plots = [{ plotId: 'plot-1', friendlyName: 'North bed' }];
const plotsById = { 'plot-1': plots[0] };
const plantings = [
    { plantingId: 'planting-1', name: 'Early beans', plantId: 'plant-1', plotId: 'plot-1', currentStatus: 'PLANTED', numberTransplanted: 10 },
    { plantingId: 'planting-2', name: 'Late beans', plantId: 'plant-1', currentStatus: 'CREATED' },
];

async function mountPage({ alerts = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            common: { plantingYear: 2026 },
            plants: { plants, plantsById, ...alerts.plants },
            plots: { plots, plotsById, ...alerts.plots },
            plantings: { plantings, ...alerts.plantings },
        },
    });
    // The order the page loads things in
    const calls = [];
    const plantsStore = usePlantsStore(pinia);
    const plotsStore = usePlotsStore(pinia);
    const plantingsStore = usePlantingsStore(pinia);
    plantsStore.fetchPlants.mockImplementation(async () => calls.push('plants'));
    plotsStore.fetchPlots.mockImplementation(async () => calls.push('plots'));
    plantingsStore.fetchPlantingsByYear.mockImplementation(async year => calls.push(`plantings ${year}`));
    const $router = { push: vi.fn() };

    const wrapper = mountWithPlugins(PlantingsPage, {
        global: { plugins: [pinia], mocks: { $router } },
        attachTo: document.body,
    });
    await flushPromises();
    return { wrapper, calls, $router, plantingsStore, commonStore: useCommonStore(pinia) };
}

const alertOf = (alertType, alertMessage) => ({ alertVisible: true, alertType, alertMessage });

describe('PlantingsPage', () => {
    it("loads the plants, then the plots, then the year's plantings", async () => {
        const { wrapper, calls } = await mountPage();

        expect(wrapper.find('.page-title').text()).toBe('Manage Plantings');
        expect(calls).toEqual(['plants', 'plots', 'plantings 2026']);
    });

    it('reloads it all on Refresh', async () => {
        const { wrapper, calls } = await mountPage();

        await buttonLabelled(wrapper, 'Refresh').trigger('click');
        await flushPromises();

        expect(calls).toEqual(['plants', 'plots', 'plantings 2026', 'plants', 'plots', 'plantings 2026']);
    });

    it('gives the table the plantings, plants and plots', async () => {
        const { wrapper } = await mountPage();

        const table = wrapper.findComponent(PlantingsTable);
        expect(table.props('plantings')).toEqual(plantings);
        expect(table.props('plantsMap')).toEqual(plantsById);
        expect(table.props('plotsMap')).toEqual(plotsById);
    });

    it('filters by the search and the status', async () => {
        const { wrapper } = await mountPage();
        const statusSelect = wrapper.findAllComponents(VSelect).find(s => s.props('label') === 'Status Filter');
        expect(statusSelect.props('items')).toEqual(['CREATED', 'STARTED', 'PLANTED', 'RETIRED']);

        await inputLabelled(wrapper, 'Search...').setValue('beans');
        await statusSelect.setValue('CREATED');

        expect(wrapper.findComponent(PlantingsTable).props('filter')).toBe('beans');
        expect(wrapper.findComponent(PlantingsTable).props('statusFilter')).toBe('CREATED');
        expect(wrapper.text()).toContain('1 of 2 plantings');
    });

    it('goes to a planting from its row', async () => {
        const { wrapper, $router } = await mountPage();

        await wrapper.findAll('tbody tr')[0].find('.mdi-magnify').trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'PlantingDetailsPage', params: { plantingId: 'planting-1' } });
    });

    it('opens the add dialog, with the plants', async () => {
        const { wrapper } = await mountPage();

        await buttonLabelled(wrapper, 'Add').trigger('click');
        await flushPromises();

        expect(findDialog('Add Planting')).toBeDefined();
        expect(wrapper.findComponent(AddPlantingDialog).props('plants')).toEqual(plants);
    });

    // AddPlantingDialog declares neither, so they fall through to its root as
    // attributes
    it('passes the dialog a planting and the plots it has no props for', async () => {
        const { wrapper } = await mountPage();

        const dialog = wrapper.findComponent(AddPlantingDialog);
        expect(dialog.props()).not.toHaveProperty('planting');
        expect(dialog.props()).not.toHaveProperty('plots');
        expect(dialog.vm.$attrs).toMatchObject({ planting: null, plots });
    });

    it("creates the planting in the selected year, closes the dialog, and reloads", async () => {
        const { wrapper, plantingsStore, calls } = await mountPage();
        await buttonLabelled(wrapper, 'Add').trigger('click');
        await flushPromises();
        await inputLabelled(dialogTitled('Add Planting'), 'Name').setValue('Fall beans');
        await wrapper.findComponent(AddPlantingDialog).findComponent(VAutocomplete).setValue('plant-1');

        await buttonLabelled(dialogTitled('Add Planting'), 'Create').trigger('click');
        await flushPromises();

        expect(plantingsStore.createPlanting).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Fall beans',
            plantingYear: 2026,
        }));
        expect(document.querySelector('.v-overlay--active')).toBeNull();
        expect(calls.slice(3)).toEqual(['plants', 'plots', 'plantings 2026']);
    });

    it('closes the dialog on Cancel', async () => {
        const { wrapper } = await mountPage();
        await buttonLabelled(wrapper, 'Add').trigger('click');
        await flushPromises();

        await buttonLabelled(dialogTitled('Add Planting'), 'Cancel').trigger('click');
        await flushPromises();

        expect(document.querySelector('.v-overlay--active')).toBeNull();
    });

    it("shows the plantings, plants and plots stores' alerts", async () => {
        const { wrapper } = await mountPage({
            alerts: {
                plantings: alertOf('error', 'error creating planting'),
                plants: alertOf('error', 'error fetching plants'),
                plots: alertOf('error', 'error fetching plots'),
            },
        });

        expect(wrapper.findAll('.v-alert').map(alert => alert.text()))
            .toEqual(['error creating planting', 'error fetching plants', 'error fetching plots']);
    });
});
