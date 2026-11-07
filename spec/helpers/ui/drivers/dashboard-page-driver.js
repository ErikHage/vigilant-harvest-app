import { expectDisabled, expectEnabled, expectText, expectValue } from './assertions';
import { createRoutedPageDriver } from './routed-page-driver';
import { chooseOption } from './select';

/**
 * The dashboard's front page, where a sign-on lands, as Playwright sees it,
 * with its card for choosing the planting year: a select of the years, a Set
 * button, and a line naming the year chosen.
 */
export function createDashboardPageDriver(page) {
    const main = page.getByRole('main');
    const yearSelect = main.getByRole('combobox', { name: 'Select Planting Year' });
    const setButton = main.getByRole('button', { name: 'Set' });
    // Rendered inside a disabled text field, as its content, with no role
    const chosenLine = main.getByText(/^Currently Selected: /);

    return {
        ...createRoutedPageDriver(page, {
            name: 'the dashboard',
            path: 'dashboard',
            marker: main => main.getByText('You are logged in to the Vigilant Harvest Garden Tracker!'),
        }),

        /** Picks `plantingYear` in the select; Set is still to press. */
        async pickYear(plantingYear) {
            await chooseOption(page, yearSelect, String(plantingYear));
        },

        async pressSet() {
            await setButton.click();
        },

        /** Set is offered only for a year other than the one chosen. */
        async offersSet(offered) {
            const what = offered ? 'offering Set for a newly picked year' : 'not offering Set for the year already chosen';

            await (offered ? expectEnabled : expectDisabled)(setButton, what);
        },

        /** The card names `plantingYear` as chosen, and the select holds it. */
        async showsYearChosen(plantingYear) {
            const what = `showing ${plantingYear} as the year chosen`;

            await expectText(chosenLine, `Currently Selected: ${plantingYear}`, what);
            await expectValue(yearSelect, String(plantingYear), what);
        },
    };
}
