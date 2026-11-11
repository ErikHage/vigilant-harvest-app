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
const plantings = [
    { plantingId: 'planting-1', name: 'Asparagus bed', plantId: 'plant-2', currentStatus: 'PLANTED' },
    { plantingId: 'planting-2', name: 'Early beans', plantId: 'plant-1', currentStatus: 'STARTED' },
    { plantingId: 'planting-3', name: 'Late beans', plantId: 'plant-1', currentStatus: 'CREATED' },
    { plantingId: 'planting-4', name: 'Old beans', plantId: 'plant-1', currentStatus: 'RETIRED' },
    { plantingId: 'planting-5', name: 'Mystery', plantId: 'plant-9', currentStatus: 'PLANTED' },
];

// The page proposes the year after the calendar year, read when it's created
async function mountPage({ today = '2026-11-07T12:00:00', plantingYearsState = {} } = {}) {
    vi.useFakeTimers({ now: new Date(today), toFake: ['Date'] });
    const pinia = createTestingPinia({
        initialState: {
            plantingYears: plantingYearsState,
            plantings: { plantings },
            plants: { plantsById },
        },
    });
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

    it("loads the years, then this calendar year's plantings, then the plants", async () => {
        const { plantingYearsStore, plantingsStore, plantsStore } = await mountPage();

        expect(plantingYearsStore.fetchPlantingYears).toHaveBeenCalledTimes(1);
        expect(plantingsStore.fetchPlantingsByYear).toHaveBeenCalledWith(2026);
        expect(plantsStore.fetchPlants).toHaveBeenCalledTimes(1);
    });

    it('proposes the year after this calendar year, carrying forward from this one, and allows no change', async () => {
        const { wrapper } = await mountPage();

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2026');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2027');
        expect(inputLabelled(wrapper, 'Previous Planting Year').attributes('disabled')).toBeDefined();
        expect(inputLabelled(wrapper, 'New Planting Year').attributes('disabled')).toBeDefined();
    });

    // The years come from the calendar, not from the years that exist. In
    // January 2027, with 2027 never added, it proposes 2028
    it('goes by the calendar, whatever years exist', async () => {
        const { wrapper } = await mountPage({
            today: '2027-01-15T12:00:00',
            plantingYearsState: { plantingYears: [{ plantingYear: 2026 }] },
        });

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2027');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2028');
    });

    // The heading says "not retired", but only PLANTED plantings are listed:
    // started and created ones are left out. The service carries forward only
    // planted ones, so the list is right and the heading isn't
    it('lists only the planted plantings under "not retired", with their plant and lifespan', async () => {
        const { wrapper } = await mountPage();

        expect(wrapper.text()).toContain('Plantings to carry forward (not retired)');
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

        await buttonLabelled(wrapper, 'Create New Planting Year').trigger('click');
        await flushPromises();

        expect($router.push).not.toHaveBeenCalled();
        expect(wrapper.find('.v-alert').text()).toBe('error adding planting year');
    });

    // DocumentsCurrentBehavior: Create is never disabled, so it sends a year
    // with no dates, which the service rejects (lastFrostDate is required), and
    // the alert says only "error adding planting year". Should stay disabled
    // until both dates are picked (validation-fixes doc, "worth doing")
    it('sends a year with no dates', async () => {
        const { wrapper, plantingYearsStore } = await mountPage();

        expect(buttonLabelled(wrapper, 'Create New Planting Year').attributes('disabled')).toBeUndefined();
        await buttonLabelled(wrapper, 'Create New Planting Year').trigger('click');

        expect(plantingYearsStore.addPlantingYear).toHaveBeenCalledWith(expect.objectContaining({
            lastFrostDate: null,
            targetPlantingDate: null,
        }));
    });
});
