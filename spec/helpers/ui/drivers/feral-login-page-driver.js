import { expectUrl, expectVisible } from './assertions';
import { escaped } from './urls';
import { applicationId, authAppUrl } from '../setup/config';

/**
 * feral-authentication's login page, as Playwright sees it, opened by the
 * app's SSO button for the app's application. Only what signing on needs.
 */
export function createFeralLoginPageDriver(page) {
    const main = page.getByRole('main');
    const submitButton = main.getByRole('button', { name: 'Submit' });

    return {
        /** Opened for the app: its URL names the app's application. */
        async isShownForTheApp() {
            const what = "showing feral's login page, to sign on to the app";

            await expectUrl(page, new RegExp(`^${escaped(authAppUrl)}login\\?app=${escaped(applicationId)}$`), what);
            await expectVisible(submitButton, what);
        },

        /** Types the credentials and submits; where that leads is the destination's to check. */
        async logIn({ username, password }) {
            // Each field's label is repeated inside it, so its name reads twice
            await main.getByRole('textbox', { name: /^Username/ }).fill(username);
            await main.getByRole('textbox', { name: /^Password/ }).fill(password);
            await submitButton.click();
        },
    };
}
