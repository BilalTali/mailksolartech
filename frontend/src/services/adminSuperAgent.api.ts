import api from './axios';
import type { PaginatedResponse, User, TeamAssignment } from '@/types';

export const adminSuperAgentApi = {
    // Business Development Manager CRUD
    getSuperAgents: async (params?: Record<string, unknown>) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<User> }>('/admin/super-agents', { params });
        return res.data;
    },
    getSuperAgentDetail: async (id: number) => {
        const res = await api.get<{ success: boolean; data: User & { stats: Record<string, unknown> } }>(`/admin/super-agents/${id}`);
        return res.data;
    },
    createSuperAgent: async (data: Record<string, unknown>) => {
        const res = await api.post<{ success: boolean; data: User; message: string }>('/admin/super-agents', data);
        return res.data;
    },
    updateSuperAgent: async (id: number, data: Record<string, unknown>) => {
        const res = await api.put<{ success: boolean; data: User }>(`/admin/super-agents/${id}`, data);
        return res.data;
    },
    updateSuperAgentStatus: async (id: number, status: 'active' | 'inactive') => {
        const res = await api.put(`/admin/super-agents/${id}/status`, { status });
        return res.data;
    },
    deleteSuperAgent: async (id: number) => {
        const res = await api.delete(`/admin/super-agents/${id}`);
        return res.data;
    },
    regenerateQr: async (id: number) => {
        const res = await api.post<{ success: boolean; data: User }>(`/admin/super-agents/${id}/regenerate-qr`);
        return res.data;
    },
    getQrScans: async (id: number, params?: Record<string, unknown>) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<any> }>(`/admin/super-agents/${id}/qr-scans`, { params });
        return res.data;
    },
    togglePublicContact: async (id: number) => {
        const res = await api.put<{ success: boolean; message: string; data: User }>(`/admin/super-agents/${id}/toggle-public-contact`);
        return res.data;
    },

    // Team Assignment
    getSuperAgentTeam: async (id: number) => {
        const res = await api.get<{ success: boolean; data: User[] }>(`/admin/super-agents/${id}/agents`);
        return res.data;
    },
    assignAgent: async (superAgentId: number, agentId: number) => {
        const res = await api.post(`/admin/super-agents/${superAgentId}/agents/assign`, { agent_id: agentId });
        return res.data;
    },
    assignAgentsBulk: async (superAgentId: number, agentIds: number[]) => {
        const res = await api.post(`/admin/super-agents/${superAgentId}/agents/assign-bulk`, { agent_ids: agentIds });
        return res.data;
    },
    unassignAgent: async (superAgentId: number, agentId: number, notes?: string) => {
        const res = await api.delete(`/admin/super-agents/${superAgentId}/agents/${agentId}`, { data: { notes } });
        return res.data;
    },
    getTeamLog: async (superAgentId: number) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<TeamAssignment> }>(`/admin/super-agents/${superAgentId}/team-log`);
        return res.data;
    },
    getUnassignedAgents: async (params?: Record<string, unknown>) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<User> }>('/admin/agents/unassigned', { params });
        return res.data;
    },

    // Override Commissions
    getSuperAgentOverrides: async (superAgentId: number) => {
        const res = await api.get<{ success: boolean; data: PaginatedResponse<any> }>(`/admin/super-agents/${superAgentId}/override-commissions`);
        return res.data;
    },
    approveOverride: async (commissionId: number) => {
        const res = await api.put(`/admin/commissions/${commissionId}/approve-override`);
        return res.data;
    },
    payOverride: async (commissionId: number, data: { payment_ref: string; payment_method: string }) => {
        const res = await api.put(`/admin/commissions/${commissionId}/pay-override`, data);
        return res.data;
    },
};
