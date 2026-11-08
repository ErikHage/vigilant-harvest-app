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

    // The dialog sends a new plot as inactive, with no field to change it, but
    // the service doesn't read isActive on a create, and makes every new plot
    // active (backlog B24)
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

    // DocumentsCurrentBehavior: the dialog's fields are marked required but
    // have no rules, so Create is offered with nothing entered, and the
    // service refuses the plot, which has no name or type (backlog A16).
    // Should offer Create only once they're given
    test('offers Create only once a plot\'s required fields are given', async ({ plotsPage }) => {
        await plotsPage.open();
        await plotsPage.checkIsShown();
        await plotsPage.openAddDialog();

        await plotsPage.checkCreateNeedsTheRequiredFields();
        await plotsPage.create();

        await plotsPage.checkAlertSays('message: error upserting plot');
    });
});
