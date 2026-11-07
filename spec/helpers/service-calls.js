import axios from 'axios';
import { ApiError } from '@/api/error-handler';
import { httpError, serviceErrorBody } from './http-errors';

// The VITE_VIGILANT_HARVEST_SERVICE_V0_BASE_URL set in vitest.config.js
export const serviceUrl = 'https://api.test/vigilant-harvest-service/v0';

// The request config the app sends: the caller's token, plus any `extra`
// (such as query params)
export function withToken(extra = {}) {
    return { ...extra, headers: { 'x-feral-auth-token': 'a-token' } };
}

const sendsBody = ['post', 'put', 'patch'];

// For each call to the service, two tests: that it sends the request and
// returns the response body, and that a failure reaches the caller as an
// ApiError with the service's status and body. The second also proves the
// function is wrapped by withApiErrorHandling.
//
// Each call is { name, call, verb, url, body, config }, where `call` makes
// the call with the token 'a-token', and `config` defaults to withToken()
export function describeServiceCalls(calls) {
    describe.each(calls)('$name', ({ call, verb, url, body, config = withToken() }) => {
        it(`sends a ${verb.toUpperCase()} and returns the response body`, async () => {
            axios[verb].mockResolvedValue({ data: { from: 'the service' } });

            const result = await call();

            expect(axios[verb]).toHaveBeenCalledTimes(1);
            expect(axios[verb]).toHaveBeenCalledWith(
                ...(sendsBody.includes(verb) ? [url, body, config] : [url, config]));
            expect(result).toEqual({ from: 'the service' });
        });

        it("rejects with an ApiError carrying the service's status and body", async () => {
            const errorBody = serviceErrorBody(400, 'plantingYear must be an integer');
            axios[verb].mockRejectedValue(httpError(400, errorBody));

            const failure = await call().catch(err => err);

            expect(failure).toBeInstanceOf(ApiError);
            expect(failure).toMatchObject({ status: 400, data: errorBody });
        });
    });
}
