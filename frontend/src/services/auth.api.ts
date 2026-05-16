import api from './axios';
import type { User, ApiResponse } from '@/types';

export const authApi = {
    sendOtp: async (data: { identifier: string; password?: string; role: string }) => {
        const res = await api.post<ApiResponse<{ skip_otp?: boolean; token?: string; user?: User } | null>>('/auth/send-otp', data);
        return res.data;
    },

    loginOtp: async (identifier: string, otp: string, role: string) => {
        const res = await api.post<ApiResponse<{ token: string; user: User; requires_password_set?: boolean }>>('/auth/login-otp', { identifier, otp, role });
        return res.data;
    },

    logout: async () => {
        const res = await api.post<ApiResponse<null>>('/auth/logout');
        return res.data;
    },

    me: async () => {
        const res = await api.get<ApiResponse<User>>('/auth/me');
        return res.data;
    },

    setPassword: async (data: { password: string; password_confirmation: string }) => {
        const res = await api.post<ApiResponse<null>>('/auth/set-password', data);
        return res.data;
    },
    uploadProfilePhoto: async (file: File) => {
        const formData = new FormData();
        formData.append('photo', file);
        const res = await api.post<ApiResponse<User>>('/auth/profile-photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    },
    changePassword: async (data: { current_password?: string; password: string; password_confirmation: string }) => {
        const res = await api.put<ApiResponse<null>>('/profile/change-password', data);
        return res.data;
    },
    forgotPassword: async (data: { identifier: string; role?: string }) => {
        const res = await api.post<{ success: boolean; message: string; debug_otp?: string }>('/auth/forgot-password', data);
        return res.data;
    },
    resetPassword: async (data: { identifier: string; otp: string; password: string; password_confirmation: string; role?: string }) => {
        const res = await api.post<{ success: boolean; message: string }>('/auth/reset-password', data);
        return res.data;
    },
};
