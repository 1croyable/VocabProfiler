import { defineStore } from 'pinia';

interface Alert {
    message: string;
    type: 'alert-success' | 'alert-danger';
}

interface AlertState {
    alert: Alert | null;
    loading: boolean;
}

export const useAlertStore = defineStore('alert',{
    state: (): AlertState => ({
        alert: null,
        loading: false
    }),
    actions: {
        success(message: string) {
            this.alert = { message, type: 'alert-success' };
        },
        error(message: string) {
            this.alert = { message, type: 'alert-danger' };
        },
        clear() {
            this.alert = null;
        },
        setLoading(isLoading: boolean) {
            this.loading = isLoading;
        }
    }
});