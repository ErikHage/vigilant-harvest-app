import { dashboardComponents, routedPageSteps } from './routed-page';

/**
 * A dashboard page that, so far, only needs to be reached and recognised:
 * planning, garden, planting years, plantings, harvests, both stats pages and
 * activity schedules. Each moves to its own file once it has steps of its
 * own, as plants and categories have.
 */
export function createDashboardPageOnly(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),
    };
}
