import api from './axios';
import type { ApiResponse } from '@/types';

export interface SettingItem {
    id: number;
    key: string;
    value: string | null;
    group: string | null;
    created_at: string;
    updated_at: string;
}

export type SettingsGrouped = Record<string, SettingItem[]>;

export const settingsApi = {
    getSettings: async () => {
        const res = await api.get<ApiResponse<SettingsGrouped>>('/admin/settings');
        return res.data;
    },
    updateSettings: async (settings: { key: string; value: string | null }[]) => {
        const res = await api.put<ApiResponse<null>>('/admin/settings', { settings });
        return res.data;
    },
    updateMyProfile: async (data: Record<string, unknown>) => {
        const res = await api.put<ApiResponse<any>>('/admin/profile', data);
        return res.data;
    },
    uploadSettingsFile: async (key: string, file: File) => {
        const formData = new FormData();
        formData.append('key', key);
        formData.append('file', file);
        const res = await api.post<ApiResponse<{ url: string }>>('/admin/settings/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    }
};
