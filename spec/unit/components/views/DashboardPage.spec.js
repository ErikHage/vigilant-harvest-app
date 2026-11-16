import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import DashboardPage from '@/components/views/DashboardPage.vue';
import DashboardNavDrawer from '@/components/layout/DashboardNavDrawer.vue';
import { useCommonStore } from '@/store';
import { mountInLayout } from '../../../helpers/layout';
import { linkRouter } from '../../../helpers/routers';

const year2026 = { plantingYear: 2026, lastFrostDate: '2026-05-10', firstFrostDate: '2026-10-12' };

async function mountDashboard(common) {
    const router = linkRouter();
    const pinia = createTestingPinia({ initialState: { common } });

    const wrapper = mountInLayout(DashboardPage, { global: { plugins: [router, pinia] } });
    await flushPromises();
    return { wrapper, store: useCommonStore(pinia) };
}

describe('DashboardPage', () => {
    it('loads the planting years', async () => {
        const { store } = await mountDashboard({ plantingYear: 2026 });

        expect(store.fetchPlantingYears).toHaveBeenCalledTimes(1);
    });

    // Not which: the app bar before the drawer had a prop for it that it never read (backlog B12)
    it('tells the drawer a year is selected', async () => {
        const { wrapper } = await mountDashboard({ plantingYear: 2026, selectedPlantingYear: year2026 });

        const drawer = wrapper.findComponent(DashboardNavDrawer);
        expect(drawer.props()).toEqual({ isPlantingYearSelected: true });
    });

    it('tells the drawer when no year is selected', async () => {
        const { wrapper } = await mountDashboard({ plantingYear: null });

        expect(wrapper.findComponent(DashboardNavDrawer).props('isPlantingYearSelected')).toBe(false);
    });

    it("shows the common store's alert", async () => {
        const { wrapper } = await mountDashboard({
            plantingYear: 2026,
            alertVisible: true,
            alertType: 'error',
            alertMessage: 'error fetching planting years',
        });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching planting years');
    });
});
