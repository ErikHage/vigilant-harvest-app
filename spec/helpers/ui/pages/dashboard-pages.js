import { dashboardComponents, routedPageSteps } from './routed-page';

/**
 * A dashboard page that, so far, only needs to be reached and recognised:
 * planning, garden, plants, planting years, plantings, harvests, both stats
 * pages, categories and activity schedules. Each moves to its own file once
 * it has steps of its own.
 */
export function createDashboardPageOnly(world, driver) {
    return {
        ...dashboardComponents(world),
        ...routedPageSteps(driver),
    };
}
