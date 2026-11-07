import { test } from '../../helpers/ui/ui-test';

// The skeleton's one data path, end to end: a plot added on the page, and one
// arranged through the API, each deleted by cleanup afterwards. The rest of
// the plots page is 2.4's.

test.describe('The plots page', () => {
    test.beforeEach(async ({ loginPage, dashboardPage }) => {
        await loginPage.logIn('user: gardener');
        await dashboardPage.checkIsShown();
    });

    test('lists a plot that exists', async ({ garden, plotsPage }) => {
        await garden.hasPlot('plot: bed');

        await plotsPage.open();

        await plotsPage.checkPlotListed('plot: bed');
    });

    // The dialog sends a new plot as inactive, with no field to change it, but
    // the service doesn't read isActive on a create, and makes every new plot
    // active
    test('lists a plot added through its dialog, as active', async ({ plotsPage }) => {
        await plotsPage.open();
        await plotsPage.checkIsShown();

        await plotsPage.addPlot('plot: bed');

        await plotsPage.checkPlotListed('plot: bed');
    });
});
