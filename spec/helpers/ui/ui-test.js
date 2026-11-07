import { test as base } from '@playwright/test';

import { guardNetwork } from './support/network-guard';
import { createWorld } from './world';
import { createDashboardPage } from './pages/dashboard-page';
import { createDashboardPageOnly } from './pages/dashboard-pages';
import { createFeralLoginPage } from './pages/feral-login-page';
import { createGarden } from './pages/garden';
import { createLoginPage } from './pages/login-page';
import { createPlotsPage } from './pages/plots-page';
import { createUnknownPage } from './pages/unknown-page';

/** A fixture for a page object, over the driver of the same name. */
const pageFixture = (name, createPage) => async ({ world }, use) => {
    await use(createPage(world, world.drivers[name]));
};

/**
 * The one thing a spec imports.
 *
 * Playwright's `test`, extended with a fixture per page object, so a spec
 * asks for the pages it uses by name: `async ({ loginPage }) => ...`.
 * Everything a spec can say lives behind these, so the layering is
 * checkable: any other import in spec/ui is a spec reaching past the pages.
 *
 * `expect` is deliberately not exported; assertions live in the drivers.
 */
export const test = base.extend({
    // Every test's browser reaches only the local app and services; see
    // support/network-guard.js
    context: async ({ context }, use) => {
        const guard = await guardNetwork(context);
        await use(context);
        guard.check();
    },

    // One world per test, shared by every page object in it, and cleaned up
    // when the test ends, so specs need no afterEach
    world: async ({ page }, use) => {
        const world = createWorld(page);
        await use(world);
        await world.cleanup();
    },

    loginPage: pageFixture('loginPage', createLoginPage),
    feralLoginPage: pageFixture('feralLoginPage', createFeralLoginPage),
    dashboardPage: pageFixture('dashboardPage', createDashboardPage),
    plotsPage: pageFixture('plotsPage', createPlotsPage),
    unknownPage: pageFixture('unknownPage', createUnknownPage),

    // Reached and recognised only, so far
    planningPage: pageFixture('planningPage', createDashboardPageOnly),
    gardenPage: pageFixture('gardenPage', createDashboardPageOnly),
    plantsPage: pageFixture('plantsPage', createDashboardPageOnly),
    plantingYearsPage: pageFixture('plantingYearsPage', createDashboardPageOnly),
    plantingsPage: pageFixture('plantingsPage', createDashboardPageOnly),
    harvestsPage: pageFixture('harvestsPage', createDashboardPageOnly),
    plantStatsPage: pageFixture('plantStatsPage', createDashboardPageOnly),
    plantingStatsPage: pageFixture('plantingStatsPage', createDashboardPageOnly),
    plantCategoriesPage: pageFixture('plantCategoriesPage', createDashboardPageOnly),
    activitySchedulesPage: pageFixture('activitySchedulesPage', createDashboardPageOnly),

    // Not a page: what a test needs but isn't about, arranged through the API
    garden: pageFixture('garden', createGarden),
});
