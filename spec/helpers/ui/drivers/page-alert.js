import { expectText } from './assertions';

/**
 * The alert a dashboard page shows when the store reports a failure
 * (`FadeOutAlert`). It fades after three seconds, so check it straight after
 * the step that caused it. Vuetify's form fields each carry an empty `alert`
 * of their own, for their messages, so it's found by its class.
 */
export async function pageAlertSays(page, message, what) {
    await expectText(page.getByRole('main').locator('.v-alert'), message, what);
}
