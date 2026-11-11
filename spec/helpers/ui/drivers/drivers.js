import { createActivityLogPageDriver } from './activity-log-page-driver';
import { createActivityScheduleDetailsPageDriver } from './activity-schedule-details-page-driver';
import { createActivitySchedulesPageDriver } from './activity-schedules-page-driver';
import { createAddPlantingYearPageDriver } from './add-planting-year-page-driver';
import { createAppBarDriver } from './app-bar-driver';
import { createBrowserClockDriver } from './browser-clock-driver';
import { createDashboardNavDriver } from './dashboard-nav-driver';
import { createDashboardPageDriver } from './dashboard-page-driver';
import { createFeralLoginPageDriver } from './feral-login-page-driver';
import { createGardenDriver } from './garden-driver';
import { createGardenPageDriver } from './garden-page-driver';
import { createHarvestsPageDriver } from './harvests-page-driver';
import { createJournalPageDriver } from './journal-page-driver';
import { createLoginPageDriver } from './login-page-driver';
import { createPlantCategoriesPageDriver } from './plant-categories-page-driver';
import { createPlantDetailsPageDriver } from './plant-details-page-driver';
import { createPlantEditPageDriver } from './plant-edit-page-driver';
import { createPlantingDetailsPageDriver } from './planting-details-page-driver';
import { createPlantingYearDetailsPageDriver } from './planting-year-details-page-driver';
import { createPlantingYearsPageDriver } from './planting-years-page-driver';
import { createPlanningPageDriver } from './planning-page-driver';
import { createPlantingsPageDriver } from './plantings-page-driver';
import { createPlantsPageDriver } from './plants-page-driver';
import { recordPageErrors } from './page-errors';
import { createPlotsPageDriver } from './plots-page-driver';
import { recordServiceCalls } from './service-calls';
import { controlServiceCalls } from './service-call-control';
import { createStatsPageDriver } from './stats-page-driver';
import { createUnknownPageDriver } from './unknown-page-driver';

/** Builds each driver once per test, over Playwright's `page`. */
export function createDrivers(page) {
    // Before anything loads, so no call or error goes unrecorded
    const serviceCalls = recordServiceCalls(page);
    const pageErrors = recordPageErrors(page);
    const callControl = controlServiceCalls(page);

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
        plantingYearsPage: createPlantingYearsPageDriver(page, serviceCalls, callControl),
        addPlantingYearPage: createAddPlantingYearPageDriver(page),
        plantingYearDetailsPage: createPlantingYearDetailsPageDriver(page, callControl),
        gardenPage: createGardenPageDriver(page, callControl),
        journalPage: createJournalPageDriver(page),
        activityLogPage: createActivityLogPageDriver(page),
        harvestsPage: createHarvestsPageDriver(page, serviceCalls),
        plantingStatsPage: createStatsPageDriver(page, 'planting'),
        plantStatsPage: createStatsPageDriver(page, 'plant'),
        planningPage: createPlanningPageDriver(page),
        activitySchedulesPage: createActivitySchedulesPageDriver(page),
        activityScheduleDetailsPage: createActivityScheduleDetailsPageDriver(page, serviceCalls),
        unknownPage: createUnknownPageDriver(page),

        // Not pages: the service's API, for what a test only needs, and the browser's clock
        garden: createGardenDriver(),
        browserClock: createBrowserClockDriver(page),
    };
}
