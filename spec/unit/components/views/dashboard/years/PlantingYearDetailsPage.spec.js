import { createTestingPinia } from '@pinia/testing';
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

// `plantingYear` is what the store holds when the page opens on /planting-years/<year>
function mountPage({ year = '2026', plantingYear = year2026, extraState = {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            plantingYears: { plantingYear, ...extraState },
            plantings: { plantings },
        },
    });
    const wrapper = mountWithPlugins(PlantingYearDetailsPage, {
        global: { plugins: [pinia], mocks: { $route: { params: { year } } } },
    });
    return { wrapper, plantingYearsStore: usePlantingYearsStore(pinia), plantingsStore: usePlantingsStore(pinia) };
}

// Each status row's label and count
function statusRows(wrapper) {
    return wrapper.findAll('.v-list-item').map(item => [
        item.find('.v-list-item-title').text(),
        item.find('.text-h5').text(),
    ]);
}

describe('PlantingYearDetailsPage', () => {
    it("loads the year from the route, and that year's plantings", () => {
        const { plantingYearsStore, plantingsStore } = mountPage();

        expect(plantingYearsStore.fetchPlantingYear).toHaveBeenCalledWith('2026');
        expect(plantingsStore.fetchPlantingsByYear).toHaveBeenCalledWith('2026');
    });

    it('shows nothing until a year is loaded', () => {
        const { wrapper } = mountPage({ plantingYear: null });

        expect(wrapper.text()).toBe('');
    });

    it('shows the year and its dates, as UTC days', () => {
        const { wrapper } = mountPage();

        expect(wrapper.find('.text-h4').text()).toBe('Planting Year 2026');
        expect(wrapper.findAll('.v-card-subtitle').map(subtitle => subtitle.text()))
            .toEqual(['Last Frost Date', 'Target Planting Date']);
        expect(wrapper.findAll('.v-card-text > .text-h5').map(date => date.text())).toEqual(['May 1', 'May 17']);
    });

    // The service sends each year with its own counts (details), but the page
    // counts the plantings store's list instead
    it('counts the plantings by status, from the plantings it loaded', () => {
        const { wrapper } = mountPage();

        expect(statusRows(wrapper)).toEqual([
            ['Created Plantings', '0'],
            ['Started Plantings', '1'],
            ['Planted Plantings', '2'],
            ['Retired Plantings', '1'],
        ]);
    });

    it('counts 0 for each status with no plantings', () => {
        const pinia = createTestingPinia({ initialState: { plantingYears: { plantingYear: year2026 }, plantings: { plantings: [] } } });
        const wrapper = mountWithPlugins(PlantingYearDetailsPage, {
            global: { plugins: [pinia], mocks: { $route: { params: { year: '2026' } } } },
        });

        expect(statusRows(wrapper).map(([, count]) => count)).toEqual(['0', '0', '0', '0']);
    });

    // DocumentsCurrentBehavior: the page shows whatever year the store holds,
    // without checking it's the one in the route. So until the fetch returns,
    // and for good if it fails, /planting-years/2030 shows the last year
    // viewed. Should show nothing, or a not-found message, until the route's
    // year is loaded
    it("shows the last year viewed under another year's address", () => {
        const { wrapper } = mountPage({ year: '2030', plantingYear: year2026 });

        expect(wrapper.find('.text-h4').text()).toBe('Planting Year 2026');
    });

    // DocumentsCurrentBehavior: the page has no alert, so a failed load of
    // the year is silent. Should show the planting-years store's alert
    it("doesn't show the planting-years store's alert", () => {
        const { wrapper } = mountPage({
            extraState: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching planting year' },
        });

        expect(wrapper.find('.v-alert').exists()).toBe(false);
        expect(wrapper.text()).not.toContain('error fetching planting year');
    });
});
