import { DOMWrapper, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import GardenPage from '@/components/views/dashboard/garden/GardenPage.vue';
import HarvestSummary from '@/components/harvests/HarvestSummary.vue';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';
import { ApiError } from '@/api/error-handler';
import { useHarvestsStore, usePlantingsStore, usePlantsStore, usePlotsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled } from '../../../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../../../helpers/dialogs';
import { aPlant } from '../../../../../helpers/plants';
import { aPlanting } from '../../../../../helpers/plantings';
import { serviceErrorBody } from '../../../../../helpers/http-errors';

const harvestTypes = [
    { harvestTypeId: 1, harvestTypeName: 'unspecified' },
    { harvestTypeId: 2, harvestTypeName: 'pounds' },
    { harvestTypeId: 3, harvestTypeName: 'count' },
];

const northBed = { plotId: 'plot-1', friendlyName: 'North bed' };
const southBed = { plotId: 'plot-2', friendlyName: 'South bed' };
const herbBox = { plotId: 'plot-3', friendlyName: 'Herb box' };

const bean = aPlant();
const tomato = aPlant({
    plantId: 'plant-2',
    friendlyName: 'Sungold tomato',
    harvesting: { ...aPlant().harvesting, defaultHarvestTypeId: null, defaultHarvestType: null },
});

// Two plots with plantings, one without; a retired planting, and one with no plot
const plantings = [
    aPlanting(),
    aPlanting({ plantingId: 'planting-2', plotId: 'plot-2', plantId: 'plant-2', name: 'Sungold' }),
    aPlanting({ plantingId: 'planting-3', name: 'Old peas', currentStatus: 'RETIRED' }),
    aPlanting({ plantingId: 'planting-4', plotId: null, name: 'Seedlings', currentStatus: 'STARTED' }),
];

const quantities = { 'planting-1': [{ harvestTypeId: 2, harvestType: 'pounds', quantity: 3 }] };

// The page reads the clock when it's created, for its default harvest date.
// An error thrown by a handler or a render goes to `errorHandler`, as an
// app's would
async function mountPage({ now = '2026-07-04T10:00:00', state = {}, errorHandler, beforeMount = () => {} } = {}) {
    vi.useFakeTimers({ now: new Date(now), toFake: ['Date'] });
    const pinia = createTestingPinia({
        initialState: {
            common: { plantingYear: 2026 },
            plots: { plots: [southBed, northBed, herbBox], plotsById: { 'plot-1': northBed, 'plot-2': southBed, 'plot-3': herbBox }, ...state.plots },
            plants: { plants: [bean, tomato], plantsById: { 'plant-1': bean, 'plant-2': tomato }, harvestTypes, ...state.plants },
            plantings: { plantings, ...state.plantings },
            harvests: { harvestQuantitiesByPlanting: quantities, ...state.harvests },
        },
    });
    const stores = {
        plots: usePlotsStore(pinia),
        plants: usePlantsStore(pinia),
        plantings: usePlantingsStore(pinia),
        harvests: useHarvestsStore(pinia),
    };
    beforeMount(stores);
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(GardenPage, {
        global: {
            plugins: [pinia],
            mocks: { $router },
            // Its own spec comes with the harvests (1.14); here only what it's given matters
            stubs: { HarvestSummary: true },
            ...(errorHandler ? { config: { errorHandler } } : {}),
        },
        attachTo: document.body,
    });
    await flushPromises();
    return { wrapper, pinia, $router, ...stores };
}

const summaries = wrapper => wrapper.findAllComponents(HarvestSummary);

// The Add Harvests dialog's title also holds the date and its picker, so it's
// found by its headline
function entryDialog() {
    const content = [...document.querySelectorAll('.v-overlay--active .v-overlay__content')]
        .find(dialog => dialog.querySelector('.headline')?.textContent === 'Add Harvests');
    return content ? new DOMWrapper(content) : undefined;
}

async function openEntry(wrapper) {
    await buttonLabelled(wrapper, 'Add Harvests').trigger('click');
    await flushPromises();
    return entryDialog();
}

const plotSelect = wrapper => wrapper.findAllComponents(VSelect).find(s => s.props('label') === 'Select Plot');
const typeSelects = wrapper => wrapper.findAllComponents(VSelect).filter(s => s.props('label') === 'Type');

async function choosePlot(wrapper, plot) {
    await plotSelect(wrapper).setValue(plot);
    await flushPromises();
}

// The plantings listed for the chosen plot, with each one's type and quantity
function entryRows(wrapper) {
    const types = typeSelects(wrapper);
    return entryDialog().findAll('.harvest-row').map((row, i) => [
        row.find('.text-success').text(),
        row.find('.smaller-text').text(),
        types[i].props('modelValue'),
        row.find('input[type=number]').element.value,
    ]);
}

async function enterQuantity(dialog, plantingName, quantity) {
    const row = dialog.findAll('.harvest-row').find(r => r.find('.text-success').text() === plantingName);
    await row.find('input[type=number]').setValue(quantity);
    await flushPromises();
}

async function press(dialog, label) {
    await buttonLabelled(dialog, label).trigger('click');
    await flushPromises();
}

const confirmTitle = date => `Confirm Harvests [${date}]`;

// Enters 2 pounds of Early beans and 5 Sungold, and goes on to the confirm dialog
async function enterHarvests(wrapper) {
    const dialog = await openEntry(wrapper);
    await choosePlot(wrapper, northBed);
    await enterQuantity(dialog, 'Early beans', '2');
    await choosePlot(wrapper, southBed);
    await enterQuantity(dialog, 'Sungold', '5');
    await press(dialog, 'Save');
    return dialogTitled(confirmTitle('Sat Jul 04 2026'));
}

describe('GardenPage', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('the overview', () => {
        it("loads the plots, plants, harvest types, and the year's plantings and harvests", async () => {
            const { plots, plants, plantings, harvests } = await mountPage();

            expect(plots.fetchPlots).toHaveBeenCalledTimes(1);
            expect(plants.fetchPlants).toHaveBeenCalledTimes(1);
            expect(plants.fetchHarvestTypes).toHaveBeenCalledTimes(1);
            expect(plantings.fetchPlantingsByYear).toHaveBeenCalledWith(2026);
            expect(harvests.fetchHarvestSummariesByYear).toHaveBeenCalledWith(2026);
        });

        it('shows a summary for each plot with plantings, by name', async () => {
            const { wrapper } = await mountPage();

            expect(summaries(wrapper).map(s => s.props('hydratedPlot').friendlyName)).toEqual(['North bed', 'South bed']);
        });

        it("gives each summary its plot's plantings, with their plant and harvests", async () => {
            const { wrapper } = await mountPage();

            const [north, south] = summaries(wrapper).map(s => s.props('hydratedPlot'));
            expect(north).toMatchObject({ plotId: 'plot-1', friendlyName: 'North bed' });
            expect(north.plantings.map(p => [p.plantingId, p.plant.friendlyName, p.harvestQuantities])).toEqual([
                ['planting-1', 'Provider bush bean', quantities['planting-1']],
                ['planting-3', 'Provider bush bean', []],
            ]);
            expect(south.plantings.map(p => p.plantingId)).toEqual(['planting-2']);
        });

        it('hides retired plantings until Show Retired is pressed', async () => {
            const { wrapper } = await mountPage();
            expect(summaries(wrapper).every(s => s.props('showRetired') === false)).toBe(true);

            await press(wrapper, 'Show Retired');

            expect(summaries(wrapper).every(s => s.props('showRetired') === true)).toBe(true);
            await press(wrapper, 'Hide Retired');
            expect(summaries(wrapper).every(s => s.props('showRetired') === false)).toBe(true);
        });

        it.each([
            ['Journal', 'Journal'],
            ['Activity Log', 'ActivityLog'],
        ])('goes to the %s', async (label, name) => {
            const { wrapper, $router } = await mountPage();

            await press(wrapper, label);

            expect($router.push).toHaveBeenCalledWith({ name });
        });

        it("shows the harvests store's alert", async () => {
            const { wrapper } = await mountPage({
                state: { harvests: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching harvest summaries by year' } },
            });

            expect(wrapper.find('.v-alert').text()).toBe('error fetching harvest summaries by year');
        });

        // DocumentsCurrentBehavior: it binds only the harvests store's alert,
        // so a failed load of the plots, plants or plantings shows nothing
        // (backlog A10). Should show each store's alert
        it.each([
            ['plots', 'error fetching plots'],
            ['plants', 'error fetching plants'],
            ['plantings', 'error fetching plantings by year'],
        ])("doesn't show the %s store's alert", async (store, message) => {
            const { wrapper } = await mountPage({
                state: { [store]: { alertVisible: true, alertType: 'error', alertMessage: message } },
            });

            expect(wrapper.find('.v-alert').exists()).toBe(false);
        });

        // DocumentsCurrentBehavior: it reads each planting's plant without a
        // guard, so with the plants not loaded, Add Harvests throws and the
        // dialog doesn't open (backlog A19). Should skip, or name, a planting
        // whose plant is missing
        it("throws on Add Harvests when the plants aren't loaded", async () => {
            const errorHandler = vi.fn();
            const { wrapper } = await mountPage({ state: { plants: { plants: [], plantsById: {} } }, errorHandler });

            await press(wrapper, 'Add Harvests');

            expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(TypeError);
            expect(entryDialog()).toBeUndefined();
        });

        // DocumentsCurrentBehavior: with the plots not loaded, each plot is
        // built from its plantings alone, with no name, and sorting two of them
        // by name throws. The update after the load fails, so the page keeps
        // what it showed before it, with no plots (backlog A19). Should guard
        // the plot
        it("throws, and shows no plots, when the plots aren't loaded", async () => {
            const errorHandler = vi.fn();
            const { wrapper } = await mountPage({ state: { plots: { plots: [], plotsById: {} } }, errorHandler });

            expect(errorHandler).toHaveBeenCalledTimes(1);
            expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(TypeError);
            expect(summaries(wrapper)).toHaveLength(0);
        });

        // filteredPlots sorts the store's own list, in place, once the dialog
        // that offers them renders (B21)
        it("sorts the plots store's list in place", async () => {
            const { wrapper, pinia } = await mountPage();
            expect(pinia.state.value.plots.plots.map(p => p.friendlyName)).toEqual(['South bed', 'North bed', 'Herb box']);

            await openEntry(wrapper);

            expect(pinia.state.value.plots.plots.map(p => p.friendlyName)).toEqual(['Herb box', 'North bed', 'South bed']);
        });
    });

    describe('entering harvests', () => {
        it('offers every plot, by name', async () => {
            const { wrapper } = await mountPage();

            await openEntry(wrapper);

            expect(plotSelect(wrapper).props('items').map(p => p.friendlyName)).toEqual(['Herb box', 'North bed', 'South bed']);
        });

        it("lists a chosen plot's plantings that aren't retired, with the plant's default type, and none harvested", async () => {
            const { wrapper } = await mountPage();
            await openEntry(wrapper);

            await choosePlot(wrapper, northBed);

            expect(entryRows(wrapper)).toEqual([['Early beans', 'Provider bush bean', 2, '0']]);
        });

        it('defaults to the unspecified type for a plant with no default', async () => {
            const { wrapper } = await mountPage();
            await openEntry(wrapper);

            await choosePlot(wrapper, southBed);

            expect(entryRows(wrapper)).toEqual([['Sungold', 'Sungold tomato', 1, '0']]);
        });

        it('says when a plot has nothing to harvest', async () => {
            const { wrapper } = await mountPage();
            const dialog = await openEntry(wrapper);

            await choosePlot(wrapper, herbBox);

            expect(dialog.findAll('.harvest-row')).toHaveLength(0);
            expect(dialog.text()).toContain('There are no plantings to harvest in Herb box');
        });

        it('enables Save once a quantity is entered', async () => {
            const { wrapper } = await mountPage();
            const dialog = await openEntry(wrapper);
            await choosePlot(wrapper, northBed);
            expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeDefined();

            await enterQuantity(dialog, 'Early beans', '2');

            expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeUndefined();
        });

        it.each(['0', '-1', ''])('keeps Save disabled for a quantity of "%s"', async quantity => {
            const { wrapper } = await mountPage();
            const dialog = await openEntry(wrapper);
            await choosePlot(wrapper, northBed);

            await enterQuantity(dialog, 'Early beans', quantity);

            expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeDefined();
        });

        it('keeps the quantities entered in one plot while another is chosen', async () => {
            const { wrapper } = await mountPage();
            const dialog = await openEntry(wrapper);
            await choosePlot(wrapper, northBed);
            await enterQuantity(dialog, 'Early beans', '2');

            await choosePlot(wrapper, southBed);
            await choosePlot(wrapper, northBed);

            expect(entryRows(wrapper)[0][3]).toBe('2');
        });

        it('shows what was entered, from every plot, for confirming', async () => {
            const { wrapper } = await mountPage();

            const confirm = await enterHarvests(wrapper);

            expect(entryDialog()).toBeUndefined();
            expect(confirm.findAll('.v-chip').map(chip => chip.text())).toEqual(['+2 pounds', '+5']);
        });

        it('goes back to the entry, with the quantities kept, on Back', async () => {
            const { wrapper } = await mountPage();
            const confirm = await enterHarvests(wrapper);

            await press(confirm, 'Back');

            expect(findDialog(confirmTitle('Sat Jul 04 2026'))).toBeUndefined();
            expect(entryRows(wrapper)).toEqual([['Sungold', 'Sungold tomato', 1, '5']]);
        });

        it.each([
            ['the entry', wrapper => openEntry(wrapper).then(dialog => choosePlot(wrapper, northBed).then(() => enterQuantity(dialog, 'Early beans', '2')).then(() => dialog))],
            ['the confirm dialog', enterHarvests],
        ])('empties the form on Cancel from %s, without saving', async (_, reach) => {
            const { wrapper, harvests } = await mountPage();
            const dialog = await reach(wrapper);

            await press(dialog, 'Cancel');

            expect(entryDialog()).toBeUndefined();
            expect(findDialog(confirmTitle('Sat Jul 04 2026'))).toBeUndefined();
            expect(harvests.upsertHarvests).not.toHaveBeenCalled();
            await openEntry(wrapper);
            expect(plotSelect(wrapper).props('modelValue')).toBeNull();
            await choosePlot(wrapper, northBed);
            expect(entryRows(wrapper)[0][3]).toBe('0');
        });

        // Before the first load is done hydratedPlots is {}, not a list, so
        // the dialog has no plantings to offer
        it('opens with nothing to harvest before the first load is done', async () => {
            const { wrapper } = await mountPage({
                beforeMount: ({ plots }) => plots.fetchPlots.mockReturnValueOnce(new Promise(() => {})),
            });
            expect(summaries(wrapper)).toHaveLength(0);

            const dialog = await openEntry(wrapper);
            await choosePlot(wrapper, northBed);

            expect(dialog.text()).toContain('There are no plantings to harvest in North bed');
        });
    });

    describe('the harvest date', () => {
        it('defaults to today', async () => {
            const { wrapper } = await mountPage();

            const dialog = await openEntry(wrapper);

            expect(dialog.find('.v-card-title').text()).toContain('Sat Jul 04 2026');
        });

        it('can be overridden', async () => {
            const { wrapper } = await mountPage();
            const dialog = await openEntry(wrapper);

            wrapper.findComponent(DatePickerDialogActivator).props('onSubmit')(new Date(2026, 6, 1));
            await flushPromises();

            expect(dialog.find('.v-card-title').text()).toContain('Wed Jul 01 2026');
        });

        // DocumentsCurrentBehavior: an overridden date outlasts Cancel, and a
        // save, so the next harvests go on it too unless it's changed back
        // (backlog A13). Should go back to today
        it('keeps an overridden date after Cancel', async () => {
            const { wrapper } = await mountPage();
            let dialog = await openEntry(wrapper);
            wrapper.findComponent(DatePickerDialogActivator).props('onSubmit')(new Date(2026, 6, 1));
            await press(dialog, 'Cancel');

            dialog = await openEntry(wrapper);

            expect(dialog.find('.v-card-title').text()).toContain('Wed Jul 01 2026');
        });
    });

    describe('saving', () => {
        it('saves each harvest entered, on the harvest date, then closes and reloads', async () => {
            const { wrapper, harvests, plots } = await mountPage();
            const confirm = await enterHarvests(wrapper);

            await press(confirm, 'Confirm');

            expect(harvests.upsertHarvests).toHaveBeenCalledWith([
                { plantingYear: 2026, plantingId: 'planting-1', quantity: 2, harvestDate: new Date('2026-07-04T10:00:00'), harvestTypeId: 2 },
                { plantingYear: 2026, plantingId: 'planting-2', quantity: 5, harvestDate: new Date('2026-07-04T10:00:00'), harvestTypeId: 1 },
            ]);
            expect(findDialog(confirmTitle('Sat Jul 04 2026'))).toBeUndefined();
            expect(entryDialog()).toBeUndefined();
            expect(plots.fetchPlots).toHaveBeenCalledTimes(2);
            expect(harvests.fetchHarvestSummariesByYear).toHaveBeenCalledTimes(2);
        });

        it('saves the type chosen in the form, and an overridden date', async () => {
            const { wrapper, harvests } = await mountPage();
            const dialog = await openEntry(wrapper);
            wrapper.findComponent(DatePickerDialogActivator).props('onSubmit')(new Date(2026, 6, 1));
            await choosePlot(wrapper, northBed);
            await typeSelects(wrapper)[0].setValue(3);
            await enterQuantity(dialog, 'Early beans', '12');
            await press(dialog, 'Save');

            await press(dialogTitled(confirmTitle('Wed Jul 01 2026')), 'Confirm');

            expect(harvests.upsertHarvests).toHaveBeenCalledWith([
                { plantingYear: 2026, plantingId: 'planting-1', quantity: 12, harvestDate: new Date(2026, 6, 1), harvestTypeId: 3 },
            ]);
        });

        // The service takes it, but stores it in an INT column, so it keeps 2
        // (validation-fixes doc, "worth doing")
        it('saves a fractional quantity as it was entered', async () => {
            const { wrapper, harvests } = await mountPage();
            const dialog = await openEntry(wrapper);
            await choosePlot(wrapper, northBed);
            await enterQuantity(dialog, 'Early beans', '1.5');
            await press(dialog, 'Save');

            await press(dialogTitled(confirmTitle('Sat Jul 04 2026')), 'Confirm');

            expect(harvests.upsertHarvests.mock.calls[0][0][0].quantity).toBe(1.5);
        });

        it.each([
            ["the service's message, for a 400", new ApiError('Request failed', 400, serviceErrorBody(400, 'harvests[0].quantity must be greater than 0')), 'harvests[0].quantity must be greater than 0'],
            ['a general message, otherwise', new ApiError('Request failed', 500, ''), 'error saving harvests'],
        ])('goes back to the entry, with the quantities kept, and shows %s, when the save fails', async (_, failure, message) => {
            const { wrapper, harvests, plots } = await mountPage({
                beforeMount: ({ harvests }) => harvests.upsertHarvests.mockRejectedValueOnce(failure),
            });
            const confirm = await enterHarvests(wrapper);

            await press(confirm, 'Confirm');

            expect(findDialog(confirmTitle('Sat Jul 04 2026'))).toBeUndefined();
            expect(entryDialog().find('.v-alert').text()).toBe(message);
            expect(entryRows(wrapper)).toEqual([['Sungold', 'Sungold tomato', 1, '5']]);
            expect(plots.fetchPlots).toHaveBeenCalledTimes(1);
            expect(harvests.upsertHarvests).toHaveBeenCalledTimes(1);
        });

        it('clears the failure message when the entry is next opened', async () => {
            const { wrapper } = await mountPage({
                beforeMount: ({ harvests }) => harvests.upsertHarvests.mockRejectedValueOnce(new ApiError('Request failed', 500, '')),
            });
            await press(await enterHarvests(wrapper), 'Confirm');
            await press(entryDialog(), 'Cancel');

            const dialog = await openEntry(wrapper);

            expect(dialog.find('.v-alert').exists()).toBe(false);
        });

        // DocumentsCurrentBehavior: the default date is the moment the page
        // was created, and the service files a harvest under that instant's
        // UTC day, so harvests saved on a New York evening go on the next day.
        // A page left open overnight files them under the day before.
        // Should send the local day, as YYYY-MM-DD (backlog A22)
        it('saves a New York evening as the next day', async () => {
            const { wrapper, harvests } = await mountPage({ now: '2026-07-04T21:30:00' });

            await press(await enterHarvests(wrapper), 'Confirm');

            expect(harvests.upsertHarvests.mock.calls[0][0][0].harvestDate.toISOString()).toBe('2026-07-05T01:30:00.000Z');
        });

        // DocumentsCurrentBehavior: Confirm stays enabled while the save is in
        // flight, and each press saves the harvests again. The service adds a
        // harvest to one already filed for its planting, day and type, so a
        // double press doubles them. Should disable Confirm until the save is
        // done (backlog A27)
        it('saves again on a second Confirm while the first is in flight', async () => {
            const { wrapper, harvests } = await mountPage({
                beforeMount: ({ harvests }) => harvests.upsertHarvests.mockReturnValue(new Promise(() => {})),
            });
            const confirm = await enterHarvests(wrapper);

            await press(confirm, 'Confirm');
            await press(confirm, 'Confirm');

            expect(harvests.upsertHarvests).toHaveBeenCalledTimes(2);
            expect(harvests.upsertHarvests.mock.calls[1][0]).toEqual(harvests.upsertHarvests.mock.calls[0][0]);
        });
    });
});
