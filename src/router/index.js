import { createRouter, createWebHistory } from 'vue-router';

import { useAuthenticationStore } from "@/store";
import { views } from '@/utils/constants';

import PlantsPage from "@/components/views/dashboard/PlantsPage.vue";
import DashboardPage from "@/components/views/DashboardPage.vue";
import LandingPage from "@/components/views/LandingPage.vue";
import LoginPage from "@/components/views/LoginPage.vue";
import PublicPage from "@/components/views/PublicPage.vue";
import PlotsPage from "@/components/views/dashboard/PlotsPage.vue";
import DashboardDefaultPage from "@/components/views/dashboard/DashboardDefaultPage.vue";
import PlantingsPage from "@/components/views/dashboard/PlantingsPage.vue";
import GardenPage from "@/components/views/dashboard/GardenPage.vue";
import HarvestsPage from "@/components/views/dashboard/HarvestsPage.vue";

const routes = [
    {
        path: views.public.path,
        name: views.public.name,
        component: PublicPage,
        meta: {
            requiresAuthenticated: false,
        },
    },
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
                path: views.dashboard.children.plants.path,
                name: views.dashboard.children.plants.name,
                component: PlantsPage,
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
                path: views.dashboard.children.plantings.path,
                name: views.dashboard.children.plantings.name,
                component: PlantingsPage,
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

        ],
    },
];

const router = createRouter({
    history: createWebHistory('/apps/vigilant-harvest/'),
    routes
});

router.beforeEach((to /*, from */) => {
    const user = useAuthenticationStore();
    const requiresAuthenticated = to.matched.some(record => record.meta.requiresAuthenticated);

    if (requiresAuthenticated && !user.isAuthenticated) {
        console.log('sending you back to Landing');
        return { name: 'LandingPage' };
    }
});

export default router;
