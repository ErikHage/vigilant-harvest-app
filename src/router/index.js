import { createRouter, createWebHistory } from 'vue-router';
import PlantsPage from "@/views/PlantsPage.vue";
import DashboardPage from "@/views/DashboardPage.vue";
import { useAuthenticationStore } from "@/store";

const routes = [
  {
    path: '/dashboard',
    name: 'DashboardPage',
    component: DashboardPage,
    meta: {
      requiresAuthenticated: true,
    },
    children: [
      {
        path: 'plants',
        name: 'PlantsPage',
        component: PlantsPage,
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

router.beforeEach((to, from) => {
    const user = useAuthenticationStore();
    const requiresAuthenticated = to.matched.some(record => record.meta.requiresAuthenticated);

    if (requiresAuthenticated && !user.isAuthenticated) {
      console.log('sending you back to Login');
      // TODO do we send back feral auth, or to App?
      // return { name: 'Login' };
    }
});

export default router;
