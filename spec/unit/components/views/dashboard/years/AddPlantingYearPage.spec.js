import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AddPlantingYearPage from '@/components/views/dashboard/years/AddPlantingYearPage.vue';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';
import { usePlantingsStore, usePlantingYearsStore, usePlantsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../../helpers/fields';
import { tableRows } from '../../../../../helpers/tables';

const plantsById = {
    'plant-1': { plantId: 'plant-1', friendlyName: 'Provider bush bean', lifespanType: 'ANNUAL' },
    'plant-2': { plantId: 'plant-2', friendlyName: 'Asparagus', lifespanType: 'PERENNIAL' },
};
const previousPlantings = [
    { plantingId: 'planting-1', name: 'Asparagus bed', plantId: 'plant-2', currentStatus: 'PLANTED' },
    { plantingId: 'planting-2', name: 'Early beans', plantId: 'plant-1', currentStatus: 'STARTED' },
    { plantingId: 'planting-3', name: 'Late beans', plantId: 'plant-1', currentStatus: 'CREATED' },
    { plantingId: 'planting-4', name: 'Old beans', plantId: 'plant-1', currentStatus: 'RETIRED' },
    { plantingId: 'planting-5', name: 'Mystery', plantId: 'plant-9', currentStatus: 'PLANTED' },
];

// The page proposes the year after the latest of `years`, as the calendar
// allows. The store's list of plantings is another year's, and stays so
const shownYearsPlantings = [
    { plantingId: 'planting-9', name: 'This year', plantId: 'plant-1', currentStatus: 'PLANTED' },
];

async function mountPage({ today = '2026-11-07T12:00:00', years = [2025, 2026], yearsLoad = true, plantingYearsState = {} } = {}) {
    vi.useFakeTimers({ now: new Date(today), toFake: ['Date'] });
    const pinia = createTestingPinia({
        initialState: {
            plantingYears: { plantingYears: years.map(plantingYear => ({ plantingYear })), ...plantingYearsState },
            plantings: { plantings: shownYearsPlantings },
            plants: { plantsById },
        },
    });
    usePlantingYearsStore(pinia).fetchPlantingYears.mockResolvedValue(yearsLoad);
    usePlantingsStore(pinia).plantingsOfYear.mockResolvedValue(previousPlantings);
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(AddPlantingYearPage, {
        global: { plugins: [pinia], mocks: { $router } },
    });
    await flushPromises();
    return {
        wrapper,
        $router,
        plantingYearsStore: usePlantingYearsStore(pinia),
        plantingsStore: usePlantingsStore(pinia),
        plantsStore: usePlantsStore(pinia),
    };
}

// Picks a date in one of the page's two date pickers, as the picker's Confirm does
async function pickDate(wrapper, title, date) {
    const picker = wrapper.findAllComponents(DatePickerDialogActivator)
        .find(component => component.props('title') === title);
    picker.props('onSubmit')(date);
    await flushPromises();
}

describe('AddPlantingYearPage', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    // Its own copy of the previous year's plantings, so the store's list, the
    // year chosen, is left alone
    it("loads the years, then the latest year's plantings, then the plants", async () => {
        const { plantingYearsStore, plantingsStore, plantsStore } = await mountPage();

        expect(plantingYearsStore.fetchPlantingYears).toHaveBeenCalledTimes(1);
        expect(plantingsStore.plantingsOfYear).toHaveBeenCalledWith(2026);
        expect(plantingsStore.fetchPlantingsByYear).not.toHaveBeenCalled();
        expect(plantingsStore.plantings).toEqual(shownYearsPlantings);
        expect(plantsStore.fetchPlants).toHaveBeenCalledTimes(1);
    });

    it('proposes the year after the latest, carrying forward from it, and allows no change', async () => {
        const { wrapper } = await mountPage();

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2026');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2027');
        expect(inputLabelled(wrapper, 'Previous Planting Year').attributes('disabled')).toBeDefined();
        expect(inputLabelled(wrapper, 'New Planting Year').attributes('disabled')).toBeDefined();
    });

    // It went by the calendar: in January 2027, with 2027 never added, it
    // proposed 2028, from 2027 (backlog B18)
    it("goes by the years that exist, not the calendar's", async () => {
        const { wrapper } = await mountPage({ today: '2027-01-15T12:00:00', years: [2025, 2026] });

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2026');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2027');
    });

    it('proposes two years ahead of the calendar once next year exists', async () => {
        const { wrapper } = await mountPage({ years: [2026, 2027] });

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2027');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2028');
    });

    it('passes over a year more than one past the calendar', async () => {
        const { wrapper, plantingsStore } = await mountPage({ years: [2026, 2099] });

        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2027');
        expect(plantingsStore.plantingsOfYear).toHaveBeenCalledWith(2026);
    });

    it('proposes this calendar year, carrying nothing forward, with no years', async () => {
        const { wrapper, plantingYearsStore, plantingsStore } = await mountPage({ years: [] });
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2026, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2026, 4, 17));

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2026');
        expect(plantingsStore.plantingsOfYear).not.toHaveBeenCalled();
        expect(tableRows(wrapper)).toEqual([]);

        await buttonLabelled(wrapper, 'Create New Planting Year').trigger('click');

        const [request] = plantingYearsStore.addPlantingYear.mock.calls[0];
        expect(request).toEqual({ plantingYear: 2026, lastFrostDate: '2026-05-10', targetPlantingDate: '2026-05-17' });
    });

    it("proposes nothing, and doesn't offer Create, when the years don't load", async () => {
        const { wrapper, plantingsStore } = await mountPage({ yearsLoad: false });
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));

        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('');
        expect(plantingsStore.plantingsOfYear).not.toHaveBeenCalled();
        expect(buttonLabelled(wrapper, 'Create New Planting Year').attributes('disabled')).toBeDefined();
    });

    // Only PLANTED plantings are listed, as the service carries forward. The
    // heading said "not retired" (backlog B17)
    it('lists only the planted plantings, with their plant and lifespan', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.text()).toContain('Plantings to carry forward (planted)');
        expect(tableRows(wrapper)).toEqual([
            ['Asparagus bed', 'Asparagus', 'PERENNIAL', 'PLANTED'],
            ['Mystery', '', '', 'PLANTED'],
        ]);
    });

    it('goes to a planting from its name', async () => {
        const { wrapper, $router } = await mountPage();

        await wrapper.find('tbody .clickable').trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'PlantingDetailsPage', params: { plantingId: 'planting-1' } });
    });

    it('shows each date once it is picked, and -- before', async () => {
        const { wrapper } = await mountPage();
        const shown = () => wrapper.findAll('h3.ml-2').map(heading => heading.text());
        expect(shown()).toEqual(['--', '--']);

        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));

        expect(shown()).toEqual(['2027-05-10', '2027-05-17']);
    });

    it('adds the year with the picked dates, then goes to the years page', async () => {
        const { wrapper, plantingYearsStore, $router } = await mountPage();
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));

        await buttonLabelled(wrapper, 'Create New Planting Year').trigger('click');
        await flushPromises();

        expect(plantingYearsStore.addPlantingYear).toHaveBeenCalledWith({
            previousPlantingYear: 2026,
            plantingYear: 2027,
            lastFrostDate: '2027-05-10',
            targetPlantingDate: '2027-05-17',
        });
        expect($router.push).toHaveBeenCalledWith({ name: 'PlantingYearsPage' });
    });

    // A picked date is sent as the day picked, YYYY-MM-DD, whatever the
    // timezone. As its UTC instant, it was the day before east of Greenwich
    // (backlog B19)
    it('sends a picked date as the day picked', async () => {
        const { wrapper, plantingYearsStore } = await mountPage();
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));

        await buttonLabelled(wrapper, 'Create New Planting Year').trigger('click');

        const [request] = plantingYearsStore.addPlantingYear.mock.calls[0];
        expect(request).toMatchObject({ lastFrostDate: '2027-05-10', targetPlantingDate: '2027-05-17' });
    });

    // It loads the plantings and plants it carries forward, so their failures show here too
    it.each([
        ['plantingsStore', 'error fetching plantings by year'],
        ['plantsStore', 'error fetching plants'],
    ])("shows the %s's alert", async (store, message) => {
        const mounted = await mountPage();

        mounted[store].$patch({ alertVisible: true, alertType: 'error', alertMessage: message });
        await flushPromises();

        expect(mounted.wrapper.find('.v-alert').text()).toBe(message);
    });

    it("stays put, showing the store's alert, when adding fails", async () => {
        const { wrapper, plantingYearsStore, $router } = await mountPage({
            plantingYearsState: { alertVisible: true, alertType: 'error', alertMessage: 'error adding planting year' },
        });
        plantingYearsStore.addPlantingYear.mockRejectedValue(new Error('Request failed with status code 400'));
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));

        await buttonLabelled(wrapper, 'Create New Planting Year').trigger('click');
        await flushPromises();

        expect(plantingYearsStore.addPlantingYear).toHaveBeenCalledTimes(1);
        expect($router.push).not.toHaveBeenCalled();
        expect(wrapper.find('.v-alert').text()).toBe('error adding planting year');
    });

    // The service requires both dates (backlog A14)
    it('offers Create only once both dates are picked', async () => {
        const { wrapper } = await mountPage();
        const create = () => buttonLabelled(wrapper, 'Create New Planting Year');
        expect(create().attributes('disabled')).toBeDefined();

        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        expect(create().attributes('disabled')).toBeDefined();

        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));
        expect(create().attributes('disabled')).toBeUndefined();
    });
});
