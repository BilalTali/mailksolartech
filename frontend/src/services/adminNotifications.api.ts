import api from './axios';

export const adminNotificationsApi = {
    getNotifications: async () => {
        const res = await api.get('/admin/notifications');
        return res.data;
    },
    markNotificationAsRead: async (id: number) => {
        const res = await api.put(`/admin/notifications/${id}/read`);
        return res.data;
    },
    markAllNotificationsRead: async () => {
        const res = await api.put('/admin/notifications/mark-all-read');
        return res.data;
    },
};
