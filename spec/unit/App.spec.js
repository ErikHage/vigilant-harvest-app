import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createFeralVuetifyOptions } from '@feral-auth/vue-components';
import { RouterView, createMemoryHistory, createRouter } from 'vue-router';
import App from '@/App.vue';
import { useAuthenticationStore, useCommonStore } from '@/store';

// Every path shows a page that says where it is, and counts its mounts, so a
// spec can see which one the app shows, and whether switching frames
// remounted it. As in the app, the dashboard's pages are the children of one
// parent route, its own page the empty one, and they need someone signed on
let mounts;
function pagesRouter() {
    const page = {
        render() { return `the page at ${this.$route.path}`; },
        mounted() { mounts += 1; },
    };
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/dashboard',
                component: RouterView,
                meta: { requiresAuthenticated: true },
                children: [
                    { path: '', component: page },
                    { path: ':path(.*)*', component: page },
                ],
            },
            { path: '/:path(.*)*', component: page, meta: { requiresAuthenticated: false } },
        ],
    });
}

// The app as main.js makes it: the feral themes, which FrAppShell switches between
async function mountApp({ showAppBar = true, plantingYear = 2026, path = '/dashboard/plants' } = {}) {
    mounts = 0;
    const router = pagesRouter();
    await router.push(path);
    const pinia = createTestingPinia({
        initialState: { authentication: { showAppBar }, common: { plantingYear } },
    });
    const vuetify = createVuetify(createFeralVuetifyOptions({ components, directives }));
    const wrapper = mount(App, { global: { plugins: [router, pinia, vuetify] }, attachTo: document.body });
    await flushPromises();
    return { wrapper, router, store: useAuthenticationStore(pinia), common: useCommonStore(pinia) };
}

const drawerLinks = wrapper => wrapper.findAll('nav#app-nav .v-list-item').map(link => link.attributes('aria-label'));

