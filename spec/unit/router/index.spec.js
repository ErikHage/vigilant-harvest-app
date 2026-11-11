import { createPinia, setActivePinia } from 'pinia';
import router from '@/router';
import { useAuthenticationStore } from '@/store';
import authenticationApi from '@/api/authentication-api';
import LoginPage from '@/components/views/LoginPage.vue';
import LandingPage from '@/components/views/LandingPage.vue';
import DashboardPage from '@/components/views/DashboardPage.vue';
import DashboardDefaultPage from '@/components/views/dashboard/DashboardDefaultPage.vue';
import GardenPage from '@/components/views/dashboard/garden/GardenPage.vue';
import GardenJournalPage from '@/components/views/dashboard/garden/GardenJournalPage.vue';
import GardenActivityLogPage from '@/components/views/dashboard/garden/GardenActivityLogPage.vue';
import PlanningPage from '@/components/views/dashboard/planning/PlanningPage.vue';
import ActivitySchedulesPage from '@/components/views/dashboard/admin/ActivitySchedulesPage.vue';
import ActivityScheduleDetailsPage from '@/components/views/dashboard/admin/ActivityScheduleDetailsPage.vue';
import PlantCategoriesPage from '@/components/views/dashboard/admin/PlantCategoriesPage.vue';
import PlantsPage from '@/components/views/dashboard/plants/PlantsPage.vue';
import PlantDetailsPage from '@/components/views/dashboard/plants/PlantDetailsPage.vue';
import PlantEditPage from '@/components/views/dashboard/plants/PlantEditPage.vue';
import PlotsPage from '@/components/views/dashboard/plots/PlotsPage.vue';
import PlantingYearsPage from '@/components/views/dashboard/years/PlantingYearsPage.vue';
import AddPlantingYearPage from '@/components/views/dashboard/years/AddPlantingYearPage.vue';
import PlantingYearDetailsPage from '@/components/views/dashboard/years/PlantingYearDetailsPage.vue';
import PlantingsPage from '@/components/views/dashboard/plantings/PlantingsPage.vue';
import PlantingDetailsPage from '@/components/views/dashboard/plantings/PlantingDetailsPage.vue';
import HarvestsPage from '@/components/views/dashboard/harvests/HarvestsPage.vue';
import PlantingStatsPage from '@/components/views/dashboard/stats/PlantingStatsPage.vue';
import PlantStatsPage from '@/components/views/dashboard/stats/PlantStatsPage.vue';

vi.mock('@/api/authentication-api');

// Each dashboard page: its path, its route name, and its component
const dashboardPages = [
    ['/dashboard', 'DashboardDefaultPage', DashboardDefaultPage],
    ['/dashboard/garden', 'Garden', GardenPage],
    ['/dashboard/journal', 'Journal', GardenJournalPage],
    ['/dashboard/activity-log', 'ActivityLog', GardenActivityLogPage],
    ['/dashboard/planning', 'Planning', PlanningPage],
    ['/dashboard/activity-schedules', 'ActivitySchedulesPage', ActivitySchedulesPage],
    ['/dashboard/activity-schedules/schedule-1', 'ActivityScheduleDetailsPage', ActivityScheduleDetailsPage],
    ['/dashboard/categories', 'PlantCategoriesPage', PlantCategoriesPage],
    ['/dashboard/plants', 'PlantsPage', PlantsPage],
    ['/dashboard/plants/plant-1/details', 'PlantDetailsPage', PlantDetailsPage],
    ['/dashboard/plants/plant-1/edit', 'PlantEditPage', PlantEditPage],
    ['/dashboard/plots', 'PlotsPage', PlotsPage],
    ['/dashboard/planting-years', 'PlantingYearsPage', PlantingYearsPage],
    ['/dashboard/planting-years/add', 'AddPlantingYearPage', AddPlantingYearPage],
    ['/dashboard/planting-years/2026', 'PlantingYearDetailsPage', PlantingYearDetailsPage],
    ['/dashboard/plantings', 'PlantingsPage', PlantingsPage],
    ['/dashboard/plantings/planting-1/details', 'PlantingDetailsPage', PlantingDetailsPage],
    ['/dashboard/harvests', 'HarvestsPage', HarvestsPage],
    ['/dashboard/stats/plantings', 'PlantingStatsPage', PlantingStatsPage],
    ['/dashboard/stats/plants', 'PlantStatsPage', PlantStatsPage],
];
const protectedPaths = dashboardPages.map(([path]) => path);

