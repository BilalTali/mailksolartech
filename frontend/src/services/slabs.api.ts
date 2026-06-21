import axios from './axios';
import { ApiResponse, CommissionSlab } from '../types';

export const slabsApi = {
    admin: {
        getAll: async () => {
            const { data } = await axios.get<ApiResponse<CommissionSlab[]>>('/admin/commission-slabs');
            return data;
        },
        create: async (payload: Partial<CommissionSlab>) => {
            const { data } = await axios.post<ApiResponse<CommissionSlab>>('/admin/commission-slabs', payload);
            return data;
        },
        update: async (id: number, payload: Partial<CommissionSlab>) => {
            const { data } = await axios.put<ApiResponse<CommissionSlab>>(`/admin/commission-slabs/${id}`, payload);
            return data;
        },
        delete: async (id: number) => {
            const { data } = await axios.delete<ApiResponse<void>>(`/admin/commission-slabs/${id}`);
            return data;
        }
    },
    superAgent: {
        getEffective: async () => {
            const { data } = await axios.get<ApiResponse<CommissionSlab[]>>('/super-agent/commission-slabs');
            return data;
        },
        saveCustom: async (payload: { capacity: string, agent_commission: number, super_agent_override: number, enumerator_commission: number, label?: string }) => {
            const { data } = await axios.post<ApiResponse<CommissionSlab>>('/super-agent/commission-slabs', payload);
            return data;
        }
    },
    superAdmin: {
        /** List all system-default slabs (1kW–10kW) with super_admin_rate */
        getAll: async (): Promise<{ data: CommissionSlab[] }> => {
            const { data } = await axios.get<ApiResponse<CommissionSlab[]>>('/super-admin/commission-slabs');
            return data;
        },
        /** Update a single slab's super_admin_rate */
        update: async (id: number, superAdminRate: number) => {
            const { data } = await axios.put(`/super-admin/commission-slabs/${id}`, { super_admin_rate: superAdminRate });
            return data;
        },
        /** Bulk update all slab rates */
        bulkUpdate: async (slabs: { id: number; super_admin_rate: number }[]) => {
            const { data } = await axios.put('/super-admin/commission-slabs/bulk', { slabs });
            return data;
        },
        /** Get rate for a specific capacity string e.g. "3kw" */
        getRateForCapacity: async (capacity: string) => {
            const { data } = await axios.get(`/super-admin/commission-slabs/rate/${capacity.toLowerCase()}`);
            return data as { success: boolean; data: { capacity: string; super_admin_rate: number; label?: string; found: boolean } };
        },
    }
};
