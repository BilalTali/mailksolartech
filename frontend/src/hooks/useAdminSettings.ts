import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/settings.api';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/hooks/useSettings';

const getFileUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').split('/api/v1')[0];
    return `${baseUrl}/storage/${path}`;
};

export function useAdminSettings() {
    const { user } = useAuthStore();
    const publicSettings = useSettings();
    
    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: settingsApi.getSettings,
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Flatten settings for easy access (similar to PublicSettingsData)
    const settings: Record<string, string | null> = {};
    if (response?.data) {
        Object.values(response.data).forEach(group => {
            group.forEach(item => {
                settings[item.key] = item.value;
            });
        });
    }

    return {
        settings,
        isLoading,
        companyName: settings.company_name || publicSettings.companyName || 'SuryaMitra',
        logo: settings.company_logo_2 ? getFileUrl(settings.company_logo_2) : (settings.company_logo ? getFileUrl(settings.company_logo) : publicSettings.logo),
        favicon: settings.company_favicon ? getFileUrl(settings.company_favicon) : publicSettings.favicon,
    };
}
