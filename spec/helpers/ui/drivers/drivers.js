import { createAppBarDriver } from './app-bar-driver';
import { createDashboardPageDriver } from './dashboard-page-driver';
import { createGardenDriver } from './garden-driver';
import { createLoginPageDriver } from './login-page-driver';
import { createPlotsPageDriver } from './plots-page-driver';
import { recordServiceCalls } from './service-calls';
import { createUnknownPageDriver } from './unknown-page-driver';

/** Builds each driver once per test, over Playwright's `page`. */
export function createDrivers(page) {
    // Before anything loads, so no call goes unrecorded
    const serviceCalls = recordServiceCalls(page);

    return {
        appBar: createAppBarDriver(page, serviceCalls),

        loginPage: createLoginPageDriver(page, serviceCalls),
        dashboardPage: createDashboardPageDriver(page),
        plotsPage: createPlotsPageDriver(page),
        unknownPage: createUnknownPageDriver(page),

        // Not a page: the service's API, for what a test only needs
        garden: createGardenDriver(),
    };
}
