/**
 * The dashboard's own bar, with a link to each page, as Playwright sees it.
 *
 * It's a Vuetify app bar inside the main area, so it isn't a `banner`, and
 * nothing names it: found by its element, with a class to tell it apart.
 * On a desktop it shows links, with Stats and Admin as menus; on a phone
 * (below Vuetify's md breakpoint, 960px) it's one menu behind an icon button
 * with no name, found by its icon's class.
 */

// Each page: the link on a desktop, under its menu if any, and the item on
// a phone
const destinations = {
    planning: { link: 'Planning', item: 'Planning' },
    garden: { link: 'Garden', item: 'Garden' },
    plants: { link: 'Plants', item: 'Plants' },
    plots: { link: 'Plots', item: 'Plots' },
    plantingYears: { link: 'Years', item: 'Years' },
    plantings: { link: 'Plantings', item: 'Plantings' },
    harvests: { link: 'Harvests', item: 'Harvests' },
    plantStats: { menu: 'Stats', link: 'Plant', item: 'Plant Stats' },
    plantingStats: { menu: 'Stats', link: 'Planting', item: 'Planting Stats' },
    plantCategories: { menu: 'Admin', link: 'Categories', item: 'Categories' },
    activitySchedules: { menu: 'Admin', link: 'Activity Schedules', item: 'Activity Schedules' },
};

export const dashboardDestinations = Object.keys(destinations);

const phoneWidth = 960;

export function createDashboardNavDriver(page) {
    const bar = page.getByRole('main').locator('header.v-app-bar');
    const onAPhone = () => (page.viewportSize()?.width ?? phoneWidth) < phoneWidth;

    return {
        /** Follows the link to `destination`, a key of `destinations`, through its menu if it has one. */
        async goTo(destination) {
            const { menu, link, item } = destinations[destination];

            if (onAPhone()) {
                await bar.locator('.mdi-menu').click();
                await page.getByRole('link', { name: item, exact: true }).click();
                return;
            }
            if (menu) {
                await bar.getByRole('button', { name: menu }).click();
                await page.getByRole('link', { name: link, exact: true }).click();
                return;
            }
            await bar.getByRole('link', { name: link, exact: true }).click();
        },
    };
}
