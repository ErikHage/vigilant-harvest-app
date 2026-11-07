import { gardener } from '../setup/config';
import { login, logout } from './service-client';

/**
 * Runs `work(token)` in a session of its own, as the user with
 * `credentials`, and ends the session after, so the suite's own calls leave
 * none behind in feral.
 *
 * Resolves to what `work` returns, or to `{ error }` naming why no session
 * could be had. Never throws for the login: the caller decides what that
 * means, as with the service client.
 */
export async function inSessionOf({ username, password }, work) {
    const session = await login(username, password);
    const token = session.body?.token;

    if (typeof token !== 'string') {
        return { error: `couldn't log in as ${username} (${session.error ?? `status ${session.status}`})` };
    }
    try {
        return await work(token);
    } finally {
        await logout(token);
    }
}

/** `inSessionOf`, as the gardener from .env.ui: for arranging, cleanup and the checks. */
export const asGardener = work => inSessionOf(gardener, work);
