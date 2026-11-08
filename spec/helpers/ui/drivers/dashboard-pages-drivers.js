import { createRoutedPageDriver } from './routed-page-driver';
import { escaped } from './urls';

/**
 * The dashboard's pages that, so far, only need to be reached and
 * recognised: each by its URL and its title. A page gets its own driver once
 * it has steps of its own, as the plots, plants, categories, plantings,
 * planting years, garden, harvests, stats and planning pages have.
 *
 * Titles are plain spans (`PageTitle`), with no heading role, so they're
 * found by their class.
 */
const pageTitled = title => main => main.locator('.page-title', { hasText: title });
const exactly = text => new RegExp(`^${escaped(text)}$`);

const pages = {
    activitySchedulesPage: { name: 'the activity schedules page', path: 'dashboard/activity-schedules', title: exactly('Activity Schedules') },
};

/** A routed-page driver for each, keyed as the page fixtures are. */
export function createDashboardPagesDrivers(page) {
    return Object.fromEntries(Object.entries(pages).map(([key, { name, path, title }]) => [
        key, createRoutedPageDriver(page, { name, path, marker: pageTitled(title) }),
    ]));
}
