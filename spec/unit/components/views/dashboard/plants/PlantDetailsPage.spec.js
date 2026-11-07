import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PlantDetailsPage from '@/components/views/dashboard/plants/PlantDetailsPage.vue';
import PlantDetailsTab from '@/components/plants/PlantDetailsTab.vue';
import PlantTaxonomyTab from '@/components/plants/PlantTaxonomyTab.vue';
import PlantSowingTab from '@/components/plants/PlantSowingTab.vue';
import PlantPlantingTab from '@/components/plants/PlantPlantingTab.vue';
import PlantGrowingTab from '@/components/plants/PlantGrowingTab.vue';
import PlantHarvestingTab from '@/components/plants/PlantHarvestingTab.vue';
import PlantSchedulesTab from '@/components/plants/PlantSchedulesTab.vue';
import { usePlantsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { aPlant } from '../../../../../helpers/plants';

const plant = aPlant();

async function mountPage({ plantsById = { 'plant-1': plant }, state = {} } = {}) {
    const pinia = createTestingPinia({ initialState: { plants: { plantsById, ...state } } });
    const wrapper = mountWithPlugins(PlantDetailsPage, {
        global: { plugins: [pinia], mocks: { $route: { params: { plantId: 'plant-1' } } } },
    });
    await flushPromises();
    return { wrapper, store: usePlantsStore(pinia) };
}

const tabs = [
    ['Details', PlantDetailsTab],
    ['Taxonomy', PlantTaxonomyTab],
    ['Sowing', PlantSowingTab],
    ['Planting', PlantPlantingTab],
    ['Growing', PlantGrowingTab],
    ['Harvesting', PlantHarvestingTab],
    ['Schedules', PlantSchedulesTab],
];

describe('PlantDetailsPage', () => {
    it('loads the plant from the route', async () => {
        const { store } = await mountPage();

        expect(store.fetchPlantById).toHaveBeenCalledWith('plant-1');
    });

    it('shows nothing until the plant is in the store', async () => {
        const { wrapper } = await mountPage({ plantsById: {} });

        expect(wrapper.text()).toBe('');
    });

    it('shows the plant, with its category and subcategory', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.find('.page-title').text()).toBe('Provider bush bean');
        expect(wrapper.text()).toContain('Legumes / Beans');
    });

    it('has the seven tabs, and opens on Details', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.findAll('.v-tab').map(tab => tab.text())).toEqual(tabs.map(([label]) => label));
        expect(wrapper.findComponent(PlantDetailsTab).exists()).toBe(true);
        expect(wrapper.findComponent(PlantTaxonomyTab).exists()).toBe(false);
    });

    it.each(tabs.slice(1))('shows the %s tab when it is clicked, with the plant', async (label, component) => {
        const { wrapper } = await mountPage();

        await wrapper.findAll('.v-tab').find(tab => tab.text() === label).trigger('click');
        await flushPromises();

        expect(wrapper.findComponent(component).props('plant')).toEqual(plant);
    });

    it('shows a spinner while loading', async () => {
        const { wrapper } = await mountPage({ state: { loading: true } });

        expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
    });

    it("shows the plants store's alert", async () => {
        const { wrapper } = await mountPage({ state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching plant' } });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching plant');
    });

    // DocumentsCurrentBehavior: the alert and the spinner are inside the
    // v-if="plant", so with no plant loaded they don't show: opening a plant
    // that fails to load shows a blank page. Should show the alert, and the
    // spinner, without a plant
    it('shows neither the alert nor the spinner without a plant', async () => {
        const { wrapper } = await mountPage({
            plantsById: {},
            state: { loading: true, alertVisible: true, alertType: 'error', alertMessage: 'error fetching plant' },
        });

        expect(wrapper.find('.v-alert').exists()).toBe(false);
        expect(wrapper.find('.v-progress-circular').exists()).toBe(false);
    });
});
