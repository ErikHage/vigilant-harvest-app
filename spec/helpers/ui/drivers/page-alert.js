import { expectText, expectVisible } from './assertions';

/**
 * The alert a dashboard page shows when the store reports a failure
 * (`FadeOutAlert`). It fades after three seconds, so check it straight after
 * the step that caused it. Vuetify's form fields each carry an empty `alert`
 * of their own, for their messages, so it's found by its class.
 */
export async function pageAlertSays(page, message, what) {
    await expectText(page.getByRole('main').locator('.v-alert'), message, what);
}

/**
 * A save the service refused: the dialog stays open, with what was entered,
 * and says why, as does the page's alert behind it. Check it straight after
 * the step that caused it: the page's alert fades after three seconds.
 */
export async function saveIsRejectedSaying(page, message, what) {
    const dialog = page.getByRole('dialog');

    await expectVisible(dialog, what);
    await expectText(dialog.locator('.v-alert'), message, what);
    await pageAlertSays(page, message, what);
}
