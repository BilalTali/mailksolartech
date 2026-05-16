import axios from './axios';
import { ApiResponse } from '../types';

export const joiningLetterApi = {
    /**
     * Get a temporary signed URL for downloading the joining letter
     */
    getDownloadUrl: async (userId?: number): Promise<string> => {
        const response = await axios.get<ApiResponse<{ download_url: string }>>('/joining-letter/download-url', {
            params: { userId }
        });
        return response.data.data.download_url;
    },

    /**
     * For Admin: Get preview URL for a specific agent/super agent
     */
    getAdminPreviewUrl: (userId: number): string => {
        // Direct web route for admin joining letter preview
        return `/admin/joining-letter/${userId}/preview`;
    }
};
