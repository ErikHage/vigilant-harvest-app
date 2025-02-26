export const applicationId = import.meta.env.VITE_APPLICATION_ID;
export const assetBasePath = import.meta.env.VITE_ASSET_BASE_PATH;

export const feralAuthenticationAppUrl = import.meta.env.VITE_AUTH_APP_BASE_URL;

export const feralAuthenticationServiceUrl = {
    v0: import.meta.env.VITE_AUTH_SERVICE_V0_BASE_URL,
};

export const vigilantHarvestServiceUrl = {
    v0: import.meta.env.VITE_VIGILANT_HARVEST_SERVICE_V0_BASE_URL,
};

export const views = {
    public: {
        name: 'PublicPage',
        path: '/',
    },
    login:  {
        name: 'Login',
        path: '/login',
    },
    landing: {
        name: 'LandingPage',
        path: '/landing',
    },
    dashboard: {
        name: 'DashboardPage',
        path: '/dashboard',
        children: {
            default: {
                name: 'DashboardDefaultPage',
                path: '',
            },
            garden: {
                name: 'Garden',
                path: 'garden',
            },
            planning: {
                name: 'Planning',
                path: 'planning',
            },
            plants: {
                name: 'PlantsPage',
                path: 'plants',
                details: {
                    name: 'PlantDetailsPage',
                    path: 'plants/:plantId/details',
                },
                edit: {
                    name: 'PlantEditPage',
                    path: 'plants/:plantId/edit',
                },
            },
            plots: {
                name: 'PlotsPage',
                path: 'plots',
            },
            plantings: {
                name: 'PlantingsPage',
                path: 'plantings',
                details: {
                    name: 'PlantingDetailsPage',
                    path: 'plantings/:plantingId/details',
                },
            },
            harvests: {
                name: 'HarvestsPage',
                path: 'harvests',
            },
            stats: {
                name: 'StatsPage',
                path: 'stats',
            },
        },
    },
};
