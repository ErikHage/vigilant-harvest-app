import { createTestingPinia } from '@pinia/testing';
import PlantingYearsPage from '@/components/views/dashboard/years/PlantingYearsPage.vue';
import PlantingYearsTable from '@/components/years/PlantingYearsTable.vue';
import { usePlantingYearsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled } from '../../../../../helpers/fields';

const plantingYears = [
    { plantingYear: 2025, lastFrostDate: '2025-05-12', targetPlantingDate: '2025-05-19' },
    { plantingYear: 2026, lastFrostDate: '2026-05-10', targetPlantingDate: '2026-05-17' },
];

function mountPage(state = {}) {
    const pinia = createTestingPinia({ initialState: { plantingYears: { plantingYears, ...state } } });
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(PlantingYearsPage, { global: { plugins: [pinia], mocks: { $router } } });
    return { wrapper, store: usePlantingYearsStore(pinia), $router };
}

describe('PlantingYearsPage', () => {
    it('loads the planting years, and lists them', () => {
        const { wrapper, store } = mountPage();

        expect(wrapper.find('.page-title').text()).toBe('Manage Planting Years');
        expect(store.fetchPlantingYears).toHaveBeenCalledTimes(1);
        expect(wrapper.findComponent(PlantingYearsTable).props('plantingYears')).toEqual(plantingYears);
    });

    it('goes to the add page on Add Year', async () => {
        const { wrapper, $router } = mountPage();

        await buttonLabelled(wrapper, 'Add Year').trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'AddPlantingYearPage' });
    });

    it("goes to a year's details from its row", async () => {
        const { wrapper, $router } = mountPage();

        await wrapper.findAll('tbody tr')[1].find('.mdi-magnify').trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'PlantingYearDetailsPage', params: { year: 2026 } });
    });

    it("shows the planting-years store's alert", () => {
        const { wrapper } = mountPage({ alertVisible: true, alertType: 'error', alertMessage: 'error fetching planting years' });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching planting years');
    });
});
