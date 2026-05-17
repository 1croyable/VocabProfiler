import axios, { AxiosResponse } from 'axios';
import { useAuthStore } from '../stores';

const axiosInstance = axios.create({
    baseURL: `/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.response.use((response: AxiosResponse) => {
    return response.data;
}, (error) => {
    const authStore = useAuthStore();

    if([401, 403].includes(error.response.status))  {
        if(authStore.user) {
            authStore.logout(); // 如果用户已经登录，说明token过期，需要重新登录
        }
        // 在路由守卫里会跳转到登录页并清空状态
    }

    return Promise.reject(error.response.data?.message || error.message);
});

export const axiosWrapper = {
    get: <T>(url: string): Promise<T> => axiosInstance.get(url),
    post: <T>(url: string, body: any = {}): Promise<T> => axiosInstance.post(url, body),
    patch: <T>(url: string, body: any = {}): Promise<T> => axiosInstance.patch(url, body),
    put: <T>(url: string, body: any = {}): Promise<T> => axiosInstance.put(url, body),
    delete: <T>(url: string): Promise<T> => axiosInstance.delete(url)
};