describe('App', () => {
    beforeEach(() => {
        localStorage.clear();
        // as index.html sets it: FrAppShell names the window after it
        document.title = 'Vigilant Harvest';
    });

    describe('off the pages that need someone signed on', () => {
        it("shows only the app's name: no drawer, and no buttons", async () => {
            const { wrapper } = await mountApp({ showAppBar: false, path: '/' });

            expect(wrapper.find('.v-toolbar-title').text()).toBe('Vigilant Harvest');
            expect(wrapper.findComponent({ name: 'FrAppShell' }).exists()).toBe(false);
            expect(wrapper.find('nav').exists()).toBe(false);
            expect(wrapper.find('.v-app-bar').findAll('button')).toHaveLength(0);
        });

        it('shows no planting year', async () => {
            const { wrapper } = await mountApp({ showAppBar: false, path: '/' });

            expect(wrapper.find('.planting-year').exists()).toBe(false);
        });

        it('shows the page in the main area', async () => {
            const { wrapper } = await mountApp({ showAppBar: false, path: '/' });

            expect(wrapper.find('main.v-main').text()).toBe('the page at /');
        });
    });

    describe('on the pages that need someone signed on', () => {
        it('runs in FrAppShell, named Feral over Vigilant Harvest', async () => {
            const { wrapper } = await mountApp();
            const shell = wrapper.findComponent({ name: 'FrAppShell' });

            expect(shell.props()).toMatchObject({ title: 'Feral', subtitle: 'Vigilant Harvest', storagePrefix: 'vigilant-harvest' });
            expect(wrapper.find('nav#app-nav').text()).toContain('Vigilant Harvest');
        });

        it('links to every page in the drawer with a planting year', async () => {
            const { wrapper } = await mountApp();

            expect(drawerLinks(wrapper)).toEqual([
                'Dashboard', 'Plan',
                'Overview', 'Plots', 'Plants', 'Plantings', 'Harvests',
                'Journal', 'Activity Log', 'Stats',
                'Years', 'Categories', 'Activity Schedules',
            ]);
        });

        it('leaves the year-specific pages out of the drawer with no planting year', async () => {
            const { wrapper } = await mountApp({ plantingYear: null });

            expect(drawerLinks(wrapper)).toEqual(['Dashboard', 'Plots', 'Plants', 'Years', 'Categories', 'Activity Schedules']);
        });

        it('adds the year-specific pages once a year is chosen', async () => {
            const { wrapper, common } = await mountApp({ plantingYear: null });

            common.plantingYear = 2026;
            await flushPromises();

            expect(drawerLinks(wrapper)).toContain('Plan');
            expect(drawerLinks(wrapper)).toHaveLength(13);
        });

        it("marks the page's link, or the link it's under", async () => {
            const { wrapper, router } = await mountApp({ path: '/dashboard/plants/p-1/details' });

            expect(wrapper.find('#nav-PlantsPage').attributes('aria-current')).toBe('page');

            await router.push('/dashboard');
            await flushPromises();
            expect(wrapper.find('#nav-DashboardDefaultPage').attributes('aria-current')).toBe('page');
            expect(wrapper.find('#nav-PlantsPage').attributes('aria-current')).toBeUndefined();
        });

        // Every page is under the dashboard's route, which Vue Router counts
        // as active on all of them unless the link is exact (library 0.6.3)
        it("highlights only the page's link, not Dashboard as well", async () => {
            const { wrapper } = await mountApp({ path: '/dashboard/plants/p-1/details' });
            const highlighted = wrapper.findAll('nav#app-nav .v-list-item--active').map(link => link.attributes('aria-label'));

            expect(highlighted).toEqual(['Plants']);
        });

        it("names the window after the page's link", async () => {
            await mountApp({ path: '/dashboard/plants' });

            expect(document.title).toBe('Plants - Vigilant Harvest');
        });

        it('shows the planting year in the toolbar', async () => {
            const { wrapper } = await mountApp({ plantingYear: 2026 });

            expect(wrapper.find('.v-app-bar .planting-year').text()).toBe('2026');
        });

        it('shows no planting year with none selected', async () => {
            const { wrapper } = await mountApp({ plantingYear: null });

            expect(wrapper.find('.planting-year').exists()).toBe(false);
        });

        it("shows the user's menu, under a placeholder name", async () => {
            const { wrapper } = await mountApp();

            expect(wrapper.find('.v-app-bar button[aria-label="Account: Gardener"]').text()).toBe('G');
        });

        it('logs out from the menu, and goes to the login page', async () => {
            const { wrapper, router, store } = await mountApp();
            await wrapper.find('button[aria-label="Account: Gardener"]').trigger('click');
            await flushPromises();

            const logout = [...document.querySelectorAll('.fr-app-user-menu .v-list-item')]
                .find(item => item.textContent.includes('Logout'));
            logout.click();
            await flushPromises();

            expect(store.logout).toHaveBeenCalledOnce();
            await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'));
        });

        it("shows the page in the shell's main area, and the next one when the route changes", async () => {
            const { wrapper, router } = await mountApp({ path: '/dashboard' });
            expect(wrapper.find('main#app-main').text()).toBe('the page at /dashboard');

            await router.push('/dashboard/plots');
            await flushPromises();

            expect(wrapper.find('main#app-main').text()).toBe('the page at /dashboard/plots');
        });

        it('switches frames as the route moves on and off them', async () => {
            const { wrapper, router } = await mountApp({ path: '/landing' });
            expect(wrapper.findComponent({ name: 'FrAppShell' }).exists()).toBe(false);

            await router.push('/dashboard');
            await flushPromises();
            expect(wrapper.findComponent({ name: 'FrAppShell' }).exists()).toBe(true);

            await router.push('/');
            await flushPromises();
            expect(wrapper.findComponent({ name: 'FrAppShell' }).exists()).toBe(false);
            expect(wrapper.find('.v-toolbar-title').text()).toBe('Vigilant Harvest');
        });
    });

    // Switching frames remounts the page
    describe('as the store signs on and off', () => {
        it('leaves the landing page in its frame, unmounted, as it signs on', async () => {
            const { wrapper, store } = await mountApp({ showAppBar: false, path: '/landing' });

            store.showAppBar = true;
            await flushPromises();

            expect(wrapper.findComponent({ name: 'FrAppShell' }).exists()).toBe(false);
            expect(mounts).toBe(1);
        });

        it('leaves a dashboard page in the shell, unmounted, as it logs out', async () => {
            const { wrapper, store } = await mountApp({ path: '/dashboard/plants' });

            store.showAppBar = false;
            await flushPromises();

            expect(wrapper.findComponent({ name: 'FrAppShell' }).exists()).toBe(true);
            expect(mounts).toBe(1);
        });
    });
});
