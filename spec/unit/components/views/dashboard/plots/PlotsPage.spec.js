import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PlotsPage from '@/components/views/dashboard/plots/PlotsPage.vue';
import PlotsTable from '@/components/plots/PlotsTable.vue';
import UpsertPlotDialog from '@/components/plots/UpsertPlotDialog.vue';
import { usePlotsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../../../helpers/dialogs';

const plots = [
    { plotId: 'plot-1', friendlyName: 'North bed', lengthInInches: 120, widthInInches: 36, plotType: 'Bed', isActive: true },
    { plotId: 'plot-2', friendlyName: 'South bed', lengthInInches: 96, widthInInches: 48, plotType: 'Raised Bed', isActive: true },
];

async function mountPage(state = {}) {
    const pinia = createTestingPinia({ initialState: { plots: { plots, ...state } } });
    const wrapper = mountWithPlugins(PlotsPage, { global: { plugins: [pinia] }, attachTo: document.body });
    await flushPromises();
    return { wrapper, store: usePlotsStore(pinia) };
}

describe('PlotsPage', () => {
    it('loads the plots, and lists them', async () => {
        const { wrapper, store } = await mountPage();

        expect(wrapper.find('.page-title').text()).toBe('Manage Plots');
        expect(store.fetchPlots).toHaveBeenCalledTimes(1);
        expect(wrapper.findComponent(PlotsTable).props('plots')).toHaveLength(2);
    });

    it('reloads on Refresh', async () => {
        const { wrapper, store } = await mountPage();

        await buttonLabelled(wrapper, 'Refresh').trigger('click');

        expect(store.fetchPlots).toHaveBeenCalledTimes(2);
    });

    it('filters the table by the search', async () => {
        const { wrapper } = await mountPage();

        await inputLabelled(wrapper, 'Search...').setValue('north');

        expect(wrapper.findComponent(PlotsTable).props('searchFilter')).toBe('north');
        expect(wrapper.text()).toContain('1 of 2 plots');
    });

    it('opens the dialog to add a plot', async () => {
        const { wrapper } = await mountPage();

        await buttonLabelled(wrapper, 'Add').trigger('click');
        await flushPromises();

        expect(findDialog('Add Plot')).toBeDefined();
        expect(wrapper.findComponent(UpsertPlotDialog).props('plot')).toBeNull();
    });

    it("opens the dialog to edit a row's plot", async () => {
        const { wrapper } = await mountPage();

        await wrapper.findAll('tbody tr')[0].find('.mdi-pencil').trigger('click');
        await flushPromises();

        expect(findDialog('Edit Plot')).toBeDefined();
        expect(wrapper.findComponent(UpsertPlotDialog).props('plot')).toEqual(plots[0]);
    });

    it('saves the plot, closes the dialog, and reloads', async () => {
        const { wrapper, store } = await mountPage();
        await wrapper.findAll('tbody tr')[0].find('.mdi-pencil').trigger('click');
        await flushPromises();

        await buttonLabelled(dialogTitled('Edit Plot'), 'Update').trigger('click');
        await flushPromises();

        expect(store.upsertPlot).toHaveBeenCalledWith(plots[0]);
        expect(document.querySelector('.v-overlay--active')).toBeNull();
        expect(wrapper.findComponent(UpsertPlotDialog).props('plot')).toBeNull();
        expect(store.fetchPlots).toHaveBeenCalledTimes(2);
    });

    it('closes the dialog, and forgets the plot, on Cancel', async () => {
        const { wrapper } = await mountPage();
        await wrapper.findAll('tbody tr')[0].find('.mdi-pencil').trigger('click');
        await flushPromises();

        await buttonLabelled(dialogTitled('Edit Plot'), 'Cancel').trigger('click');
        await flushPromises();

        expect(document.querySelector('.v-overlay--active')).toBeNull();
        expect(wrapper.findComponent(UpsertPlotDialog).props('plot')).toBeNull();
    });

    it("shows the plots store's alert", async () => {
        const { wrapper } = await mountPage({ alertVisible: true, alertType: 'error', alertMessage: 'error upserting plot' });

        expect(wrapper.find('.v-alert').text()).toBe('error upserting plot');
    });
});
