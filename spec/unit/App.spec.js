import { createMemoryHistory, createRouter } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import { mountWithPlugins } from '../helpers/mount';
import App from '@/App.vue';

// Two pages that say which they are, so a spec can see which one the app
// shows
function pagesRouter() {
    const page = name => ({ render: () => name });
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', component: page('the landing page') },
            { path: '/dashboard', component: page('the dashboard') },
        ],
    });
}

async function mountApp(path = '/') {
    const router = pagesRouter();
    await router.push(path);
    const wrapper = mountWithPlugins(App, {
        global: {
            plugins: [
                router,
                createTestingPinia({ initialState: { authentication: { showAppBar: true } } }),
            ],
        },
    });
    return { wrapper, router };
}

describe('App', () => {
    it('shows the app bar, and the current page in the main area', async () => {
        const { wrapper } = await mountApp('/dashboard');

        expect(wrapper.find('header.v-app-bar').text()).toContain('Vigilant Harvest');
        expect(wrapper.find('main.v-main').text()).toBe('the dashboard');
    });

    it('shows the next page when the route changes', async () => {
        const { wrapper, router } = await mountApp('/');
        expect(wrapper.find('main.v-main').text()).toBe('the landing page');

        await router.push('/dashboard');

        expect(wrapper.find('main.v-main').text()).toBe('the dashboard');
    });
});
