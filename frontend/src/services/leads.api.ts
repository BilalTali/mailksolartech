import api from './axios';
import type { Lead, LeadVerification, ApiResponse, PaginatedResponse } from '@/types';

export const leadsApi = {
    // ── Public ──────────────────────────────────────────────────────
    submitPublicLead: async (data: Record<string, unknown>) => {
        const res = await api.post<ApiResponse<{ reference: string }>>('/public/leads', data);
        return res.data;
    },
    submitPublicLeadForm: async (data: FormData) => {
        const res = await api.post<ApiResponse<{ reference: string }>>('/public/leads', data);
        return res.data;
    },

    // ── Agent ────────────────────────────────────────────────────────
    getAgentLeads: async (params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<Lead>>>('/agent/leads', { params });
        return res.data;
    },
    getAgentLeadByUlid: async (ulid: string) => {
        const res = await api.get<ApiResponse<Lead>>(`/agent/leads/${ulid}`);
        return res.data;
    },
    submitAgentLead: async (data: FormData) => {
        const res = await api.post<ApiResponse<Lead>>('/agent/leads', data);
        return res.data;
    },
    resubmitAgentLead: async (ulid: string, data: FormData) => {
        const res = await api.put<ApiResponse<Lead>>(`/agent/leads/${ulid}/resubmit`, data);
        return res.data;
    },
    getAgentLeadVerificationHistory: async (ulid: string) => {
        const res = await api.get<ApiResponse<LeadVerification[]>>(`/agent/leads/${ulid}/verification-history`);
        return res.data;
    },
    uploadAgentDocument: async (ulid: string, data: FormData) => {
        const res = await api.post<ApiResponse<unknown>>(`/agent/leads/${ulid}/documents`, data);
        return res.data;
    },
    verifyAgentLead: async (ulid: string, notes?: string) => {
        const res = await api.put<ApiResponse<Lead>>(`/agent/leads/${ulid}/verify`, { notes });
        return res.data;
    },
    revertAgentLead: async (ulid: string, reason: string) => {
        const res = await api.put<ApiResponse<Lead>>(`/agent/leads/${ulid}/revert`, { reason });
        return res.data;
    },

    // ── Super Agent ───────────────────────────────────────────────────
    getSALeads: async (params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<Lead>>>('/super-agent/leads', { params });
        return res.data;
    },
    getSALeadByUlid: async (ulid: string) => {
        const res = await api.get<ApiResponse<Lead>>(`/super-agent/leads/${ulid}`);
        return res.data;
    },
    submitSALead: async (data: FormData) => {
        const res = await api.post<ApiResponse<Lead>>('/super-agent/leads', data);
        return res.data;
    },
    verifySALead: async (ulid: string, notes?: string) => {
        const res = await api.put<ApiResponse<Lead>>(`/super-agent/leads/${ulid}/verify`, { notes });
        return res.data;
    },
    revertSALead: async (ulid: string, reason: string) => {
        const res = await api.put<ApiResponse<Lead>>(`/super-agent/leads/${ulid}/revert`, { reason });
        return res.data;
    },
    assignSALeadToAgent: async (ulid: string, agent_id: number) => {
        const res = await api.put<ApiResponse<Lead>>(`/super-agent/leads/${ulid}/assign-agent`, { agent_id });
        return res.data;
    },
    getSALeadVerificationHistory: async (ulid: string) => {
        const res = await api.get<ApiResponse<LeadVerification[]>>(`/super-agent/leads/${ulid}/verification-history`);
        return res.data;
    },

    // ── Admin ────────────────────────────────────────────────────────
    getAdminLeads: async (params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<Lead>>>('/admin/leads', { params });
        return res.data;
    },
    getAdminLeadByUlid: async (ulid: string) => {
        const res = await api.get<ApiResponse<Lead>>(`/admin/leads/${ulid}`);
        return res.data;
    },
    updateAdminLead: async (ulid: string, data: Record<string, unknown>) => {
        const res = await api.put<ApiResponse<Lead>>(`/admin/leads/${ulid}`, data);
        return res.data;
    },
    updateLeadStatus: async (ulid: string, data: FormData) => {
        // Handle PUT workaround for multipart/form-data in Laravel
        if (!data.has('_method')) data.append('_method', 'PUT');
        const res = await api.post<ApiResponse<Lead>>(`/leads/${ulid}/status`, data);
        return res.data;
    },
    getAvailableStatuses: async (ulid: string) => {
        const res = await api.get<ApiResponse<{ statuses: string[], requires_geotag: string[] }>>(`/leads/${ulid}/available-statuses`);
        return res.data;
    },
    // Unified commission entry
    enterCommission: async (ulid: string, payload: { payee_id: number; amount: number }) => {
        const res = await api.post<ApiResponse<unknown>>(`/admin/leads/${ulid}/commission/enter`, payload);
        return res.data;
    },
    /** @deprecated Use assignLeadToSuperAgent or assignLeadToAgent */
    assignLead: async (ulid: string, super_agent_id: number) => {
        const res = await api.put<ApiResponse<Lead>>(`/admin/leads/${ulid}/assign`, { super_agent_id });
        return res.data;
    },

    assignLeadToSuperAgent: async (ulid: string, super_agent_id: number) => {
        const res = await api.put<ApiResponse<Lead>>(`/admin/leads/${ulid}/assign-super-agent`, { super_agent_id });
        return res.data;
    },
    assignLeadToAgent: async (ulid: string, agent_id: number) => {
        const res = await api.put<ApiResponse<Lead>>(`/admin/leads/${ulid}/assign-agent`, { agent_id });
        return res.data;
    },
    assignTechnicians: async (ulid: string, payload: { surveyor_id?: number | null, installer_id?: number | null }) => {
        const res = await api.put<ApiResponse<Lead>>(`/admin/leads/${ulid}/assign-technicians`, payload);
        return res.data;
    },
    overrideVerification: async (ulid: string, reason: string) => {
        const res = await api.put<ApiResponse<Lead>>(`/admin/leads/${ulid}/override-verification`, { reason });
        return res.data;
    },
    uploadAdminDocument: async (ulid: string, data: FormData) => {
        const res = await api.post<ApiResponse<unknown>>(`/admin/leads/${ulid}/documents`, data);
        return res.data;
    },
    assignAgentToSuperAgent: async (agentId: number, super_agent_id: number, force = false) => {
        const res = await api.put<ApiResponse<unknown>>(`/admin/agents/${agentId}/assign-super-agent`, { super_agent_id, force });
        return res.data;
    },
};
