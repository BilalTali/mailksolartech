import api from './axios';
import type { ApiResponse } from '@/types';

export interface AdminDocument {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    file_url: string | null;
    download_url: string | null;
    thumbnail_url: string | null;
    is_published: boolean;
    sort_order: number;
    created_at: string;
}

export const documentsApi = {
    list: async (): Promise<AdminDocument[]> => {
        const res = await api.get<ApiResponse<AdminDocument[]>>('/admin/documents');
        return res.data.data ?? [];
    },
    // For agents/super agents (authenticated)
    getResources: async (): Promise<AdminDocument[]> => {
        const res = await api.get<ApiResponse<AdminDocument[]>>('/documents');
        return res.data.data ?? [];
    },
    create: async (data: FormData): Promise<AdminDocument> => {
        const res = await api.post<ApiResponse<AdminDocument>>('/admin/documents', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.data as AdminDocument;
    },
    update: async (id: number, data: FormData): Promise<AdminDocument> => {
        data.append('_method', 'PATCH');
        const res = await api.post<ApiResponse<AdminDocument>>(`/admin/documents/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.data as AdminDocument;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin/documents/${id}`);
    }
};
