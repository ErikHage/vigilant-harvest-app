import { dashboardComponents, routedPageSteps } from './routed-page';

/**
 * A dashboard page that, so far, only needs to be reached and recognised:
 * activity schedules. A page moves to its own file once it has steps of its
 * own, as plants, categories, plantings, planting years, the garden,
 * harvests, the stats pages and planning have.
 */
export function createDashboardPageOnly(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),
    };
}
