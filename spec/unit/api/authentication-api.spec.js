import axios from 'axios';
import authenticationApi from '@/api/authentication-api';
import { ApiError } from '@/api/error-handler';
import { httpError, noAnswer } from '../../helpers/http-errors';

vi.mock('axios', async importOriginal =>
    (await import('../../helpers/axios-mock')).axiosWithMockedRequests(importOriginal));

// The VITE_AUTH_SERVICE_V0_BASE_URL set in vitest.config.js
const authServiceUrl = 'https://api.test/feral-authentication-service/v0';

describe('authenticationApi', () => {
    let log;

    beforeEach(() => {
        log = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    describe('verifySsoToken', () => {
        it('exchanges the SSO token for an actor token, for this application', async () => {
            axios.post.mockResolvedValue({ data: { token: 'actor-token' } });

            const token = await authenticationApi.verifySsoToken('sso-token');

            expect(axios.post).toHaveBeenCalledWith(`${authServiceUrl}/tokens/sso/execute`, {
                applicationId: 'test-application-id',
                ssoToken: 'sso-token',
            });
            expect(token).toBe('actor-token');
        });

        it('logs and rejects with an ApiError when the exchange fails', async () => {
            axios.post.mockRejectedValue(httpError(401));

            const failure = await authenticationApi.verifySsoToken('sso-token').catch(err => err);

            expect(failure).toBeInstanceOf(ApiError);
            expect(failure.status).toBe(401);
            expect(log).toHaveBeenCalledWith('token is invalid');
        });
    });

    describe('verifyActorToken', () => {
        it('is true when the service accepts the token', async () => {
            axios.post.mockResolvedValue({ data: {} });

            await expect(authenticationApi.verifyActorToken('actor-token')).resolves.toBe(true);
            expect(axios.post).toHaveBeenCalledWith(`${authServiceUrl}/tokens/verify`, {}, {
                headers: { 'x-feral-auth-token': 'actor-token' },
            });
        });

        it.each([
            ['rejects the token', httpError(401)],
            ['fails', httpError(500)],
            ['does not answer', noAnswer()],
        ])('is false, and logs, when the service %s', async (_, error) => {
            axios.post.mockRejectedValue(error);

            await expect(authenticationApi.verifyActorToken('actor-token')).resolves.toBe(false);
            expect(log).toHaveBeenCalledWith('token is invalid');
        });
    });

    // current behavior: the authentication store's logout calls
    // authenticationApi.logout, which doesn't exist, so logging out never
    // reaches the service
    it('has no logout', () => {
        expect(Object.keys(authenticationApi)).toEqual(['verifySsoToken', 'verifyActorToken']);
        expect(authenticationApi.logout).toBeUndefined();
    });
});
