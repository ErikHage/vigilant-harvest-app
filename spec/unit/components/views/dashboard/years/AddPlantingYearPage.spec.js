import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AddPlantingYearPage from '@/components/views/dashboard/years/AddPlantingYearPage.vue';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';
import { usePlantingsStore, usePlantingYearsStore, usePlantsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled, fieldLabelled, inputLabelled, typeInto } from '../../../../../helpers/fields';
import { tableHeaders, tableRows } from '../../../../../helpers/tables';
import { dialogTitled, findDialog } from '../../../../../helpers/dialogs';

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

async function mountPage({
    today = '2026-11-07T12:00:00',
    years = [2025, 2026],
    yearsLoad = true,
    plantingYearsState = {},
    plantings = previousPlantings,
} = {}) {
    vi.useFakeTimers({ now: new Date(today), toFake: ['Date'] });
    const pinia = createTestingPinia({
        initialState: {
            plantingYears: { plantingYears: years.map(plantingYear => ({ plantingYear })), ...plantingYearsState },
            plantings: { plantings: shownYearsPlantings },
            plants: { plantsById },
        },
    });
    usePlantingYearsStore(pinia).fetchPlantingYears.mockResolvedValue(yearsLoad);
    usePlantingsStore(pinia).plantingsOfYear.mockResolvedValue(plantings);
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(AddPlantingYearPage, {
        global: { plugins: [pinia], mocks: { $router } },
        // for the confirmation dialog
        attachTo: document.body,
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

// The checkbox that carries forward the planting called `name`
function carryForward(wrapper, name) {
    const checkbox = wrapper.find(`input[aria-label="Carry forward ${name}"]`);

    if (!checkbox.exists()) {
        throw new Error(`no checkbox to carry forward "${name}"`);
    }
    return checkbox;
}

const selected = wrapper => ['Asparagus bed', 'Mystery'].filter(name => carryForward(wrapper, name).element.checked);

// Both dates picked, so Create is on
async function pickDates(wrapper) {
    await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
    await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));
}

async function clickCreate(wrapper) {
    await buttonLabelled(wrapper, 'Create New Planting Year').trigger('click');
    await flushPromises();
}

const dialogTitle = 'Carry nothing forward?';

describe('AddPlantingYearPage', () => {
    let mounted;

    afterEach(() => {
        mounted?.wrapper.unmount();
        mounted = undefined;
        vi.useRealTimers();
    });

    // Its own copy of the previous year's plantings, so the store's list, the
    // year chosen, is left alone
    it("loads the years, then the latest year's plantings, then the plants", async () => {
        const { plantingYearsStore, plantingsStore, plantsStore } = mounted = await mountPage();

        expect(plantingYearsStore.fetchPlantingYears).toHaveBeenCalledTimes(1);
        expect(plantingsStore.plantingsOfYear).toHaveBeenCalledWith(2026);
        expect(plantingsStore.fetchPlantingsByYear).not.toHaveBeenCalled();
        expect(plantingsStore.plantings).toEqual(shownYearsPlantings);
        expect(plantsStore.fetchPlants).toHaveBeenCalledTimes(1);
    });

    it('proposes the year after the latest, carrying forward from it, and allows no change', async () => {
        const { wrapper } = mounted = await mountPage();

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2026');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2027');
        expect(inputLabelled(wrapper, 'Previous Planting Year').attributes('readonly')).toBeDefined();
        expect(inputLabelled(wrapper, 'New Planting Year').attributes('readonly')).toBeDefined();
    });

    // It went by the calendar: in January 2027, with 2027 never added, it
    // proposed 2028, from 2027 (backlog B18)
    it("goes by the years that exist, not the calendar's", async () => {
        const { wrapper } = mounted = await mountPage({ today: '2027-01-15T12:00:00', years: [2025, 2026] });

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2026');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2027');
    });

    it('proposes two years ahead of the calendar once next year exists', async () => {
        const { wrapper } = mounted = await mountPage({ years: [2026, 2027] });

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('2027');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2028');
    });

    it('passes over a year more than one past the calendar', async () => {
        const { wrapper, plantingsStore } = mounted = await mountPage({ years: [2026, 2099] });

        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2027');
        expect(plantingsStore.plantingsOfYear).toHaveBeenCalledWith(2026);
    });

    it('proposes this calendar year, carrying nothing forward, with no years', async () => {
        const { wrapper, plantingYearsStore, plantingsStore } = mounted = await mountPage({ years: [] });
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2026, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2026, 4, 17));

        expect(inputLabelled(wrapper, 'Previous Planting Year').element.value).toBe('');
        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('2026');
        expect(plantingsStore.plantingsOfYear).not.toHaveBeenCalled();
        expect(tableRows(wrapper)).toEqual([['No previous year to carry forward from']]);

        await clickCreate(wrapper);

        // there was never anything to carry, so nothing to confirm
        expect(findDialog(dialogTitle)).toBeUndefined();
        const [request] = plantingYearsStore.addPlantingYear.mock.calls[0];
        expect(request).toEqual({ plantingYear: 2026, lastFrostDate: '2026-05-10', targetPlantingDate: '2026-05-17' });
    });

    it("proposes nothing, and doesn't offer Create, when the years don't load", async () => {
        const { wrapper, plantingsStore } = mounted = await mountPage({ yearsLoad: false });
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));

        expect(inputLabelled(wrapper, 'New Planting Year').element.value).toBe('');
        expect(plantingsStore.plantingsOfYear).not.toHaveBeenCalled();
        expect(buttonLabelled(wrapper, 'Create New Planting Year').attributes('disabled')).toBeDefined();
    });

    // Only PLANTED plantings are listed, as only they can be carried forward.
    // The heading said "not retired" (backlog B17)
    it('lists only the planted plantings, with their plant and lifespan', async () => {
        const { wrapper } = mounted = await mountPage();

        expect(wrapper.text()).toContain('Plantings to carry forward (planted)');
        expect(tableRows(wrapper)).toEqual([
            ['', 'Asparagus bed', 'Asparagus', 'PERENNIAL', 'PLANTED'],
            ['', 'Mystery', '', '', 'PLANTED'],
        ]);
    });

    it('heads the table of plantings', async () => {
        const { wrapper } = mounted = await mountPage();

        expect(tableHeaders(wrapper)).toEqual(['', 'Planting', 'Plant', 'Lifespan', 'Status']);
    });

    it('says when the year before had nothing planted', async () => {
        const { wrapper } = mounted = await mountPage({ plantings: [] });

        expect(tableRows(wrapper)).toEqual([['Nothing planted in 2026']]);
        expect(buttonLabelled(wrapper, 'Select all').attributes('disabled')).toBeDefined();
    });

    // A date is picked from its field, which opens the picker on the date already picked
    it('opens the date picker from its field', async () => {
        const { wrapper } = mounted = await mountPage();
        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));

        await fieldLabelled(wrapper, 'Last Frost Date').find('.v-field').trigger('click');
        await flushPromises();

        expect(dialogTitled('Set Last Frost Date')).toBeDefined();
        expect(findDialog('Set Target Planting Date')).toBeUndefined();
    });

    it('selects none of them at first', async () => {
        const { wrapper } = mounted = await mountPage();

        expect(selected(wrapper)).toEqual([]);
        expect(wrapper.text()).toContain('0 of 2 selected');
        expect(buttonLabelled(wrapper, 'Select all').exists()).toBe(true);
    });

    it('selects and deselects a planting by its checkbox', async () => {
        const { wrapper } = mounted = await mountPage();

        await carryForward(wrapper, 'Mystery').setValue(true);
        expect(selected(wrapper)).toEqual(['Mystery']);
        expect(wrapper.text()).toContain('1 of 2 selected');

        await carryForward(wrapper, 'Mystery').setValue(false);
        expect(selected(wrapper)).toEqual([]);
    });

    it('selects them all, then deselects them all', async () => {
        const { wrapper } = mounted = await mountPage();
        await carryForward(wrapper, 'Mystery').setValue(true);

        await buttonLabelled(wrapper, 'Select all').trigger('click');
        expect(selected(wrapper)).toEqual(['Asparagus bed', 'Mystery']);
        expect(wrapper.text()).toContain('2 of 2 selected');

        await buttonLabelled(wrapper, 'Deselect all').trigger('click');
        expect(selected(wrapper)).toEqual([]);
        expect(buttonLabelled(wrapper, 'Select all').exists()).toBe(true);
    });

    it('offers to deselect them all once each is selected by hand', async () => {
        const { wrapper } = mounted = await mountPage();

        await carryForward(wrapper, 'Asparagus bed').setValue(true);
        await carryForward(wrapper, 'Mystery').setValue(true);

        expect(buttonLabelled(wrapper, 'Deselect all').exists()).toBe(true);
    });

    it('carries forward only the plantings selected', async () => {
        const { wrapper, plantingYearsStore } = mounted = await mountPage();
        await pickDates(wrapper);
        await buttonLabelled(wrapper, 'Select all').trigger('click');
        await carryForward(wrapper, 'Mystery').setValue(false);

        await clickCreate(wrapper);

        expect(findDialog(dialogTitle)).toBeUndefined();
        const [request] = plantingYearsStore.addPlantingYear.mock.calls[0];
        expect(request.carryForwardPlantingIds).toEqual(['planting-1']);
    });

    it('asks for confirmation before carrying nothing forward, and Cancel adds nothing', async () => {
        const { wrapper, plantingYearsStore, $router } = mounted = await mountPage();
        await pickDates(wrapper);

        await clickCreate(wrapper);
        expect(plantingYearsStore.addPlantingYear).not.toHaveBeenCalled();

        await buttonLabelled(dialogTitled(dialogTitle), 'Cancel').trigger('click');
        await flushPromises();

        expect(findDialog(dialogTitle)).toBeUndefined();
        expect(plantingYearsStore.addPlantingYear).not.toHaveBeenCalled();
        expect($router.push).not.toHaveBeenCalled();
    });

    it('carries nothing forward once confirmed', async () => {
        const { wrapper, plantingYearsStore, $router } = mounted = await mountPage();
        await pickDates(wrapper);
        await clickCreate(wrapper);

        await typeInto(dialogTitled(dialogTitle), 'Confirmation', 'carry nothing forward');
        await buttonLabelled(dialogTitled(dialogTitle), 'Create without plantings').trigger('click');
        await flushPromises();

        expect(findDialog(dialogTitle)).toBeUndefined();
        expect(plantingYearsStore.addPlantingYear).toHaveBeenCalledWith({
            previousPlantingYear: 2026,
            carryForwardPlantingIds: [],
            plantingYear: 2027,
            lastFrostDate: '2027-05-10',
            targetPlantingDate: '2027-05-17',
        });
        expect($router.push).toHaveBeenCalledWith({ name: 'PlantingYearsPage' });
    });

    // A perennial retired by mistake would leave nothing to carry, so it is
    // confirmed even then
    it('asks for confirmation when the year before had nothing planted', async () => {
        const { wrapper, plantingYearsStore } = mounted = await mountPage({ plantings: [] });
        await pickDates(wrapper);

        await clickCreate(wrapper);

        expect(dialogTitled(dialogTitle)).toBeDefined();
        expect(plantingYearsStore.addPlantingYear).not.toHaveBeenCalled();
    });

    it('goes to a planting from its name', async () => {
        const { wrapper, $router } = mounted = await mountPage();

        await wrapper.find('tbody .clickable').trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'PlantingDetailsPage', params: { plantingId: 'planting-1' } });
    });

    it('shows each date once it is picked, and -- before', async () => {
        const { wrapper } = mounted = await mountPage();
        const shown = () => ['Last Frost Date', 'Target Planting Date']
            .map(label => inputLabelled(wrapper, label).element.value);
        expect(shown()).toEqual(['', '']);
        expect(inputLabelled(wrapper, 'Last Frost Date').attributes('placeholder')).toBe('Not set');

        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));

        expect(shown()).toEqual(['2027-05-10', '2027-05-17']);
    });

    it('adds the year with the picked dates, then goes to the years page', async () => {
        const { wrapper, plantingYearsStore, $router } = mounted = await mountPage();
        await pickDates(wrapper);
        await carryForward(wrapper, 'Asparagus bed').setValue(true);

        await clickCreate(wrapper);

        expect(plantingYearsStore.addPlantingYear).toHaveBeenCalledWith({
            previousPlantingYear: 2026,
            carryForwardPlantingIds: ['planting-1'],
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
        const { wrapper, plantingYearsStore } = mounted = await mountPage();
        await pickDates(wrapper);
        await carryForward(wrapper, 'Asparagus bed').setValue(true);

        await clickCreate(wrapper);

        const [request] = plantingYearsStore.addPlantingYear.mock.calls[0];
        expect(request).toMatchObject({ lastFrostDate: '2027-05-10', targetPlantingDate: '2027-05-17' });
    });

    // It loads the plantings and plants it carries forward, so their failures show here too
    it.each([
        ['plantingsStore', 'error fetching plantings by year'],
        ['plantsStore', 'error fetching plants'],
    ])("shows the %s's alert", async (store, message) => {
        mounted = await mountPage();

        mounted[store].$patch({ alertVisible: true, alertType: 'error', alertMessage: message });
        await flushPromises();

        expect(mounted.wrapper.find('.v-alert').text()).toBe(message);
    });

    it("stays put, showing the store's alert, when adding fails", async () => {
        const { wrapper, plantingYearsStore, $router } = mounted = await mountPage({
            plantingYearsState: { alertVisible: true, alertType: 'error', alertMessage: 'error adding planting year' },
        });
        plantingYearsStore.addPlantingYear.mockRejectedValue(new Error('Request failed with status code 400'));
        await pickDates(wrapper);
        await carryForward(wrapper, 'Asparagus bed').setValue(true);

        await clickCreate(wrapper);

        expect(plantingYearsStore.addPlantingYear).toHaveBeenCalledTimes(1);
        expect($router.push).not.toHaveBeenCalled();
        expect(wrapper.find('.v-alert').text()).toBe('error adding planting year');
    });

    // The service requires both dates (backlog A14)
    it('offers Create only once both dates are picked', async () => {
        const { wrapper } = mounted = await mountPage();
        const create = () => buttonLabelled(wrapper, 'Create New Planting Year');
        expect(create().attributes('disabled')).toBeDefined();

        await pickDate(wrapper, 'Set Last Frost Date', new Date(2027, 4, 10));
        expect(create().attributes('disabled')).toBeDefined();

        await pickDate(wrapper, 'Set Target Planting Date', new Date(2027, 4, 17));
        expect(create().attributes('disabled')).toBeUndefined();
    });
});
