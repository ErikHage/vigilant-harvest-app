import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PlantingDetailsPage from '@/components/views/dashboard/plantings/PlantingDetailsPage.vue';
import PlantingDetailsTab from '@/components/plantings/PlantingDetailsTab.vue';
import PlantingHistoryTab from '@/components/plantings/PlantingHistoryTab.vue';
import CommentPlantingActionDialog from '@/components/plantings/CommentPlantingActionDialog.vue';
import StartPlantingActionDialog from '@/components/plantings/StartPlantingActionDialog.vue';
import SplitPlantingActionDialog from '@/components/plantings/SplitPlantingActionDialog.vue';
import PlantPlantingActionDialog from '@/components/plantings/PlantPlantingActionDialog.vue';
import DeletePlantingActionDialog from '@/components/plantings/DeletePlantingActionDialog.vue';
import RetirePlantingActionDialog from '@/components/plantings/RetirePlantingActionDialog.vue';
import { usePlantingsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled } from '../../../../../helpers/fields';
import { aPlanting } from '../../../../../helpers/plantings';
import { httpError } from '../../../../../helpers/http-errors';

const plants = [{ plantId: 'plant-1', friendlyName: 'Provider bush bean' }];
const plots = [{ plotId: 'plot-1', friendlyName: 'North bed' }];

// Any warning fails the test

async function mountPage({ planting = aPlanting(), state = {}, beforeMount = () => {} } = {}) {
    const pinia = createTestingPinia({
        initialState: {
            plantings: { plantingsById: planting ? { 'planting-1': planting } : {}, ...state.plantings },
            plants: { plants, plantsById: { 'plant-1': plants[0] }, ...state.plants },
            plots: { plots, plotsById: { 'plot-1': plots[0] }, ...state.plots },
        },
    });
    const store = usePlantingsStore(pinia);
    beforeMount(store);
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(PlantingDetailsPage, {
        global: {
            plugins: [pinia],
            mocks: { $route: { params: { plantingId: 'planting-1' } }, $router },
            // Each dialog has its own spec; here only which ones show matters
            stubs: {
                CommentPlantingActionDialog: true,
                StartPlantingActionDialog: true,
                SplitPlantingActionDialog: true,
                PlantPlantingActionDialog: true,
                DeletePlantingActionDialog: true,
                RetirePlantingActionDialog: true,
            },
        },
    });
    await flushPromises();
    return { wrapper, store, $router, pinia };
}

const actionDialogs = [
    ['Comment', CommentPlantingActionDialog],
    ['Start', StartPlantingActionDialog],
    ['Split', SplitPlantingActionDialog],
    ['Plant', PlantPlantingActionDialog],
    ['Delete', DeletePlantingActionDialog],
    ['Retire', RetirePlantingActionDialog],
];
const shownActions = wrapper => actionDialogs.filter(([, dialog]) => wrapper.findComponent(dialog).exists()).map(([name]) => name);

