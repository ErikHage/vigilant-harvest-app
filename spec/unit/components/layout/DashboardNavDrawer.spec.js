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

// The headings, and the text and path of each link, in the drawer's order
function drawerContents(wrapper) {
    return wrapper.findAll('.v-navigation-drawer .v-list-subheader, .v-navigation-drawer a[href]')
        .map(item => (item.element.tagName === 'A' ? [item.text(), item.attributes('href')] : item.text()));
}

const allContents = [
    'Planning',
    ['Plan', '/dashboard/planning'],
    'Garden',
    ['Overview', '/dashboard/garden'],
    ['Plots', '/dashboard/plots'],
    ['Plants', '/dashboard/plants'],
    ['Plantings', '/dashboard/plantings'],
    ['Harvests', '/dashboard/harvests'],
    'Recordkeeping',
    ['Journal', '/dashboard/journal'],
    ['Activity Log', '/dashboard/activity-log'],
    ['Stats', '/dashboard/stats'],
    'Config',
    ['Years', '/dashboard/planting-years'],
    ['Categories', '/dashboard/categories'],
    ['Activity Schedules', '/dashboard/activity-schedules'],
];

const allLinks = allContents.filter(item => Array.isArray(item));

// Whether Vuetify made the drawer inert. jsdom has no `inert` property, so Vue
// writes the value as an attribute, "true" or "false"; a browser gets the
// property, and only a true one
function isInert(wrapper) {
    return wrapper.find('.v-navigation-drawer').attributes('inert') === 'true';
}

describe('DashboardNavDrawer', () => {
    afterEach(() => {
        onADesktop();
        document.body.innerHTML = '';
    });

    describe('on a desktop', () => {
        it('links to each page, grouped under headings', async () => {
            const { wrapper } = await mountDrawer();

            expect(drawerContents(wrapper)).toEqual(allContents);
            expect(wrapper.find('.v-navigation-drawer').classes()).not.toContain('v-navigation-drawer--rail');
        });

        it('gives each page an icon', async () => {
            const { wrapper } = await mountDrawer();

            expect(wrapper.findAll('.v-navigation-drawer a[href] .v-icon')).toHaveLength(allLinks.length);
        });

        // Plan, Overview, Plantings, Harvests, Journal, Activity Log and Stats
        // need one (backlog A11). A group left empty loses its heading
        it('hides the year-specific pages with no planting year selected', async () => {
            const { wrapper } = await mountDrawer({ isPlantingYearSelected: false });

            expect(drawerContents(wrapper)).toEqual([
                'Garden',
                ['Plots', '/dashboard/plots'],
                ['Plants', '/dashboard/plants'],
                'Config',
                ['Years', '/dashboard/planting-years'],
                ['Categories', '/dashboard/categories'],
                ['Activity Schedules', '/dashboard/activity-schedules'],
            ]);
        });

        it('shows a rail of the same links, with a divider between groups for the headings', async () => {
            const { wrapper } = await mountDrawer({ navigation: { isRail: true } });

            expect(wrapper.find('.v-navigation-drawer').classes()).toContain('v-navigation-drawer--rail');
            expect(drawerLinks(wrapper).map(([, path]) => path)).toEqual(allLinks.map(([, path]) => path));
            expect(wrapper.find('.v-list-subheader').exists()).toBe(false);
            expect(wrapper.findAll('.v-navigation-drawer .v-divider')).toHaveLength(3);
        });

        it('has no dividers when expanded', async () => {
            const { wrapper } = await mountDrawer();

            expect(wrapper.find('.v-navigation-drawer .v-divider').exists()).toBe(false);
        });

        it('stays open when a link is followed', async () => {
            const { wrapper } = await mountDrawer();

            await wrapper.find('a[href="/dashboard/stats"]').trigger('click');
            await flushPromises();

            expect(wrapper.find('.v-navigation-drawer').classes()).toContain('v-navigation-drawer--active');
        });

        it('is never inert, expanded or as a rail', async () => {
            expect(isInert((await mountDrawer()).wrapper)).toBe(false);
            expect(isInert((await mountDrawer({ navigation: { isRail: true } })).wrapper)).toBe(false);
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

        // Vuetify's doing: off screen, the closed drawer's links are out of the
        // tab order and the accessibility tree. Playwright's role locators
        // don't honour inert, so the UI suite can't see this
        it('is inert while closed, and not once opened', async () => {
            const { wrapper, store } = await mountDrawer();
            expect(isInert(wrapper)).toBe(true);

            store.setOpenOnPhone(true);
            await flushPromises();

            expect(isInert(wrapper)).toBe(false);
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
