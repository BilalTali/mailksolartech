import api from './axios';
import type { ApiResponse } from '@/types';

export interface AdminFeedback {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    message: string;
    rating: number;
    admin_reply: string | null;
    replied_at: string | null;
    is_published: boolean;
    created_at: string;
}

export const feedbacksApi = {
    list: async (): Promise<AdminFeedback[]> => {
        const res = await api.get<ApiResponse<AdminFeedback[]>>('/admin/feedbacks');
        return res.data.data ?? [];
    },
    reply: async (id: number, reply: string): Promise<AdminFeedback> => {
        const res = await api.post<ApiResponse<AdminFeedback>>(`/admin/feedbacks/${id}/reply`, { reply });
        return res.data.data as AdminFeedback;
    },
    togglePublish: async (id: number): Promise<AdminFeedback> => {
        const res = await api.put<ApiResponse<AdminFeedback>>(`/admin/feedbacks/${id}/toggle-publish`);
        return res.data.data as AdminFeedback;
    },
    delete: async (id: number) => {
        await api.delete(`/admin/feedbacks/${id}`);
    },
};
