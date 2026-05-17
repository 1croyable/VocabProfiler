import { RouteRecordRaw } from 'vue-router';

const LoginRoutes: Array<RouteRecordRaw> = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@views/Login.vue'),
        meta: { title: '登录', requiresAuth: false },
    }
];

export default LoginRoutes;