import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import LoginPage from '@/components/views/LoginPage.vue';
import { useAuthenticationStore } from '@/store';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';

// Mounts the page, with `verified` as the service's answer about a stored
// token, if there is one
async function mountLoginPage({ tokenStored = false, verified = false, authentication = {} } = {}) {
    const pinia = createTestingPinia({ initialState: { authentication } });
    const store = useAuthenticationStore(pinia);
    store.tokenPresent.mockReturnValue(tokenStored);
    store.verifyToken.mockImplementation(async () => {
        store.isAuthenticated = verified;
    });
    const $router = { push: vi.fn() };

    const wrapper = mountWithPlugins(LoginPage, {
        global: { plugins: [pinia], mocks: { $router } },
    });
    await flushPromises();
    return { wrapper, store, $router };
}

describe('LoginPage', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the title, the logo and the sign-on button', async () => {
        const { wrapper } = await mountLoginPage();

        expect(wrapper.find('h1').text()).toBe('Vigilant Harvest');
        expect(wrapper.find('h3').text()).toBe('An Online Garden Tracker');
        expect(wrapper.find('.v-img img').attributes('src')).toBe('/assets-test/ai-owl.jpg');
        expect(wrapper.find('.v-card-title').text()).toBe('Authenticate with Identity Provider');
        expect(buttonLabelled(wrapper, 'SSO').exists()).toBe(true);
    });

    it('sends the browser to sign on when SSO is pressed', async () => {
        const { wrapper, store } = await mountLoginPage();

        await buttonLabelled(wrapper, 'SSO').trigger('click');

        expect(store.redirectForSso).toHaveBeenCalledTimes(1);
    });

    it('stays put, without asking the service, when no token is stored', async () => {
        const { store, $router } = await mountLoginPage();

        expect(store.verifyToken).not.toHaveBeenCalled();
        expect($router.push).not.toHaveBeenCalled();
    });

    it('goes to the dashboard when the stored token is accepted', async () => {
        const { store, $router } = await mountLoginPage({ tokenStored: true, verified: true });

        expect(store.verifyToken).toHaveBeenCalledTimes(1);
        expect($router.push).toHaveBeenCalledWith('/dashboard');
        expect(store.clearToken).not.toHaveBeenCalled();
    });

    it('clears a stored token the service rejects, and stays put', async () => {
        const { store, $router } = await mountLoginPage({ tokenStored: true, verified: false });

        expect(store.clearToken).toHaveBeenCalledTimes(1);
        expect($router.push).not.toHaveBeenCalled();
    });

    // The store's verifyToken never rejects (authenticationApi.verifyActorToken
    // turns every failure into false), so this branch can't run in the app
    it('clears the stored token if verifying it throws', async () => {
        const pinia = createTestingPinia();
        const store = useAuthenticationStore(pinia);
        store.tokenPresent.mockReturnValue(true);
        store.verifyToken.mockRejectedValue(new Error('unexpected'));

        mountWithPlugins(LoginPage, { global: { plugins: [pinia], mocks: { $router: { push: vi.fn() } } } });
        await flushPromises();

        expect(store.clearToken).toHaveBeenCalledTimes(1);
    });

    // A failed sign-on, and a failed logout, both come back here
    it("shows the authentication store's alert", async () => {
        const { wrapper } = await mountLoginPage({
            authentication: { alertVisible: true, alertType: 'error', alertMessage: 'error authenticating sso token' },
        });

        expect(wrapper.find('.v-alert').text()).toBe('error authenticating sso token');
    });
});
