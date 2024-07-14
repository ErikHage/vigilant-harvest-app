export const applicationId = '82d7d287-978b-4df1-bc3d-526838b2465b';

export const feralAuthenticationServiceUrl = {
    v0: {
        auth: 'http://localhost:8003/v0/auth',
        api: 'http://localhost:8003/v0/api',
    },
};

export const vigilantHarvestServiceUrl = {
    v0: {
        api: 'http://localhost:8002/v0/api',
    },
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
            plants: {
                name: 'PlantsPage',
                path: 'plants',
            },
            plots: {
                name: 'PlotsPage',
                path: 'plots',
            },
        },
    },
};