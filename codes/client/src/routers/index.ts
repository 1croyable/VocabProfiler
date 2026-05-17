import { createRouter, Router, createWebHistory, RouteRecordRaw } from 'vue-router';

import HomeRoutes from './home.routes';
import LoginRoutes from './login.routes';

import { useAlertStore } from '../stores';
import { useAuthStore } from '../stores';

const routes: Array<RouteRecordRaw> = [
    ...HomeRoutes,
    ...LoginRoutes,
    { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router: Router = createRouter({
    history: createWebHistory('/'),
    routes,
})

router.beforeEach(async (to, from, next) => {
    const alertStore = useAlertStore();
    const authStore = useAuthStore();
    alertStore.clear();

    if (to.meta.requiresAuth) {
        let user = await authStore.getCurrentUser();
        if (!user) {
            authStore.user = null;
            authStore.returnUrl = to.fullPath;
            next('/login');
        } else {
            next();
        }
    } else if (to.path === '/login') {
        let user = await authStore.getCurrentUser();
        if (user) {
            alertStore.error('您已登录');
            next(from.fullPath);
        } else {
            authStore.user = null;
            next();
        }
    } else {
        next();
    }
});


export default router