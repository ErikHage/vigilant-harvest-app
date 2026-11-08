import { createAppBarDriver } from './app-bar-driver';
import { createBrowserClockDriver } from './browser-clock-driver';
import { createDashboardNavDriver } from './dashboard-nav-driver';
import { createDashboardPageDriver } from './dashboard-page-driver';
import { createDashboardPagesDrivers } from './dashboard-pages-drivers';
import { createFeralLoginPageDriver } from './feral-login-page-driver';
import { createGardenDriver } from './garden-driver';
import { createLoginPageDriver } from './login-page-driver';
import { createPlantCategoriesPageDriver } from './plant-categories-page-driver';
import { createPlantDetailsPageDriver } from './plant-details-page-driver';
import { createPlantEditPageDriver } from './plant-edit-page-driver';
import { createPlantingDetailsPageDriver } from './planting-details-page-driver';
import { createPlantingsPageDriver } from './plantings-page-driver';
import { createPlantsPageDriver } from './plants-page-driver';
import { recordPageErrors } from './page-errors';
import { createPlotsPageDriver } from './plots-page-driver';
import { recordServiceCalls } from './service-calls';
import { createUnknownPageDriver } from './unknown-page-driver';

/** Builds each driver once per test, over Playwright's `page`. */
export function createDrivers(page) {
    // Before anything loads, so no call or error goes unrecorded
    const serviceCalls = recordServiceCalls(page);
    const pageErrors = recordPageErrors(page);

    return {
        appBar: createAppBarDriver(page, serviceCalls),
        dashboardNav: createDashboardNavDriver(page),

        loginPage: createLoginPageDriver(page, serviceCalls),
        feralLoginPage: createFeralLoginPageDriver(page),
        dashboardPage: createDashboardPageDriver(page),
        plotsPage: createPlotsPageDriver(page),
        plantsPage: createPlantsPageDriver(page),
        plantDetailsPage: createPlantDetailsPageDriver(page),
        plantEditPage: createPlantEditPageDriver(page),
        plantCategoriesPage: createPlantCategoriesPageDriver(page),
        plantingsPage: createPlantingsPageDriver(page),
        plantingDetailsPage: createPlantingDetailsPageDriver(page, pageErrors),
        unknownPage: createUnknownPageDriver(page),
        // planningPage, gardenPage, harvestsPage, ...: reached and recognised only
        ...createDashboardPagesDrivers(page),

        // Not pages: the service's API, for what a test only needs, and the browser's clock
        garden: createGardenDriver(),
        browserClock: createBrowserClockDriver(page),
    };
}
