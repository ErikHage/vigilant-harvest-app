import { ApiError, withApiErrorHandling } from '@/api/error-handler';
import { httpError, noAnswer, serviceErrorBody } from '../../helpers/http-errors';

describe('withApiErrorHandling', () => {
    it('passes the arguments through and returns the result', async () => {
        const fn = vi.fn().mockResolvedValue('result');

        await expect(withApiErrorHandling(fn)('a-token', 2026)).resolves.toBe('result');
        expect(fn).toHaveBeenCalledWith('a-token', 2026);
    });

    it("turns an HTTP failure into an ApiError with the service's status and body", async () => {
        const body = serviceErrorBody(400, 'name is required');
        const fn = vi.fn().mockRejectedValue(httpError(400, body));

        const failure = await withApiErrorHandling(fn)().catch(err => err);

        expect(failure).toBeInstanceOf(ApiError);
        expect(failure).toBeInstanceOf(Error);
        expect(failure.name).toBe('ApiError');
        expect(failure.message).toBe('Request failed with status code 400');
        expect(failure.status).toBe(400);
        expect(failure.data).toEqual(body);
    });

    it('keeps a body that is not JSON, such as the HTML nginx sends for a 502', async () => {
        const fn = vi.fn().mockRejectedValue(httpError(502, '<html>Bad Gateway</html>'));

        const failure = await withApiErrorHandling(fn)().catch(err => err);

        expect(failure).toMatchObject({ status: 502, data: '<html>Bad Gateway</html>' });
    });

    it('gives a null status and body when the service does not answer', async () => {
        const fn = vi.fn().mockRejectedValue(noAnswer());

        const failure = await withApiErrorHandling(fn)().catch(err => err);

        expect(failure).toBeInstanceOf(ApiError);
        expect(failure).toMatchObject({ message: 'Network Error', status: null, data: null });
    });

    it('keeps any other error as its cause, with its message, and no status or body', async () => {
        const original = new TypeError("Cannot read properties of undefined (reading 'name')");
        const fn = vi.fn().mockRejectedValue(original);

        const failure = await withApiErrorHandling(fn)().catch(err => err);

        expect(failure).toBeInstanceOf(ApiError);
        expect(failure.message).toBe("Cannot read properties of undefined (reading 'name')");
        expect(failure.cause).toBe(original);
        expect(failure.status).toBeNull();
        expect(failure.data).toBeNull();
    });
});
