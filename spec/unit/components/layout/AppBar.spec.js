import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AppBar from '@/components/layout/AppBar.vue';
import { useAuthenticationStore } from '@/store';
import { mountInLayout } from '../../../helpers/layout';
import { buttonLabelled } from '../../../helpers/fields';
import { linkRouter, linkPaths } from '../../../helpers/routers';
import { onADesktop, onAPhone } from '../../../helpers/display';

function mountAppBar({ showAppBar = true, plantingYear = 2026 } = {}) {
    const router = linkRouter();
    vi.spyOn(router, 'push');

    const wrapper = mountInLayout(AppBar, {
        global: {
            plugins: [
                router,
                createTestingPinia({
                    initialState: {
                        authentication: { showAppBar },
                        common: { plantingYear },
                    },
                }),
            ],
        },
    });
    return { wrapper, router, store: useAuthenticationStore() };
}

describe('AppBar', () => {
    afterEach(() => {
        onADesktop();
        vi.restoreAllMocks();
    });

    describe('on a desktop', () => {
        it('shows the title, the planting year, Dashboard and Logout when logged in', () => {
            const { wrapper } = mountAppBar();

            expect(wrapper.text()).toContain('Vigilant Harvest');
            expect(wrapper.find('.planting-year').text()).toBe('2026');
            expect(buttonLabelled(wrapper, 'Dashboard').exists()).toBe(true);
            expect(buttonLabelled(wrapper, 'Logout').exists()).toBe(true);
            expect(linkPaths(wrapper)).toEqual(['/dashboard']);
        });

        it('shows only the title when logged out', () => {
            const { wrapper } = mountAppBar({ showAppBar: false });

            expect(wrapper.text()).toBe('Vigilant Harvest');
        });

        it('hides the planting year when none is selected', () => {
            const { wrapper } = mountAppBar({ plantingYear: null });

            expect(wrapper.find('.planting-year').exists()).toBe(false);
        });
    });

    describe('on a phone', () => {
        beforeEach(() => {
            onAPhone();
        });

        it('shows a home button, the planting year and Logout when logged in', () => {
            const { wrapper } = mountAppBar();

            expect(wrapper.text()).not.toContain('Vigilant Harvest');
            expect(wrapper.find('.planting-year').text()).toBe('2026');
            expect(wrapper.find('.mdi-home').exists()).toBe(true);
            expect(linkPaths(wrapper)).toEqual(['/dashboard']);
            expect(buttonLabelled(wrapper, 'Logout').exists()).toBe(true);
        });

        // As on a desktop (backlog A12)
        it('shows neither the home button nor Logout when logged out', () => {
            const { wrapper } = mountAppBar({ showAppBar: false });

            expect(wrapper.find('.planting-year').exists()).toBe(false);
            expect(wrapper.find('.mdi-home').exists()).toBe(false);
            expect(wrapper.findAll('.v-btn').map(button => button.text())).not.toContain('Logout');
        });
    });

    it('logs out, then goes to the login page', async () => {
        const { wrapper, router, store } = mountAppBar();
        let pushedBeforeLogoutFinished;
        store.logout.mockImplementation(async () => {
            await Promise.resolve();
            pushedBeforeLogoutFinished = router.push.mock.calls.length > 0;
        });

        await buttonLabelled(wrapper, 'Logout').trigger('click');
        await flushPromises();

        expect(store.logout).toHaveBeenCalledTimes(1);
        expect(pushedBeforeLogoutFinished).toBe(false);
        expect(router.push).toHaveBeenCalledWith('/');
    });
});
