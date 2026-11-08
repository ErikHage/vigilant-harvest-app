/**
 * Errors the app threw and nothing caught, recorded from the start of the
 * test: Chromium reports an unhandled rejection as one too. For pins on code
 * that throws; nothing fails a test for them on its own.
 */
export function recordPageErrors(page) {
    const thrown = [];

    page.on('pageerror', error => {
        thrown.push(error.message);
    });

    return {
        /** The messages so far, oldest first. */
        messages: () => [...thrown],
    };
}
