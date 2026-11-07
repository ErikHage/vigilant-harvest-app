import { routedPageSteps, shellComponents } from './routed-page';

/** The dashboard's front page, in words. */
export function createDashboardPage(world, driver) {
    return {
        ...shellComponents(world),
        ...routedPageSteps(driver),
    };
}
