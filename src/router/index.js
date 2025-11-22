import {createRouter, createWebHistory} from 'vue-router';

import {useAuthenticationStore} from "@/store";
import {views} from '@/utils/constants';

import LandingPage from "@/components/views/LandingPage.vue";
import LoginPage from "@/components/views/LoginPage.vue";
import DashboardPage from "@/components/views/DashboardPage.vue";
import DashboardDefaultPage from "@/components/views/dashboard/DashboardDefaultPage.vue";
import PlantsPage from "@/components/views/dashboard/plants/PlantsPage.vue";
import PlantEditPage from "@/components/views/dashboard/plants/PlantEditPage.vue";
import PlotsPage from "@/components/views/dashboard/plots/PlotsPage.vue";
import PlantingsPage from "@/components/views/dashboard/plantings/PlantingsPage.vue";
import GardenPage from "@/components/views/dashboard/garden/GardenPage.vue";
import HarvestsPage from "@/components/views/dashboard/harvests/HarvestsPage.vue";
import PlantingStatsPage from "@/components/views/dashboard/stats/PlantingStatsPage.vue";
import PlantStatsPage from "@/components/views/dashboard/stats/PlantStatsPage.vue";
import PlantDetailsPage from "@/components/views/dashboard/plants/PlantDetailsPage.vue";
import PlantingDetailsPage from "@/components/views/dashboard/plantings/PlantingDetailsPage.vue";
import PlanningPage from "@/components/views/dashboard/planning/PlanningPage.vue";
import GardenJournalPage from "@/components/views/dashboard/garden/GardenJournalPage.vue";
import GardenActivityLogPage from "@/components/views/dashboard/garden/GardenActivityLogPage.vue";
import PlantingYearsPage from "@/components/views/dashboard/years/PlantingYearsPage.vue";
import PlantingYearDetailsPage from "@/components/views/dashboard/years/PlantingYearDetailsPage.vue";

const routes = [
    {
        path: views.login.path,
        name: views.login.name,
        component: LoginPage,
        meta: {
            requiresAuthenticated: false,
        },
    },
    {
        path: views.landing.path,
        name: views.landing.name,
        component: LandingPage,
        meta: {
            requiresAuthenticated: false,
        },
    },
    {
        path: views.dashboard.path,
        name: views.dashboard.name,
        component: DashboardPage,
        meta: {
            requiresAuthenticated: true,
        },
        children: [
            {
                path: views.dashboard.children.default.path,
                name: views.dashboard.children.default.name,
                component: DashboardDefaultPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.garden.path,
                name: views.dashboard.children.garden.name,
                component: GardenPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.journal.path,
                name: views.dashboard.children.journal.name,
                component: GardenJournalPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.activityLog.path,
                name: views.dashboard.children.activityLog.name,
                component: GardenActivityLogPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.planning.path,
                name: views.dashboard.children.planning.name,
                component: PlanningPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.plants.path,
                name: views.dashboard.children.plants.name,
                component: PlantsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.plants.details.path,
                name: views.dashboard.children.plants.details.name,
                component: PlantDetailsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.plants.edit.path,
                name: views.dashboard.children.plants.edit.name,
                component: PlantEditPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.plots.path,
                name: views.dashboard.children.plots.name,
                component: PlotsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.years.path,
                name: views.dashboard.children.years.name,
                component: PlantingYearsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.years.details.path,
                name: views.dashboard.children.years.details.name,
                component: PlantingYearDetailsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.plantings.path,
                name: views.dashboard.children.plantings.name,
                component: PlantingsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.plantings.details.path,
                name: views.dashboard.children.plantings.details.name,
                component: PlantingDetailsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.harvests.path,
                name: views.dashboard.children.harvests.name,
                component: HarvestsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.stats.planting.path,
                name: views.dashboard.children.stats.planting.name,
                component: PlantingStatsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
            {
                path: views.dashboard.children.stats.plant.path,
                name: views.dashboard.children.stats.plant.name,
                component: PlantStatsPage,
                meta: {
                    requiresAuthenticated: true,
                },
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory('/apps/vigilant-harvest/'),
    routes,
});

router.beforeEach(async (to /*, from */) => {
    const authenticationStore = useAuthenticationStore();
    const requiresAuthenticated = to.matched.some(record => record.meta.requiresAuthenticated);

    if (requiresAuthenticated) {
        if (authenticationStore.isAuthenticated) {
            return;
        }

        if (authenticationStore.tokenPresent()) {
            await authenticationStore.verifyToken();
            if (authenticationStore.isAuthenticated) {
                return;
            }
        }

        console.log('sending you back to Landing');
        return {name: 'LandingPage'};
    }
});

export default router;
