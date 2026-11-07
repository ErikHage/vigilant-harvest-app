// For vi.mock('axios', ...): the real axios, with its request methods
// replaced by mocks. A bare vi.mock('axios') would mock isAxiosError too,
// and the app's error handler relies on it to tell an HTTP failure from any
// other error.
//
// This module must not import axios, or anything that does: it runs inside
// the mock factory, while axios is being mocked
export async function axiosWithMockedRequests(importOriginal) {
    const actual = await importOriginal();
    const axios = actual.default;

    return {
        ...actual,
        default: {
            ...axios,
            isAxiosError: axios.isAxiosError,
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            patch: vi.fn(),
            delete: vi.fn(),
        },
    };
}
