import { createRouter, createWebHistory } from 'vue-router';
import PlantsPage from "@/views/PlantsPage.vue";

const routes = [
  {
    path: '/plants',
    name: 'PlantsPage',
    component: PlantsPage,
    meta: {
      requiresAuthenticated: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory('/apps/vigilant-harvest/'),
  routes
});

// TODO implement authentication
// router.beforeEach((to, from) => {
//     const user = useAuthenticationStore();
//     const requiresAuthenticated = to.matched.some(record => record.meta.requiresAuthenticated);
//
//     if (requiresAuthenticated && !user.isAuthenticated && to.name !== 'Login') { // ❗️ Avoid an infinite redirect
//         console.log('sending you back to Login');
//         return { name: 'Login' };
//     }
// });

export default router;
