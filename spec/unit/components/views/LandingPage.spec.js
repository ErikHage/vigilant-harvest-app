import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import LandingPage from '@/components/views/LandingPage.vue';
import { useAuthenticationStore } from '@/store';
import { mountWithPlugins } from '../../../helpers/mount';

// The page reads ?sso= from the browser's address, not from the router
async function landWith(search, { signedOn = false } = {}) {
    window.history.replaceState({}, '', `/apps/vigilant-harvest/landing${search}`);
    const pinia = createTestingPinia();
    const store = useAuthenticationStore(pinia);
    store.authenticate.mockImplementation(async () => {
        store.isAuthenticated = signedOn;
    });
    const $router = { push: vi.fn() };

    const wrapper = mountWithPlugins(LandingPage, { global: { plugins: [pinia], mocks: { $router } } });
    await flushPromises();
    return { wrapper, store, $router };
}

describe('LandingPage', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        window.history.replaceState({}, '', '/');
        sessionStorage.clear();
        vi.restoreAllMocks();
    });

    it('shows nothing', async () => {
        const { wrapper } = await landWith('?sso=sso-token', { signedOn: true });

        expect(wrapper.text()).toBe('');
    });

    it('exchanges the SSO token, then goes to the dashboard', async () => {
        const { store, $router } = await landWith('?sso=sso-token', { signedOn: true });

        expect(store.authenticate).toHaveBeenCalledWith('sso-token');
        expect($router.push).toHaveBeenCalledWith('/dashboard');
    });

    // Where the guard found them going (backlog A9), once
    it('goes where they were going, once signed on', async () => {
        sessionStorage.setItem('sign-on-destination', '/dashboard/plants/plant-1/details?tab=growing');

        const { $router } = await landWith('?sso=sso-token', { signedOn: true });

        expect($router.push).toHaveBeenCalledWith('/dashboard/plants/plant-1/details?tab=growing');
        expect(sessionStorage.getItem('sign-on-destination')).toBeNull();
    });

    // Only the dashboard's pages, so the stored value can't send them elsewhere
    it.each(['https://example.invalid/', '//example.invalid/', '/landing', '/dashboards'])(
        'goes to the dashboard in place of %s', async destination => {
            sessionStorage.setItem('sign-on-destination', destination);

            const { $router } = await landWith('?sso=sso-token', { signedOn: true });

            expect($router.push).toHaveBeenCalledWith('/dashboard');
        });

    it('goes to the login page when the exchange fails', async () => {
        const { $router } = await landWith('?sso=sso-token', { signedOn: false });

        expect($router.push).toHaveBeenCalledWith('/');
    });

    it.each(['', '?other=1', '?sso='])('goes to the login page with no SSO token (%s)', async search => {
        const { store, $router } = await landWith(search);

        expect(store.authenticate).not.toHaveBeenCalled();
        expect($router.push).toHaveBeenCalledWith('/');
    });
});
