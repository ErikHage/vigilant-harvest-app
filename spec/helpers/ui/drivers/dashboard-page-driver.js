import { createRoutedPageDriver } from './routed-page-driver';

/** The dashboard's front page, where a sign-on lands, as Playwright sees it. */
export function createDashboardPageDriver(page) {
    return createRoutedPageDriver(page, {
        name: 'the dashboard',
        path: 'dashboard',
        marker: main => main.getByText('You are logged in to the Vigilant Harvest Garden Tracker!'),
    });
}
