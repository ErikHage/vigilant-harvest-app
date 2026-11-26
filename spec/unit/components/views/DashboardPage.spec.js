import { h } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { RouterView } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import DashboardPage from '@/components/views/DashboardPage.vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { useCommonStore } from '@/store';
import { mountWithPlugins } from '../../../helpers/mount';

const year2026 = { plantingYear: 2026, lastFrostDate: '2026-05-10', firstFrostDate: '2026-10-12' };

// The dashboard with one child page that says what it is
async function mountDashboard(common) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', component: DashboardPage, children: [{ path: '', component: { render: () => 'the page' } }] }],
    });
    await router.push('/');
    const pinia = createTestingPinia({ initialState: { common } });

    const wrapper = mountWithPlugins({ render: () => h(RouterView) }, { global: { plugins: [router, pinia] } });
    await flushPromises();
    return { wrapper, store: useCommonStore(pinia) };
}

describe('DashboardPage', () => {
    it('loads the planting years', async () => {
        const { store } = await mountDashboard({ plantingYear: 2026 });

        expect(store.fetchPlantingYears).toHaveBeenCalledTimes(1);
    });

    it('shows the page, with no drawer or container of its own: the shell has them', async () => {
        const { wrapper } = await mountDashboard({ plantingYear: 2026, selectedPlantingYear: year2026 });

        expect(wrapper.text()).toContain('the page');
        expect(wrapper.find('.v-navigation-drawer').exists()).toBe(false);
        expect(wrapper.find('.v-container').exists()).toBe(false);
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
