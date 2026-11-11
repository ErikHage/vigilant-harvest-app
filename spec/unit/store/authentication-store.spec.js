import { createPinia, setActivePinia } from 'pinia';
import { useAuthenticationStore } from '@/store';
import authenticationApi from '@/api/authentication-api';
import { tokenFor } from '../../helpers/tokens';
import { httpError } from '../../helpers/http-errors';

// Automocked, so the module keeps its real exports: verifySsoToken,
// verifyActorToken and logout
vi.mock('@/api/authentication-api');

// jsdom can't navigate to another page, and its window.location can't be
// replaced. It does navigate within a page by fragment, so the auth app's
// URL is pointed at a fragment of the test page, where the redirect can be
// read back
vi.mock('@/utils/constants', async importOriginal => ({
    ...await importOriginal(),
    feralAuthenticationAppUrl: `${window.location.origin}/#feral-auth`,
}));

const tokenKey = 'vigilant-token';

// A store created after `token` was stored, as on a reload
function storeWith(token) {
    localStorage.setItem(tokenKey, token);
    setActivePinia(createPinia());
    return useAuthenticationStore();
}

describe('useAuthenticationStore', () => {
    let store;
    let consoleError;

    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
        store = useAuthenticationStore();
        vi.useFakeTimers();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    describe('initial state', () => {
        it('starts logged out, with no app bar, when no token is stored', () => {
            expect(store.isAuthenticated).toBe(false);
            expect(store.showAppBar).toBe(false);
        });

        it('shows the app bar when a token is stored', () => {
            store = storeWith('a-token');

            expect(store.showAppBar).toBe(true);
        });

        // As in feral-authentication: a stored token counts only once the
        // router guard has verified it
        it('is not authenticated until the stored token is verified', () => {
            store = storeWith('a-token');

            expect(store.isAuthenticated).toBe(false);
        });
    });

    describe('redirectForSso', () => {
        it("sends the browser to the auth app's login page, naming this application", () => {
            store.redirectForSso();

            expect(window.location.href).toBe(
                `${window.location.origin}/#feral-auth/login?app=test-application-id`);
        });
    });

    describe('authenticate', () => {
        it('exchanges the SSO token, stores the actor token, and logs in', async () => {
            authenticationApi.verifySsoToken.mockResolvedValue('actor-token');

            await store.authenticate('sso-token');

            expect(authenticationApi.verifySsoToken).toHaveBeenCalledWith('sso-token');
            expect(localStorage.getItem(tokenKey)).toBe('actor-token');
            expect(store.isAuthenticated).toBe(true);
            expect(store.showAppBar).toBe(true);
            expect(store.alertVisible).toBe(false);
        });

        it('shows an alert, logs, and stays logged out, when the exchange fails', async () => {
            const err = httpError(401);
            authenticationApi.verifySsoToken.mockRejectedValue(err);

            await store.authenticate('sso-token');

            expect(store.isAuthenticated).toBe(false);
            expect(store.showAppBar).toBe(false);
            expect(localStorage.getItem(tokenKey)).toBeNull();
            expect(store.alertMessage).toBe('error authenticating sso token');
            expect(store.alertType).toBe('error');
            expect(consoleError).toHaveBeenCalledWith(err);
        });
    });

    describe('verifyToken', () => {
        it.each([true, false])('sets isAuthenticated to %s, as the service answers', async answer => {
            authenticationApi.verifyActorToken.mockResolvedValue(answer);
            store = storeWith('a-token');

            await store.verifyToken();

            expect(authenticationApi.verifyActorToken).toHaveBeenCalledWith('a-token');
            expect(store.isAuthenticated).toBe(answer);
        });

        it('asks about a null token when none is stored', async () => {
            authenticationApi.verifyActorToken.mockResolvedValue(false);

            await store.verifyToken();

            expect(authenticationApi.verifyActorToken).toHaveBeenCalledWith(null);
        });
    });

    describe('logout', () => {
        beforeEach(async () => {
            authenticationApi.verifyActorToken.mockResolvedValue(true);
            store = storeWith('a-token');
            await store.verifyToken();
        });

        it('clears the token and logs out locally', async () => {
            await store.logout();

            expect(localStorage.getItem(tokenKey)).toBeNull();
            expect(store.isAuthenticated).toBe(false);
            expect(store.showAppBar).toBe(false);
        });

        it('ends the session on the service, and shows no alert', async () => {
            authenticationApi.logout.mockResolvedValue();

            await store.logout();

            expect(authenticationApi.logout).toHaveBeenCalledWith('a-token');
            expect(store.alertVisible).toBe(false);
            expect(consoleError).not.toHaveBeenCalled();
        });

        it('shows no alert when the service had already ended the session (401)', async () => {
            authenticationApi.logout.mockRejectedValue(httpError(401));

            await store.logout();

            expect(store.alertVisible).toBe(false);
            expect(localStorage.getItem(tokenKey)).toBeNull();
        });

        it('shows "error logging out" when the service fails, and still logs out locally', async () => {
            const err = httpError(500);
            authenticationApi.logout.mockRejectedValue(err);

            await store.logout();

            expect(store.alertType).toBe('error');
            expect(store.alertMessage).toBe('error logging out');
            expect(consoleError).toHaveBeenCalledWith(err);
            expect(localStorage.getItem(tokenKey)).toBeNull();
            expect(store.isAuthenticated).toBe(false);
        });
    });

    describe('tokenPresent', () => {
        it('is true when a token is stored', () => {
            store = storeWith('a-token');

            expect(store.tokenPresent()).toBe(true);
        });

        it('is false when none is', () => {
            expect(store.tokenPresent()).toBe(false);
        });
    });

    describe('clearToken', () => {
        it('removes the stored token', () => {
            store = storeWith('a-token');

            store.clearToken();

            expect(localStorage.getItem(tokenKey)).toBeNull();
        });
    });

    describe('actor', () => {
        it("is the stored token's payload", () => {
            store = storeWith(tokenFor({ userId: 'user-1', username: 'gardener' }));

            expect(store.actor).toEqual({ userId: 'user-1', username: 'gardener' });
        });

        it('is null when no token is stored', () => {
            expect(store.actor).toBeNull();
        });

        // DocumentsCurrentBehavior: the getter reads localStorage, which isn't
        // reactive, so Pinia computes it once and keeps it. After a logout and a
        // new login without a reload, actor is still the first user. Should
        // follow the token. Nothing in the app reads actor today
        it('stays the first token it read, after the token changes', () => {
            store = storeWith(tokenFor({ userId: 'user-1' }));
            expect(store.actor).toEqual({ userId: 'user-1' });

            store.clearToken();
            localStorage.setItem(tokenKey, tokenFor({ userId: 'user-2' }));

            expect(store.actor).toEqual({ userId: 'user-1' });
        });
    });
});
