import { RouteRecordRaw } from 'vue-router';

const DevRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dev',
        name: 'Dev',
        component: () => import('@views/Dev.vue'),
        meta: { title: '开发页面', requiresAuth: false },
    }
];

export default DevRoutes;