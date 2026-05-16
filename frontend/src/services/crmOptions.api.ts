import api from './axios';
import type { ApiResponse } from '@/types';

export interface CrmOption {
    id: number;
    category: string;
    label: string;
    value: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const crmOptionsApi = {
    getAll: async (category?: string) => {
        const response = await api.get<ApiResponse<CrmOption[]>>('/super-admin/crm-options', {
            params: { category }
        });
        return response.data;
    },

    create: async (data: Partial<CrmOption>) => {
        const response = await api.post<ApiResponse<CrmOption>>('/super-admin/crm-options', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CrmOption>) => {
        const response = await api.put<ApiResponse<CrmOption>>(`/super-admin/crm-options/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete<ApiResponse<void>>(`/super-admin/crm-options/${id}`);
        return response.data;
    }
};
