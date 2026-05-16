import api from './axios';
import type { User, ApiResponse, PaginatedResponse } from '@/types';

export const agentsApi = {
    registerAgent: async (data: FormData | Record<string, unknown>) => {
        const res = await api.post<ApiResponse<{ reference: string }>>('/public/agent-register', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
        });
        return res.data;
    },

    getAdminAgents: async (params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<User>>>('/admin/agents', { params });
        return res.data;
    },
    getAdminAgent: async (id: number) => {
        const res = await api.get<ApiResponse<User>>(`/admin/agents/${id}`);
        return res.data;
    },
    createAgent: async (data: Record<string, unknown>) => {
        const res = await api.post<ApiResponse<User>>('/admin/agents', data);
        return res.data;
    },
    updateAgent: async (id: number, data: Record<string, unknown>) => {
        const res = await api.put<ApiResponse<User>>(`/admin/agents/${id}`, data);
        return res.data;
    },
    updateAgentStatus: async (id: number, status: string) => {
        const res = await api.put<ApiResponse<User>>(`/admin/agents/${id}/status`, { status });
        return res.data;
    },
    deleteAgent: async (id: number) => {
        const res = await api.delete<ApiResponse<null>>(`/admin/agents/${id}`);
        return res.data;
    },
    regenerateQr: async (id: number) => {
        const res = await api.post<ApiResponse<User>>(`/admin/agents/${id}/regenerate-qr`);
        return res.data;
    },
    getQrScans: async (id: number, params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<any>>>(`/admin/agents/${id}/qr-scans`, { params });
        return res.data;
    },
    updateMyProfile: async (data: Record<string, unknown>) => {
        const res = await api.put<ApiResponse<User>>('/agent/profile', data);
        return res.data;
    },
    getSelfQrScans: async (params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<any>>>('/agent/profile/qr-scans', { params });
        return res.data;
    },
    // Alias used by admin modals
    getAgents: async (params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<User>>>('/admin/agents', { params });
        return res.data;
    },
    getNotifications: async (params?: { page?: number; per_page?: number }) => {
        const res = await api.get('/agent/notifications', { params });
        return res.data;
    },
    markNotificationAsRead: async (id: number) => {
        const res = await api.put(`/agent/notifications/${id}/read`);
        return res.data;
    },
};
