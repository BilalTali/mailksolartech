import api from './axios';
import type { ApiResponse } from '@/types';

export interface AdminAchievement {
    id: number;
    title: string;
    winner_name: string | null;
    description: string | null;
    image_url: string | null;
    date: string | null;
    is_published: boolean;
    sort_order: number;
    created_at: string;
}

export const achievementsApi = {
    list: async (): Promise<AdminAchievement[]> => {
        const res = await api.get<ApiResponse<AdminAchievement[]>>('/admin/achievements');
        return res.data.data ?? [];
    },
    create: async (formData: FormData): Promise<AdminAchievement> => {
        const res = await api.post<ApiResponse<AdminAchievement>>('/admin/achievements', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.data as AdminAchievement;
    },
    update: async (id: number, formData: FormData): Promise<AdminAchievement> => {
        formData.append('_method', 'PUT');
        const res = await api.post<ApiResponse<AdminAchievement>>(`/admin/achievements/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.data as AdminAchievement;
    },
    delete: async (id: number) => {
        await api.delete(`/admin/achievements/${id}`);
    },
};
