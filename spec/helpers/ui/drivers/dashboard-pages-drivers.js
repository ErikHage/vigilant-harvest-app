import { createRoutedPageDriver } from './routed-page-driver';
import { escaped } from './urls';

/**
 * The dashboard's pages that, so far, only need to be reached and
 * recognised: each by its URL and its title. A page gets its own driver once
 * it has steps of its own, as the plots page has.
 *
 * Titles are plain spans (`PageTitle`), with no heading role, so they're
 * found by their class.
 */
const pageTitled = title => main => main.locator('.page-title', { hasText: title });
const exactly = text => new RegExp(`^${escaped(text)}$`);

const pages = {
    planningPage: { name: 'the planning page', path: 'dashboard/planning', title: /^Planting Plan - \d+$/ },
    gardenPage: { name: 'the garden page', path: 'dashboard/garden', title: exactly('Garden Overview') },
    plantsPage: { name: 'the plants page', path: 'dashboard/plants', title: exactly('Manage Plants') },
    plantingYearsPage: { name: 'the planting years page', path: 'dashboard/planting-years', title: exactly('Manage Planting Years') },
    plantingsPage: { name: 'the plantings page', path: 'dashboard/plantings', title: exactly('Manage Plantings') },
    harvestsPage: { name: 'the harvests page', path: 'dashboard/harvests', title: exactly('Review Harvests') },
    plantStatsPage: { name: 'the plant stats page', path: 'dashboard/stats/plants', title: exactly('Plant Stats') },
    plantingStatsPage: { name: 'the planting stats page', path: 'dashboard/stats/plantings', title: exactly('Planting Stats') },
    plantCategoriesPage: { name: 'the plant categories page', path: 'dashboard/categories', title: exactly('Plant Categories') },
    activitySchedulesPage: { name: 'the activity schedules page', path: 'dashboard/activity-schedules', title: exactly('Activity Schedules') },
};

/** A routed-page driver for each, keyed as the page fixtures are. */
export function createDashboardPagesDrivers(page) {
    return Object.fromEntries(Object.entries(pages).map(([key, { name, path, title }]) => [
        key, createRoutedPageDriver(page, { name, path, marker: pageTitled(title) }),
    ]));
}
