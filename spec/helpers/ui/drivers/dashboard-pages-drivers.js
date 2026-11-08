import { createRoutedPageDriver } from './routed-page-driver';
import { escaped } from './urls';

/**
 * The dashboard's pages that, so far, only need to be reached and
 * recognised: each by its URL and its title. A page gets its own driver once
 * it has steps of its own, as the plots, plants, categories, plantings,
 * planting years and garden pages have.
 *
 * Titles are plain spans (`PageTitle`), with no heading role, so they're
 * found by their class.
 */
const pageTitled = title => main => main.locator('.page-title', { hasText: title });
const exactly = text => new RegExp(`^${escaped(text)}$`);

const pages = {
    planningPage: { name: 'the planning page', path: 'dashboard/planning', title: /^Planting Plan - \d+$/ },
    harvestsPage: { name: 'the harvests page', path: 'dashboard/harvests', title: exactly('Review Harvests') },
    plantStatsPage: { name: 'the plant stats page', path: 'dashboard/stats/plants', title: exactly('Plant Stats') },
    plantingStatsPage: { name: 'the planting stats page', path: 'dashboard/stats/plantings', title: exactly('Planting Stats') },
    activitySchedulesPage: { name: 'the activity schedules page', path: 'dashboard/activity-schedules', title: exactly('Activity Schedules') },
};

/** A routed-page driver for each, keyed as the page fixtures are. */
export function createDashboardPagesDrivers(page) {
    return Object.fromEntries(Object.entries(pages).map(([key, { name, path, title }]) => [
        key, createRoutedPageDriver(page, { name, path, marker: pageTitled(title) }),
    ]));
}
