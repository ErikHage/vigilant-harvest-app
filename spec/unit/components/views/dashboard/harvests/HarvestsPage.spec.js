import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VChip } from 'vuetify/components';
import HarvestsPage from '@/components/views/dashboard/harvests/HarvestsPage.vue';
import EditHarvestsDialog from '@/components/harvests/EditHarvestsDialog.vue';
import { ApiError } from '@/api/error-handler';
import { useHarvestsStore, usePlantingsStore, usePlantsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled } from '../../../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../../../helpers/dialogs';
import { aPlant } from '../../../../../helpers/plants';
import { aPlanting } from '../../../../../helpers/plantings';
import { aHarvest, filedOn, harvestTypes } from '../../../../../helpers/harvests';
import { serviceErrorBody } from '../../../../../helpers/http-errors';

const bean = aPlant();
const tomato = aPlant({ plantId: 'plant-2', friendlyName: 'Sungold tomato' });

const plantings = {
    'planting-1': aPlanting(),
    'planting-2': aPlanting({ plantingId: 'planting-2', plantId: 'plant-2', name: 'Sungold' }),
    'planting-3': aPlanting({ plantingId: 'planting-3', name: 'Late beans' }),
};

// The year's harvests, newest first, as the search sends them
const harvests = [
    aHarvest({ harvestId: 'h-1', plantingId: 'planting-1', quantity: 2 }),
    aHarvest({ harvestId: 'h-2', plantingId: 'planting-3', quantity: 3 }),
    aHarvest({ harvestId: 'h-3', plantingId: 'planting-1', quantity: 12, harvestTypeId: 3, harvestType: 'count' }),
    aHarvest({ harvestId: 'h-4', plantingId: 'planting-2', quantity: 25, harvestTypeId: 1, harvestType: 'unspecified' }),
    aHarvest({ harvestId: 'h-5', plantingId: 'planting-1', quantity: 1, harvestDate: filedOn('2026-07-09') }),
    aHarvest({ harvestId: 'h-6', plantingId: 'planting-2', quantity: 4, harvestTypeId: 1, harvestType: 'unspecified', harvestDate: filedOn('2026-07-01') }),
];

// The page reads a mounted() error through `errorHandler`, as an app would
async function mountPage({ state = {}, errorHandler, beforeMount = () => {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            common: { plantingYear: 2026 },
            plants: { plantsById: { 'plant-1': bean, 'plant-2': tomato }, harvestTypes, ...state.plants },
            plantings: { plantingsById: plantings, ...state.plantings },
            harvests: { harvests, ...state.harvests },
        },
    });
    const stores = { plants: usePlantsStore(pinia), plantings: usePlantingsStore(pinia), harvests: useHarvestsStore(pinia) };
    beforeMount(stores);
    const wrapper = mountWithPlugins(HarvestsPage, {
        global: { plugins: [pinia], ...(errorHandler ? { config: { errorHandler } } : {}) },
        attachTo: document.body,
    });
    await flushPromises();
    return { wrapper, ...stores };
}

const timeline = wrapper => wrapper.findAll('.timeline-entry').map(entry => entry.text());
const selected = wrapper => wrapper.find('.timeline-entry.selected').text();

// Each plant harvested on the selected day, with its totals by type
const plantGroups = wrapper => wrapper.findAll('.chip-row').map(group => [
    group.find('.plant-name').text(),
    group.findAll('.v-chip').map(chip => chip.text()),
]);

async function clickDay(wrapper, day) {
    await wrapper.findAll('.timeline-entry').find(entry => entry.text() === day).trigger('click');
    await flushPromises();
}

async function togglePlant(wrapper, plantName) {
    await wrapper.findAll('.chip-row').find(group => group.find('.plant-name').text() === plantName)
        .find('.d-flex.align-center').trigger('click');
    await flushPromises();
}

const breakdown = wrapper => wrapper.findAll('.breakdown-row').map(row => row.text());

async function openEdit(wrapper) {
    await buttonLabelled(wrapper, 'Edit').trigger('click');
    await flushPromises();
    return dialogTitled('Edit Harvests');
}

async function press(dialog, label) {
    await buttonLabelled(dialog, label).trigger('click');
    await flushPromises();
}

