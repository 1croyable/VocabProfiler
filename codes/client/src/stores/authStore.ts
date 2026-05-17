import { defineStore } from 'pinia';
import { axiosWrapper } from '../utilities/axios-wrapper';
import router from '../routers';
import { useAlertStore } from './alertStore';

type User = {
    id: number;
    username: string;
    role: 'user' | 'admin';
};

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        returnUrl: null as string | null // 某个页面需要用户登录，但是用户没登录，这个时候会让用户登录并保存这个页面到returnUrl
    }),
    actions: {
        async login(username: string, password: string) {
            const alertStore = useAlertStore();

            try {
                const res = await axiosWrapper.post<{ message: string; user: User }>(
                    '/user/login',
                    { username, password }
                );

                this.user = res.user;

                router.push(this.returnUrl || '/');
                this.returnUrl = null;

                return true;
            } catch (error) {
                alertStore.error(error as string);
                return false;
            }
        },
        async register(username: string, password: string) {
            const alertStore = useAlertStore();

            try {
                const res = await axiosWrapper.post<{ message: string; user: User }>(
                    '/user/register',
                    { username, password }
                );

                this.user = res.user;

                router.push(this.returnUrl || '/');
                this.returnUrl = null;
                return true;
            } catch (error) {
                alertStore.error(error as string);
                return false;
            }
        },
        async logout() {
            try {
                await axiosWrapper.post<{ message: string }>('/user/logout');
            } catch {}
            this.user = null;
            this.returnUrl = null;

            router.push('/login');
        },
        async getCurrentUser() {
            try {
                const res = await axiosWrapper.get<{ user: User }>('/user/me');
                this.user = res.user;
                return res.user;
            } catch {
                this.user = null;
                return null;
            }
        }
    }
});