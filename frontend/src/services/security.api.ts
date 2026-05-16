import api from './axios';
import { useAuthStore } from '@/store/authStore';

const getPrefix = () => {
    const role = useAuthStore.getState().role;
    return role === 'super_admin' ? '/super-admin' : '/admin';
};

export const securityApi = {
    checkStatus: async () => {
        const res = await api.get(`${getPrefix()}/security/check-status`);
        return res.data;
    },
    sendOtp: async () => {
        const res = await api.post(`${getPrefix()}/security/send-otp`);
        return res.data;
    },
    verifyOtp: async (otp: string) => {
        const res = await api.post(`${getPrefix()}/security/verify-otp`, { otp });
        return res.data;
    }
};
