import api from './axios';
import type { ApiResponse, LeadVerification } from '@/types';

/**
 * Verification API — fetches the immutable audit trail for a lead.
 * Role parameter determines the API prefix used.
 */
export const verificationApi = {
    getHistory: async (ulid: string, role: 'admin' | 'super_agent' | 'agent'): Promise<LeadVerification[]> => {
        const prefix = role === 'super_agent' ? 'super-agent' : role;
        const res = await api.get<ApiResponse<LeadVerification[]>>(`/${prefix}/leads/${ulid}/verification-history`);
        return res.data.data;
    },
};
