import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import PlantingYearDetailsPage from '@/components/views/dashboard/years/PlantingYearDetailsPage.vue';
import { usePlantingsStore, usePlantingYearsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';

const year2026 = {
    plantingYear: 2026,
    lastFrostDate: '2026-05-01',
    targetPlantingDate: '2026-05-17',
    details: { createdPlantings: 9, startedPlantings: 9, plantedPlantings: 9, retiredPlantings: 9 },
};
const plantings = [
    { plantingId: 'planting-1', currentStatus: 'PLANTED' },
    { plantingId: 'planting-2', currentStatus: 'PLANTED' },
    { plantingId: 'planting-3', currentStatus: 'STARTED' },
    { plantingId: 'planting-4', currentStatus: 'RETIRED' },
];

// `plantingYear` is what the store holds when the page opens on
// /planting-years/<year>, and `yearPlantings` what the plantings store's
// plantingsOfYear answers. The store's own list is another year's
async function mountPage({ year = '2026', plantingYear = year2026, yearPlantings = plantings, extraState = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            plantingYears: { plantingYear, ...extraState },
            plantings: { plantings: [{ plantingId: 'other-year', currentStatus: 'CREATED' }] },
        },
    });
    const plantingsStore = usePlantingsStore(pinia);
    plantingsStore.plantingsOfYear.mockResolvedValue(yearPlantings);
    const wrapper = mountWithPlugins(PlantingYearDetailsPage, {
        global: { plugins: [pinia], mocks: { $route: { params: { year } } } },
    });
    await flushPromises();
    return { wrapper, plantingYearsStore: usePlantingYearsStore(pinia), plantingsStore };
}

// Each status row's label and count
function statusRows(wrapper) {
    return wrapper.findAll('.v-list-item').map(item => [
        item.find('.v-list-item-title').text(),
        item.find('.text-h5').text(),
    ]);
}

describe('PlantingYearDetailsPage', () => {
    // Its plantings for itself, not into the store, whose list is the chosen
    // year's, which the other pages show (backlog B20)
    it("loads the year from the route, and that year's plantings, for itself", async () => {
        const { plantingYearsStore, plantingsStore } = await mountPage();

        expect(plantingYearsStore.fetchPlantingYear).toHaveBeenCalledWith('2026');
        expect(plantingsStore.plantingsOfYear).toHaveBeenCalledWith('2026');
        expect(plantingsStore.fetchPlantingsByYear).not.toHaveBeenCalled();
    });

    it('shows nothing until a year is loaded', async () => {
        const { wrapper } = await mountPage({ plantingYear: null });

        expect(wrapper.text()).toBe('');
    });

    it('shows the year and its dates, as UTC days', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.find('.text-h4').text()).toBe('Planting Year 2026');
        expect(wrapper.findAll('.v-card-subtitle').map(subtitle => subtitle.text()))
            .toEqual(['Last Frost Date', 'Target Planting Date']);
        expect(wrapper.findAll('.v-card-text > .text-h5').map(date => date.text())).toEqual(['May 1', 'May 17']);
    });

    // Not the store's list, nor the year's details, which the service fills
    // only in its list of years (backlog B20)
    it('counts the plantings by status, from the plantings it loaded', async () => {
        const { wrapper } = await mountPage();

        expect(statusRows(wrapper)).toEqual([
            ['Created Plantings', '0'],
            ['Started Plantings', '1'],
            ['Planted Plantings', '2'],
            ['Retired Plantings', '1'],
        ]);
    });

    it('counts 0 for each status with no plantings', async () => {
        const { wrapper } = await mountPage({ yearPlantings: [] });

        expect(statusRows(wrapper).map(([, count]) => count)).toEqual(['0', '0', '0', '0']);
    });

    // The store still holds the last year viewed until the fetch returns, and
    // for good if it fails (backlog A15)
    it("shows no other year under a year's address", async () => {
        const { wrapper } = await mountPage({ year: '2030', plantingYear: year2026 });

        expect(wrapper.find('.text-h4').exists()).toBe(false);
        expect(wrapper.text()).not.toContain('2026');
    });

    it("shows the planting-years store's alert", async () => {
        const { wrapper } = await mountPage({
            extraState: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching planting year' },
        });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching planting year');
    });

    it("shows the plantings store's alert, for the year's plantings", async () => {
        const { wrapper, plantingsStore } = await mountPage();

        plantingsStore.$patch({ alertVisible: true, alertType: 'error', alertMessage: 'error fetching plantings by year' });
        await nextTick();

        expect(wrapper.find('.v-alert').text()).toBe('error fetching plantings by year');
    });
});
