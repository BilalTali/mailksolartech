import axios from './axios';
import { ApiResponse, WithdrawalRequest } from '../types';

export const withdrawalsApi = {
    // ==============================
    // ADMIN ENDPOINTS
    // ==============================
    admin: {
        getAll: async (status?: string) => {
            const { data } = await axios.get<ApiResponse<WithdrawalRequest[]>>('/admin/withdrawals', {
                params: { status }
            });
            return data;
        },
        approve: async (id: number, payload: { amount: number; admin_notes?: string }) => {
            const { data } = await axios.put<ApiResponse<WithdrawalRequest>>(`/admin/withdrawals/${id}/approve`, payload);
            return data;
        },
        reject: async (id: number, payload: { admin_notes: string }) => {
            const { data } = await axios.put<ApiResponse<WithdrawalRequest>>(`/admin/withdrawals/${id}/reject`, payload);
            return data;
        },
        markPaid: async (id: number) => {
            const { data } = await axios.put<ApiResponse<WithdrawalRequest>>(`/admin/withdrawals/${id}/mark-paid`);
            return data;
        }
    },

    // ==============================
    // AGENT ENDPOINTS
    // ==============================
    agent: {
        getAll: async () => {
            const { data } = await axios.get<ApiResponse<WithdrawalRequest[]>>('/agent/withdrawals');
            return data;
        },
        create: async (payload: { offer_id: number; points_withdrawn: number; payment_method: string; payment_details: string }) => {
            const { data } = await axios.post<ApiResponse<WithdrawalRequest>>('/agent/withdrawals', payload);
            return data;
        }
    },

    // ==============================
    // ENUMERATOR ENDPOINTS
    // ==============================
    enumerator: {
        getAll: async () => {
            const { data } = await axios.get<ApiResponse<WithdrawalRequest[]>>('/enumerator/withdrawals');
            return data;
        },
        create: async (payload: { offer_id: number; points_withdrawn: number; payment_method: string; payment_details: string }) => {
            const { data } = await axios.post<ApiResponse<WithdrawalRequest>>('/enumerator/withdrawals', payload);
            return data;
        }
    }
};
