export const applicationId = import.meta.env.VITE_APPLICATION_ID;

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
                name: 'Default',
                path: '/',
            },
            garden: {
                name: 'Garden',
                path: 'garden',
            },
            plants: {
                name: 'PlantsPage',
                path: 'plants',
            },
            plots: {
                name: 'PlotsPage',
                path: 'plots',
            },
            plantings: {
                name: 'PlantingsPage',
                path: 'plantings',
            },
        },
    },
};