describe('PlantingDetailsPage', () => {
    let warn;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        expect(warn.mock.calls).toEqual([]);
        vi.restoreAllMocks();
    });

    describe('loading', () => {
        it('loads the plots, then the planting', async () => {
            const { store } = await mountPage();

            expect(store.fetchPlantingById).toHaveBeenCalledWith('planting-1');
        });

        it('shows the planting: its name, id and status', async () => {
            const { wrapper } = await mountPage();

            expect(wrapper.find('.page-title').text()).toBe('Early beans');
            expect(wrapper.text()).toContain('planting-1');
            expect(wrapper.find('.v-chip').text()).toBe('PLANTED');
        });

        it('gives the details tab its copy of the planting, with the plants and plots', async () => {
            const { wrapper } = await mountPage();

            const tab = wrapper.findComponent(PlantingDetailsTab);
            expect(tab.props('planting')).toMatchObject({ plantingId: 'planting-1', name: 'Early beans', currentStatus: 'PLANTED' });
            expect(tab.props('planting')).not.toBe(aPlanting());
            expect(tab.props('plants')).toEqual(plants);
            expect(tab.props('plots')).toEqual(plots);
            expect(tab.props('enableEdit')).toBe(false);
        });

        it('copies a planting with little set, leaving the rest undefined', async () => {
            const bare = { plantingId: 'planting-1', name: 'Bare', currentStatus: 'CREATED' };
            const { wrapper } = await mountPage({ planting: bare });

            const copy = wrapper.findComponent(PlantingDetailsTab).props('planting');
            expect(copy).toMatchObject({ plantingId: 'planting-1', name: 'Bare', statusHistory: [] });
            expect(copy.plotId).toBeUndefined();
            expect(copy.sowDate).toBeUndefined();
        });

        it('shows the history, oldest first, on the History tab', async () => {
            const { wrapper } = await mountPage();

            await wrapper.findAll('.v-tab').find(tab => tab.text() === 'History').trigger('click');
            await flushPromises();

            expect(wrapper.findComponent(PlantingHistoryTab).props('history').map(item => item.plantingHistoryId))
                .toEqual(['h-1', 'h-2', 'h-3', 'h-4']);
        });

        // sortedHistory sorts the copy's statusHistory, which is the store's
        // own array, in place (B21)
        it("sorts the store's history array in place", async () => {
            const planting = aPlanting();
            const { wrapper, pinia } = await mountPage({ planting });

            await wrapper.findAll('.v-tab').find(tab => tab.text() === 'History').trigger('click');
            await flushPromises();

            expect(pinia.state.value.plantings.plantingsById['planting-1'].statusHistory.map(item => item.plantingHistoryId))
                .toEqual(['h-1', 'h-2', 'h-3', 'h-4']);
        });

        it.each([
            ['plantings', 'error performing planting action PLANT'],
            ['plants', 'error fetching plants'],
            ['plots', 'error fetching plots'],
        ])("shows the %s store's alert", async (store, message) => {
            const { wrapper } = await mountPage({ state: { [store]: { alertVisible: true, alertType: 'error', alertMessage: message } } });

            expect(wrapper.find('.v-alert').text()).toBe(message);
        });

        // DocumentsCurrentBehavior: with the planting not loaded, refreshData
        // reads planting.plantingId of undefined and throws. mounted() doesn't
        // await it, so in the app that's an unhandled rejection. Unlike the
        // plant pages, the alerts sit outside any v-if, so the store's alert
        // does show. Should not throw.
        //
        // The mount's own refresh is held, so its rejection can't escape
        it("throws when the planting isn't loaded", async () => {
            const { wrapper } = await mountPage({
                planting: null,
                beforeMount: store => store.fetchPlantingById.mockReturnValueOnce(new Promise(() => {})),
            });

            await expect(wrapper.vm.refreshData()).rejects.toThrow(TypeError);
            expect(wrapper.find('.page-title').text()).toBe('Planting Details');
        });

        // Comment was rendered without a planting too (backlog B26)
        it('offers no action until the planting loads', async () => {
            const { wrapper } = await mountPage({
                planting: null,
                beforeMount: store => store.fetchPlantingById.mockReturnValueOnce(new Promise(() => {})),
            });

            expect(shownActions(wrapper)).toEqual([]);
        });
    });

    describe('actions', () => {
        it.each([
            ['CREATED', 24, ['Comment', 'Start', 'Plant', 'Delete']],
            ['STARTED', 24, ['Comment', 'Split', 'Plant', 'Retire']],
            ['STARTED', 1, ['Comment', 'Plant', 'Retire']],
            ['PLANTED', 20, ['Comment', 'Retire']],
            ['RETIRED', 20, ['Comment']],
        ])('offers %s plantings, with %i sown, these actions: %j', async (currentStatus, numberSown, actions) => {
            const { wrapper } = await mountPage({ planting: aPlanting({ currentStatus, numberSown }) });

            expect(shownActions(wrapper)).toEqual(actions);
        });

        it.each([
            ['COMMENT', { comment: 'note' }],
            ['START', { numberSown: 24 }],
            ['PLANT', { plotId: 'plot-1' }],
            ['RETIRE', { comment: 'done' }],
        ])('performs %s, then reloads', async (action, data) => {
            const { wrapper, store, $router } = await mountPage({ planting: aPlanting({ currentStatus: 'CREATED' }) });

            await wrapper.findComponent(CommentPlantingActionDialog).props('onSubmit')(action, data);
            await flushPromises();

            expect(store.performPlantingAction).toHaveBeenCalledWith('planting-1', action, data);
            expect(store.fetchPlantingById).toHaveBeenCalledTimes(2);
            expect($router.push).not.toHaveBeenCalled();
        });

        it.each(['DELETE', 'SPLIT'])('performs %s, then goes to the plantings', async action => {
            const { wrapper, store, $router } = await mountPage({ planting: aPlanting({ currentStatus: 'CREATED' }) });

            await wrapper.findComponent(CommentPlantingActionDialog).props('onSubmit')(action, {});
            await flushPromises();

            expect(store.performPlantingAction).toHaveBeenCalledWith('planting-1', action, {});
            expect($router.push).toHaveBeenCalledWith({ name: 'PlantingsPage' });
            expect(store.fetchPlantingById).toHaveBeenCalledTimes(1);
        });

        // So the action's dialog, which waits for it, stays open and says why
        it.each(['START', 'DELETE', 'SPLIT'])('rejects when %s fails, staying put without reloading', async action => {
            const { wrapper, store, $router } = await mountPage({ planting: aPlanting({ currentStatus: 'CREATED' }) });
            const err = httpError(400);
            store.performPlantingAction.mockRejectedValue(err);

            await expect(wrapper.findComponent(CommentPlantingActionDialog).props('onSubmit')(action, {})).rejects.toBe(err);
            await flushPromises();

            expect($router.push).not.toHaveBeenCalled();
            expect(store.fetchPlantingById).toHaveBeenCalledTimes(1);
        });
    });

    describe('editing', () => {
        // The tab edits the page's copy in place, as its fields do
        async function edit(wrapper, field, value) {
            wrapper.findComponent(PlantingDetailsTab).props('planting')[field] = value;
            await flushPromises();
        }

        const updateEnabled = wrapper => buttonLabelled(wrapper, 'Update').attributes('disabled') === undefined;

        it('unlocks the details tab with the lock switch, and Update once something is edited', async () => {
            const { wrapper } = await mountPage();
            expect(updateEnabled(wrapper)).toBe(false);
            expect(wrapper.find('.mdi-lock').exists()).toBe(true);

            await wrapper.find('.v-switch input').setValue(true);

            expect(wrapper.findComponent(PlantingDetailsTab).props('enableEdit')).toBe(true);
            expect(wrapper.find('.mdi-lock-open').exists()).toBe(true);
            expect(updateEnabled(wrapper)).toBe(false);

            await edit(wrapper, 'name', 'Earliest beans');

            expect(updateEnabled(wrapper)).toBe(true);
        });

        it.each([
            ['CREATED', { name: 'Earliest beans', seedSource: "Johnny's", lotNumber: 'L-14', plantId: 'plant-1', targetPlantingDate: '2026-05-17', leadTimeWeeks: 3 }],
            ['STARTED', { name: 'Earliest beans', seedSource: "Johnny's", lotNumber: 'L-14', sowDate: '2026-04-20', numberSown: 24, targetPlantingDate: '2026-05-17' }],
            ['PLANTED', { name: 'Earliest beans', seedSource: "Johnny's", lotNumber: 'L-14', plotId: 'plot-1', transplantDate: '2026-05-18', numberTransplanted: 20 }],
            ['RETIRED', { name: 'Earliest beans', seedSource: "Johnny's", lotNumber: 'L-14' }],
        ])("sends a %s planting's own fields on Update, then locks and reloads", async (currentStatus, body) => {
            const { wrapper, store } = await mountPage({ planting: aPlanting({ currentStatus }) });
            await wrapper.find('.v-switch input').setValue(true);
            await edit(wrapper, 'name', 'Earliest beans');

            await buttonLabelled(wrapper, 'Update').trigger('click');
            await flushPromises();

            expect(store.updatePlanting).toHaveBeenCalledWith('planting-1', body);
            expect(wrapper.findComponent(PlantingDetailsTab).props('enableEdit')).toBe(false);
            expect(store.fetchPlantingById).toHaveBeenCalledTimes(2);
        });

        // A date picked in the details tab is a Date; it goes out as the day
        // picked, YYYY-MM-DD, not its UTC instant (backlog B19)
        it('sends a date picked in the details tab as the day picked', async () => {
            const { wrapper, store } = await mountPage({ planting: aPlanting({ currentStatus: 'STARTED' }) });
            await wrapper.find('.v-switch input').setValue(true);
            await edit(wrapper, 'sowDate', new Date(2026, 3, 22));

            await buttonLabelled(wrapper, 'Update').trigger('click');

            expect(store.updatePlanting.mock.calls[0][1].sowDate).toBe('2026-04-22');
        });

        it('sends the edits made in the details tab', async () => {
            const { wrapper, store } = await mountPage();
            await wrapper.find('.v-switch input').setValue(true);
            await edit(wrapper, 'name', 'Earliest beans');

            await buttonLabelled(wrapper, 'Update').trigger('click');

            expect(store.updatePlanting.mock.calls[0][1].name).toBe('Earliest beans');
        });

        // The store's alert says why; the edits stay, unlocked, to fix and send again
        it('stays unlocked, with the edits, and without reloading, when the Update fails', async () => {
            const { wrapper, store } = await mountPage();
            store.updatePlanting.mockRejectedValue(httpError(400));
            await wrapper.find('.v-switch input').setValue(true);
            await edit(wrapper, 'name', 'Earliest beans');

            await buttonLabelled(wrapper, 'Update').trigger('click');
            await flushPromises();

            expect(store.updatePlanting).toHaveBeenCalledTimes(1);
            expect(wrapper.findComponent(PlantingDetailsTab).props('enableEdit')).toBe(true);
            expect(wrapper.findComponent(PlantingDetailsTab).props('planting').name).toBe('Earliest beans');
            expect(store.fetchPlantingById).toHaveBeenCalledTimes(1);
        });

        // A field put back as it was is no edit, and a date picked as a Date
        // is the same day as the service's string (backlog B26)
        it('offers Update only while something differs from the planting', async () => {
            const { wrapper } = await mountPage({ planting: aPlanting({ currentStatus: 'STARTED' }) });
            await wrapper.find('.v-switch input').setValue(true);

            await edit(wrapper, 'name', 'Earliest beans');
            expect(updateEnabled(wrapper)).toBe(true);
            await edit(wrapper, 'name', 'Early beans');
            expect(updateEnabled(wrapper)).toBe(false);

            await edit(wrapper, 'sowDate', new Date(2026, 3, 20));
            expect(updateEnabled(wrapper)).toBe(false);
            await edit(wrapper, 'sowDate', new Date(2026, 3, 21));
            expect(updateEnabled(wrapper)).toBe(true);
        });
    });
});
