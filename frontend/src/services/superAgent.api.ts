import api from './axios';
import type { Lead, PaginatedResponse, SuperAgentDashboardStats, User } from '@/types';

export const superAgentApi = {
    // Dashboard
    getDashboardStats: async () => {
        const res = await api.get<{ success: boolean; data: SuperAgentDashboardStats }>('/super-agent/dashboard/stats');
        return res.data;
    },

    // Team Business Development Executives
    getMyTeam: async (params?: Record<string, unknown>) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<User> }>('/super-agent/agents', { params });
        return res.data;
    },
    createAgent: async (data: FormData | Record<string, unknown>) => {
        const res = await api.post<{ success: boolean; message: string; data: User }>('/super-agent/agents', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
        });
        return res.data;
    },
    getAgentDetail: async (agentId: number) => {
        const res = await api.get<{ success: boolean; data: User & { stats: Record<string, number> } }>(`/super-agent/agents/${agentId}`);
        return res.data;
    },

    // Leads
    getLeads: async (params?: Record<string, unknown>) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<Lead> }>('/super-agent/leads', { params });
        return res.data;
    },
    getLeadDetail: async (ulid: string) => {
        const res = await api.get<{ success: boolean; data: Lead }>(`/super-agent/leads/${ulid}`);
        return res.data;
    },
    updateLeadNotes: async (ulid: string, data: { notes?: string; follow_up_date?: string }) => {
        const res = await api.put<{ success: boolean; data: Lead }>(`/super-agent/leads/${ulid}/notes`, data);
        return res.data;
    },
    assignLead: async (ulid: string, agent_id: number) => {
        const res = await api.put<{ success: boolean; message: string }>(`/super-agent/leads/${ulid}/assign`, { agent_id });
        return res.data;
    },
    createLead: async (data: FormData) => {
        const res = await api.post<{ success: boolean; data: Lead; message: string }>('/super-agent/leads', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    uploadLeadDocument: async (ulid: string, formData: FormData) => {
        const res = await api.post(`/super-agent/leads/${ulid}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },

    // Commissions
    getCommissions: async (params?: Record<string, unknown>) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<any> }>('/super-agent/commissions', { params });
        return res.data;
    },
    getCommissionSummary: async () => {
        const res = await api.get<{ success: boolean; data: any }>('/super-agent/commissions/summary');
        return res.data;
    },
    getCommissionSlabs: async () => {
        const res = await api.get<{ success: boolean; data: any[] }>('/super-agent/commissions/slabs');
        return res.data;
    },
    storeCommissionSlab: async (data: any) => {
        const res = await api.post<{ success: boolean; data: any }>('/super-agent/commissions/slabs', data);
        return res.data;
    },
    deleteCommissionSlab: async (id: number) => {
        const res = await api.delete<{ success: boolean }>('/super-agent/commissions/slabs/' + id);
        return res.data;
    },

    getIncentiveOffers: async () => {
        const res = await api.get<{ success: boolean; data: any[] }>('/super-agent/commissions/offers');
        return res.data;
    },
    storeIncentiveOffer: async (data: any) => {
        const res = await api.post<{ success: boolean; data: any }>('/super-agent/commissions/offers', data);
        return res.data;
    },
    deleteIncentiveOffer: async (id: number) => {
        const res = await api.delete<{ success: boolean }>('/super-agent/commissions/offers/' + id);
        return res.data;
    },

    payAgent: async (id: number, data: { payment_method: string; payment_ref: string }) => {
        const res = await api.put<{ success: boolean; message: string }>('/super-agent/commissions/' + id + '/pay-agent', data);
        return res.data;
    },

    // Notifications
    getNotifications: async () => {
        const res = await api.get('/super-agent/notifications');
        return res.data;
    },
    markNotificationRead: async (id: number) => {
        const res = await api.put(`/super-agent/notifications/${id}/read`);
        return res.data;
    },
    markAllNotificationsRead: async () => {
        const res = await api.put('/super-agent/notifications/mark-all-read');
        return res.data;
    },

    // Profile
    getProfile: async () => {
        const res = await api.get<{ success: boolean; data: User }>('/super-agent/profile');
        return res.data;
    },
    updateProfile: async (data: Partial<User>) => {
        const res = await api.put<{ success: boolean; data: User }>('/super-agent/profile', data);
        return res.data;
    },
    changePassword: async (data: { current_password: string; password: string; password_confirmation: string }) => {
        const res = await api.put('/super-agent/change-password', data);
        return res.data;
    },
    getQrScans: async (params?: Record<string, unknown>) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<any> }>('/super-agent/profile/qr-scans', { params });
        return res.data;
    },
};