describe('HarvestsPage', () => {
    describe('the timeline', () => {
        it("loads the plants, harvest types, and the year's harvests and plantings", async () => {
            const { plants, plantings: plantingsStore, harvests: harvestsStore } = await mountPage();

            expect(plants.fetchPlants).toHaveBeenCalledTimes(1);
            expect(plants.fetchHarvestTypes).toHaveBeenCalledTimes(1);
            expect(harvestsStore.searchHarvests).toHaveBeenCalledWith(2026);
            expect(plantingsStore.fetchPlantingsByYear).toHaveBeenCalledWith(2026);
        });

        it('lists the days with harvests, newest first, with a gap where days are skipped', async () => {
            const { wrapper } = await mountPage();

            expect(timeline(wrapper)).toEqual(['2026-07-10', '2026-07-09', '...', '2026-07-01']);
        });

        // The service sends a harvest's day as YYYY-MM-DD, and the page reads
        // it as that local day: not UTC midnight, which is the evening before
        // in New York (backlog A28)
        it('shows each harvest on the day filed', async () => {
            const { wrapper } = await mountPage({ state: { harvests: { harvests: [aHarvest({ harvestDate: filedOn('2026-07-10') })] } } });

            expect(timeline(wrapper)).toEqual(['2026-07-10']);
            expect(wrapper.find('h3').text()).toBe('2026-07-10');
        });

        it('opens on the newest day', async () => {
            const { wrapper } = await mountPage();

            expect(selected(wrapper)).toBe('2026-07-10');
            expect(wrapper.find('h3').text()).toBe('2026-07-10');
        });

        it('shows the day clicked, and ignores a click on a gap', async () => {
            const { wrapper } = await mountPage();

            await clickDay(wrapper, '2026-07-01');
            expect(wrapper.find('h3').text()).toBe('2026-07-01');
            expect(plantGroups(wrapper)).toEqual([['Sungold tomato', ['4']]]);

            await clickDay(wrapper, '...');
            expect(selected(wrapper)).toBe('2026-07-01');
        });

        // It says so even when there are none to select
        it('asks for a day when none is selected', async () => {
            const { wrapper } = await mountPage({ state: { harvests: { harvests: [] } } });

            expect(timeline(wrapper)).toEqual([]);
            expect(wrapper.text()).toContain('Select a date from the timeline to see harvests.');
        });

        it("shows the harvests store's alert", async () => {
            const { wrapper } = await mountPage({
                state: { harvests: { alertVisible: true, alertType: 'error', alertMessage: 'error searching harvests page' } },
            });

            expect(wrapper.find('.v-alert').text()).toBe('error searching harvests page');
        });

        it.each([
            ['plants', 'error fetching plants'],
            ['plantings', 'error fetching plantings by year'],
        ])("shows the %s store's alert", async (store, message) => {
            const { wrapper } = await mountPage({ state: { [store]: { alertVisible: true, alertType: 'error', alertMessage: message } } });

            expect(wrapper.find('.v-alert').text()).toBe(message);
        });

        // DocumentsCurrentBehavior: it reads each harvest's planting, and its
        // plant, without a guard, so with the plantings (or plants) not
        // loaded the load throws, and the page shows no harvests (backlog
        // A19). Should show the harvest without the names it can't find
        it.each([
            ['plantings', { plantings: { plantingsById: {} } }],
            ['plants', { plants: { plantsById: {} } }],
        ])("throws, and shows nothing, when the %s aren't loaded", async (_, state) => {
            const errorHandler = vi.fn();
            const { wrapper } = await mountPage({ state, errorHandler });

            expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(TypeError);
            expect(timeline(wrapper)).toEqual([]);
        });
    });

    describe('a day', () => {
        it('groups its harvests by plant, by name, with each type totalled, largest first', async () => {
            const { wrapper } = await mountPage();

            expect(plantGroups(wrapper)).toEqual([
                ['Provider bush bean', ['12 count', '5 pounds']],
                ['Sungold tomato', ['25']],
            ]);
        });

        it.each([
            [1, '#4575b4'],
            [5, '#91bfdb'],
            [10, '#ffffbf'],
            [20, '#fdae61'],
            [21, '#d73027'],
        ])('colours a total of %i as %s', async (quantity, colour) => {
            const { wrapper } = await mountPage({ state: { harvests: { harvests: [aHarvest({ quantity })] } } });

            expect(wrapper.findComponent(VChip).props('color')).toBe(colour);
        });

        it("shows a plant's harvests by planting when clicked, and hides them again", async () => {
            const { wrapper } = await mountPage();

            await togglePlant(wrapper, 'Provider bush bean');
            expect(breakdown(wrapper)).toEqual(['• Early beans – 2 pounds', '• Late beans – 3 pounds', '• Early beans – 12 count']);

            await togglePlant(wrapper, 'Provider bush bean');
            expect(breakdown(wrapper)).toEqual([]);
        });
    });

    describe('editing', () => {
        it("opens the dialog on the day's harvests, with their names, and the harvest types", async () => {
            const { wrapper } = await mountPage();

            await openEdit(wrapper);

            const dialog = wrapper.findComponent(EditHarvestsDialog);
            expect(dialog.props('harvests').map(h => [h.harvestId, h.plantingName, h.plantName])).toEqual([
                ['h-1', 'Early beans', 'Provider bush bean'],
                ['h-2', 'Late beans', 'Provider bush bean'],
                ['h-3', 'Early beans', 'Provider bush bean'],
                ['h-4', 'Sungold', 'Sungold tomato'],
            ]);
            expect(dialog.props('harvestTypes')).toEqual(harvestTypes);
        });

        it('saves the edits with the year, then closes and reloads, staying on the day', async () => {
            const { wrapper, harvests: store } = await mountPage();
            await clickDay(wrapper, '2026-07-09');
            const dialog = await openEdit(wrapper);
            await dialog.find('input[type=number]').setValue('3');

            await press(dialog, 'Update');

            expect(store.upsertHarvests).toHaveBeenCalledWith([
                { harvestId: 'h-5', plantingYear: 2026, plantingId: 'planting-1', quantity: 3, harvestDate: filedOn('2026-07-09'), harvestTypeId: 2 },
            ]);
            expect(findDialog('Edit Harvests')).toBeUndefined();
            expect(store.searchHarvests).toHaveBeenCalledTimes(2);
            expect(selected(wrapper)).toBe('2026-07-09');
        });

        it('goes to the newest day when the edited day has no harvests left', async () => {
            const { wrapper, harvests: store } = await mountPage();
            await clickDay(wrapper, '2026-07-09');
            store.searchHarvests.mockImplementationOnce(async () => {
                store.harvests = harvests.filter(h => h.harvestId !== 'h-5');
            });

            await press(await openEdit(wrapper), 'Update');

            expect(timeline(wrapper)).toEqual(['2026-07-10', '...', '2026-07-01']);
            expect(selected(wrapper)).toBe('2026-07-10');
        });

        it.each([
            ["the service's message, for a 400", new ApiError('Request failed', 400, serviceErrorBody(400, 'harvests[0].quantity must be greater than 0')), 'harvests[0].quantity must be greater than 0'],
            ['a general message, otherwise', new ApiError('Request failed', 500, ''), 'error updating harvests'],
        ])('stays open with the edits, and shows %s, when the save fails', async (_, failure, message) => {
            const { wrapper, harvests: store } = await mountPage({
                beforeMount: ({ harvests }) => harvests.upsertHarvests.mockRejectedValueOnce(failure),
            });
            const dialog = await openEdit(wrapper);
            await dialog.find('input[type=number]').setValue('0');

            await press(dialog, 'Update');

            expect(dialog.find('.v-alert').text()).toBe(message);
            expect(dialog.find('input[type=number]').element.value).toBe('0');
            expect(store.searchHarvests).toHaveBeenCalledTimes(1);
        });

        it('closes on Cancel, without saving, and clears a failure for the next time', async () => {
            const { wrapper, harvests: store } = await mountPage({
                beforeMount: ({ harvests }) => harvests.upsertHarvests.mockRejectedValueOnce(new ApiError('Request failed', 500, '')),
            });
            let dialog = await openEdit(wrapper);
            await press(dialog, 'Update');

            await press(dialog, 'Cancel');

            expect(findDialog('Edit Harvests')).toBeUndefined();
            expect(store.upsertHarvests).toHaveBeenCalledTimes(1);
            dialog = await openEdit(wrapper);
            expect(dialog.find('.v-alert').exists()).toBe(false);
        });

        it('drops cancelled edits', async () => {
            const { wrapper } = await mountPage();
            let dialog = await openEdit(wrapper);
            await dialog.find('input[type=number]').setValue('9');
            await press(dialog, 'Cancel');

            dialog = await openEdit(wrapper);

            expect(dialog.find('input[type=number]').element.value).toBe('2');
        });
    });
});
