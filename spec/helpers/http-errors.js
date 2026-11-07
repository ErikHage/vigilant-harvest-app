// An error as the HTTP client rejects with it: the service answered `status`,
// with `data` as the body
export function httpError(status, data = '') {
    return Object.assign(new Error(`Request failed with status code ${status}`), {
        isAxiosError: true,
        status,
        response: { status, data },
    });
}

// An error as the HTTP client rejects with it when the service doesn't answer
export function noAnswer() {
    return Object.assign(new Error('Network Error'), { isAxiosError: true });
}

// The body the service sends with every error
export function serviceErrorBody(status, message) {
    return { errors: [{ name: 'FeralError', message, status }] };
}
