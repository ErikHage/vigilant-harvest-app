import { createAppBarDriver } from './app-bar-driver';
import { createDashboardNavDriver } from './dashboard-nav-driver';
import { createDashboardPageDriver } from './dashboard-page-driver';
import { createDashboardPagesDrivers } from './dashboard-pages-drivers';
import { createFeralLoginPageDriver } from './feral-login-page-driver';
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
        dashboardNav: createDashboardNavDriver(page),

        loginPage: createLoginPageDriver(page, serviceCalls),
        feralLoginPage: createFeralLoginPageDriver(page),
        dashboardPage: createDashboardPageDriver(page),
        plotsPage: createPlotsPageDriver(page),
        unknownPage: createUnknownPageDriver(page),
        // planningPage, gardenPage, plantsPage, ...: reached and recognised only
        ...createDashboardPagesDrivers(page),

        // Not a page: the service's API, for what a test only needs
        garden: createGardenDriver(),
    };
}
