import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import DashboardNavDrawer from '@/components/layout/DashboardNavDrawer.vue';
import { useNavigationStore } from '@/store/navigation';
import { mountInLayout } from '../../../helpers/layout';
import { linkRouter } from '../../../helpers/routers';
import { onADesktop, onAPhone } from '../../../helpers/display';

async function mountDrawer({ isPlantingYearSelected = true, navigation = {} } = {}) {
    const router = linkRouter();
    await router.push('/dashboard');
    const pinia = createTestingPinia({ stubActions: false, initialState: { navigation } });

    const wrapper = mountInLayout(DashboardNavDrawer, {
        props: { isPlantingYearSelected },
        attachTo: document.body,
        global: { plugins: [router, pinia] },
    });
    await flushPromises();
    return { wrapper, router, store: useNavigationStore(pinia) };
}

// The text and path of each link in the drawer
function drawerLinks(wrapper) {
    return wrapper.findAll('.v-navigation-drawer a[href]').map(link => [link.text(), link.attributes('href')]);
}

const allLinks = [
    ['Planning', '/dashboard/planning'],
    ['Garden', '/dashboard/garden'],
    ['Journal', '/dashboard/journal'],
    ['Activity Log', '/dashboard/activity-log'],
    ['Plants', '/dashboard/plants'],
    ['Plots', '/dashboard/plots'],
    ['Years', '/dashboard/planting-years'],
    ['Plantings', '/dashboard/plantings'],
    ['Harvests', '/dashboard/harvests'],
    ['Stats', '/dashboard/stats'],
    ['Categories', '/dashboard/categories'],
    ['Activity Schedules', '/dashboard/activity-schedules'],
];

describe('DashboardNavDrawer', () => {
    afterEach(() => {
        onADesktop();
        document.body.innerHTML = '';
    });

    describe('on a desktop', () => {
        it('links to each page, with the admin pages under a heading', async () => {
            const { wrapper } = await mountDrawer();

            expect(drawerLinks(wrapper)).toEqual(allLinks);
            expect(wrapper.find('.v-list-subheader').text()).toBe('Admin');
            expect(wrapper.find('.v-navigation-drawer').classes()).not.toContain('v-navigation-drawer--rail');
        });

        it('gives each page an icon', async () => {
            const { wrapper } = await mountDrawer();

            expect(wrapper.findAll('.v-navigation-drawer a[href] .v-icon')).toHaveLength(allLinks.length);
        });

        // Planning, Garden, Plantings, Harvests and Stats need one (backlog A11)
        it('hides the year-specific pages with no planting year selected', async () => {
            const { wrapper } = await mountDrawer({ isPlantingYearSelected: false });

            expect(drawerLinks(wrapper)).toEqual([
                ['Plants', '/dashboard/plants'],
                ['Plots', '/dashboard/plots'],
                ['Years', '/dashboard/planting-years'],
                ['Categories', '/dashboard/categories'],
                ['Activity Schedules', '/dashboard/activity-schedules'],
            ]);
        });

        it('shows a rail of the same links, with a divider for the heading', async () => {
            const { wrapper } = await mountDrawer({ navigation: { isRail: true } });

            expect(wrapper.find('.v-navigation-drawer').classes()).toContain('v-navigation-drawer--rail');
            expect(drawerLinks(wrapper).map(([, path]) => path)).toEqual(allLinks.map(([, path]) => path));
            expect(wrapper.find('.v-list-subheader').exists()).toBe(false);
            expect(wrapper.find('.v-navigation-drawer .v-divider').exists()).toBe(true);
        });

        it('stays open when a link is followed', async () => {
            const { wrapper } = await mountDrawer();

            await wrapper.find('a[href="/dashboard/stats"]').trigger('click');
            await flushPromises();

            expect(wrapper.find('.v-navigation-drawer').classes()).toContain('v-navigation-drawer--active');
        });
    });

    describe('on a phone', () => {
        beforeEach(() => {
            onAPhone();
        });

        it('is hidden until opened, never as a rail', async () => {
            const { wrapper } = await mountDrawer({ navigation: { isRail: true } });

            const drawer = wrapper.find('.v-navigation-drawer');
            expect(drawer.classes()).not.toContain('v-navigation-drawer--active');
            expect(drawer.classes()).not.toContain('v-navigation-drawer--rail');
        });

        it('slides in over the page when opened, with every page', async () => {
            const { wrapper } = await mountDrawer({ navigation: { isOpenOnPhone: true } });

            const drawer = wrapper.find('.v-navigation-drawer');
            expect(drawer.classes()).toContain('v-navigation-drawer--active');
            expect(drawer.classes()).toContain('v-navigation-drawer--temporary');
            expect(drawerLinks(wrapper)).toEqual(allLinks);
        });

        it('closes when a link is followed', async () => {
            const { wrapper, store } = await mountDrawer({ navigation: { isOpenOnPhone: true } });

            await wrapper.find('a[href="/dashboard/stats"]').trigger('click');
            await flushPromises();

            expect(store.isOpenOnPhone).toBe(false);
        });
    });
});
