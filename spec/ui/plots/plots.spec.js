import { test } from '../../helpers/ui/ui-test';

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

    // The service makes every new plot active. The dialog sent one as
    // inactive, which the service ignored (backlog B24)
    test('lists a plot added through its dialog, as active', async ({ plotsPage }) => {
        await plotsPage.open();
        await plotsPage.checkIsShown();

        await plotsPage.addPlot('plot: bed');

        await plotsPage.checkPlotListed('plot: bed');
    });

    test('finds a plot by its name', async ({ garden, plotsPage }) => {
        await garden.hasPlot('plot: bed');
        await plotsPage.open();
        await plotsPage.checkIsShown();

        await plotsPage.checkPlotFound('plot: bed');
    });

    test('saves an edit made through a plot\'s pencil', async ({ garden, plotsPage }) => {
        await garden.hasPlot('plot: bed');
        await plotsPage.open();
        await plotsPage.checkIsShown();

        await plotsPage.editPlot('plot: bed');

        await plotsPage.checkPlotListed('plot: bed');
    });

    test('offers Create only once a plot\'s required fields are given', async ({ plotsPage }) => {
        await plotsPage.open();
        await plotsPage.checkIsShown();
        await plotsPage.openAddDialog();

        await plotsPage.checkCreateNeedsTheRequiredFields();
    });
});
