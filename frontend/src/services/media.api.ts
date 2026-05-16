import api from './axios';
import type { ApiResponse } from '@/types';

export interface AdminMedia {
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

export const mediaApi = {
    list: async (): Promise<AdminMedia[]> => {
        const res = await api.get<ApiResponse<AdminMedia[]>>('/admin/media');
        return res.data.data ?? [];
    },
    create: async (data: FormData): Promise<AdminMedia> => {
        const res = await api.post<ApiResponse<AdminMedia>>('/admin/media', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.data as AdminMedia;
    },
    update: async (id: number, data: FormData): Promise<AdminMedia> => {
        // We use POST with _method=PUT for multipart updates in Laravel
        if (!(data instanceof FormData)) {
            const res = await api.put<ApiResponse<AdminMedia>>(`/admin/media/${id}`, data);
            return res.data.data as AdminMedia;
        }
        data.append('_method', 'PATCH');
        const res = await api.post<ApiResponse<AdminMedia>>(`/admin/media/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.data as AdminMedia;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin/media/${id}`);
    }
};