describe('router', () => {
    it('serves the app under /apps/vigilant-harvest/', () => {
        expect(router.resolve('/landing').href).toBe('/apps/vigilant-harvest/landing');
    });

    describe('routes', () => {
        it.each([
            ['/', 'Login', LoginPage],
            ['/landing', 'LandingPage', LandingPage],
        ])('resolves %s to %s', (path, name, component) => {
            const route = router.resolve(path);

            expect(route.name).toBe(name);
            expect(route.matched.map(record => record.components.default)).toEqual([component]);
        });

        it.each(dashboardPages)('resolves %s to %s, inside the dashboard', (path, name, component) => {
            const route = router.resolve(path);

            expect(route.name).toBe(name);
            expect(route.matched.map(record => record.components.default)).toEqual([DashboardPage, component]);
        });

        it.each([
            ['/dashboard/activity-schedules/schedule-1', { activityScheduleId: 'schedule-1' }],
            ['/dashboard/plants/plant-1/details', { plantId: 'plant-1' }],
            ['/dashboard/plants/plant-1/edit', { plantId: 'plant-1' }],
            ['/dashboard/planting-years/2026', { year: '2026' }],
            ['/dashboard/plantings/planting-1/details', { plantingId: 'planting-1' }],
        ])('passes the id in %s as a route param', (path, params) => {
            expect(router.resolve(path).params).toEqual(params);
        });

        // The add page's path would also match the details page's :year
        it('resolves planting-years/add to the add page, not to a year called "add"', () => {
            expect(router.resolve('/dashboard/planting-years/add').params).toEqual({});
        });

        // As feral-authentication's router does (backlog A8)
        it.each([
            ['/no-such-page', 'NotFound'],
            ['/dashboard/no-such-page', 'DashboardNotFound'],
        ])('shows the not-found page for %s', (path, name) => {
            expect(router.resolve(path).name).toBe(name);
        });
    });

    describe('guard', () => {
        let store;

        beforeEach(async () => {
            localStorage.clear();
            sessionStorage.clear();
            setActivePinia(createPinia());
            store = useAuthenticationStore();
            vi.spyOn(console, 'log').mockImplementation(() => {});
            // Start each test from a page the guard always allows
            await router.push('/');
        });

        afterEach(() => {
            vi.resetAllMocks();
            vi.restoreAllMocks();
        });

        // A token from an earlier visit, in a store created after it, as on a reload
        function reloadWithStoredToken() {
            localStorage.setItem('vigilant-token', 'a-token');
            setActivePinia(createPinia());
        }

        it.each(['/', '/landing', '/landing?sso=sso-token'])('lets anyone open %s', async path => {
            await router.push(path);

            expect(router.currentRoute.value.fullPath).toBe(path);
        });

        it.each(protectedPaths)('sends someone not logged in from %s to the landing page, without asking the service', async path => {
            await router.push(path);

            expect(router.currentRoute.value.name).toBe('LandingPage');
            expect(authenticationApi.verifyActorToken).not.toHaveBeenCalled();
        });

        // In sessionStorage, which survives the round trip to
        // feral-authentication; the landing page follows it (backlog A9)
        it('remembers where they were going, for after signing on', async () => {
            await router.push('/dashboard/plants/plant-1/details?tab=growing');

            expect(router.currentRoute.value.fullPath).toBe('/landing');
            expect(sessionStorage.getItem('sign-on-destination')).toBe('/dashboard/plants/plant-1/details?tab=growing');
        });

        it.each(protectedPaths)('lets someone logged in open %s', async path => {
            store.$patch({ isAuthenticated: true });

            await router.push(path);

            expect(router.currentRoute.value.path).toBe(path);
            expect(authenticationApi.verifyActorToken).not.toHaveBeenCalled();
        });

        // The not-found page is open at the top level, and behind the guard
        // under the dashboard (backlog A8)
        it('lets anyone open an unknown top-level path', async () => {
            await router.push('/no-such-page');

            expect(router.currentRoute.value.name).toBe('NotFound');
        });

        it('sends someone not logged in from an unknown dashboard path to the landing page', async () => {
            await router.push('/dashboard/no-such-page');

            expect(router.currentRoute.value.name).toBe('LandingPage');
        });

        it('lets someone with a stored token the service accepts open the page they reload', async () => {
            reloadWithStoredToken();
            authenticationApi.verifyActorToken.mockResolvedValue(true);

            await router.push('/dashboard/plants');

            expect(authenticationApi.verifyActorToken).toHaveBeenCalledWith('a-token');
            expect(router.currentRoute.value.path).toBe('/dashboard/plants');
        });

        it('checks an accepted token only once', async () => {
            reloadWithStoredToken();
            authenticationApi.verifyActorToken.mockResolvedValue(true);

            await router.push('/dashboard/plants');
            await router.push('/dashboard/plots');

            expect(authenticationApi.verifyActorToken).toHaveBeenCalledTimes(1);
        });

        it('sends someone whose stored token the service rejects to the landing page', async () => {
            reloadWithStoredToken();
            authenticationApi.verifyActorToken.mockResolvedValue(false);

            await router.push('/dashboard/plants');

            expect(router.currentRoute.value.name).toBe('LandingPage');
        });

        // It's forgotten, so the next protected page sends them to sign on
        // without asking the service again (backlog B7)
        it('forgets a rejected token, and asks about it once', async () => {
            reloadWithStoredToken();
            authenticationApi.verifyActorToken.mockResolvedValue(false);

            await router.push('/dashboard/plants');
            await router.push('/dashboard/plots');

            expect(localStorage.getItem('vigilant-token')).toBeNull();
            expect(authenticationApi.verifyActorToken).toHaveBeenCalledTimes(1);
            expect(router.currentRoute.value.name).toBe('LandingPage');
        });
    });
});
