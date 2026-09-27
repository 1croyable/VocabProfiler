import { defineStore } from 'pinia';

interface Alert {
    message: string;
    type: 'alert-success' | 'alert-danger';
}

interface AlertState {
    alert: Alert | null;
    loading: boolean;
    loadingCount: number;
}

export const useAlertStore = defineStore('alert',{
    state: (): AlertState => ({
        alert: null,
        loading: false,
        loadingCount: 0
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
            this.loadingCount = Math.max(0, this.loadingCount + (isLoading ? 1 : -1));
            this.loading = this.loadingCount > 0;
        }
    }
});
