import { expectEventually, expectThat, expectVisible } from './assertions';

/**
 * The dashboard's side drawer, with a link to each page, as Playwright sees it.
 *
 * It's a Vuetify navigation drawer, so a `navigation`, and the app's only
 * one. On a desktop it's always there, either expanded or a rail of icons;
 * the banner's Menu button switches between them. A rail's links keep their
 * names, so they're found the same way in both. Its links are grouped under
 * headings (Planning, Garden, Recordkeeping, Config). Vuetify marks the rail
 * only by a class, so a rail is recognised by what it shows: separators in
 * place of the headings, and a drawer narrow enough for icons alone. The
 * Config heading stands for them all: it shows with or without a year.
 *
 * On a phone (below Vuetify's md breakpoint, 960px) it's hidden, and Menu
 * slides it in over the page. Hidden, it's only moved off screen: its links
 * stay in the accessibility tree.
 */

// Each page's link
const destinations = {
    planning: 'Plan',
    garden: 'Overview',
    journal: 'Journal',
    activityLog: 'Activity Log',
    plants: 'Plants',
    plots: 'Plots',
    plantingYears: 'Years',
    plantings: 'Plantings',
    harvests: 'Harvests',
    stats: 'Stats',
    plantCategories: 'Categories',
    activitySchedules: 'Activity Schedules',
};

export const dashboardDestinations = Object.keys(destinations);

const phoneWidth = 960;

// Vuetify's rail is 56px wide, and the expanded drawer 256px
const railWidth = 100;

export function createDashboardNavDriver(page) {
    const drawer = page.getByRole('navigation');
    const menuButton = page.getByRole('banner').getByRole('button', { name: 'Menu' });
    const configHeading = drawer.getByText('Config', { exact: true });
    const separators = drawer.getByRole('separator');
    const onAPhone = () => (page.viewportSize()?.width ?? phoneWidth) < phoneWidth;
    const drawerWidth = async () => (await drawer.boundingBox())?.width ?? 0;

    return {
        /** Follows the link to `destination`, a key of `destinations`, opening the drawer first on a phone. */
        async goTo(destination) {
            if (onAPhone()) {
                await menuButton.click();
            }
            await drawer.getByRole('link', { name: destinations[destination], exact: true }).click();
        },

        /** On a desktop, from expanded: Menu turns the drawer into a rail. */
        async collapseToRail() {
            await this.isExpanded();
            await menuButton.click();
            await this.isRail();
        },

        /** On a desktop, from a rail: Menu expands the drawer again. */
        async expand() {
            await this.isRail();
            await menuButton.click();
            await this.isExpanded();
        },

        /** Icons only: separators where the headings were, in a narrow drawer. */
        async isRail() {
            const what = 'the dashboard\'s drawer, as a rail';

            await expectVisible(separators.first(), what);
            await expectEventually(async () => (await drawerWidth()) < railWidth,
                `the drawer narrower than ${railWidth}px`, what);
            const headings = await configHeading.count();
            expectThat(headings === 0, 'no Config heading', `${headings} shown`, what);
        },

        /** Expanded: the headings, and no separators in their place. */
        async isExpanded() {
            const what = 'the dashboard\'s drawer, expanded';

            await expectVisible(configHeading, what);
            await expectEventually(async () => (await drawerWidth()) >= railWidth,
                `the drawer at least ${railWidth}px wide`, what);
            const shown = await separators.count();
            expectThat(shown === 0, 'no separator', `${shown} shown`, what);
        },
    };
}
