import api from './axios';

export const enumeratorApi = {
    getStats: async () => {
        const res = await api.get('/enumerator/dashboard/stats');
        return res.data;
    },
    getLeads: async (params?: Record<string, any>) => {
        const res = await api.get('/enumerator/leads', { params });
        return res.data;
    },
    getLead: async (ulid: string) => {
        const res = await api.get(`/enumerator/leads/${ulid}`);
        return res.data;
    },
    storeLead: async (data: FormData) => {
        const res = await api.post('/enumerator/leads', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    getCommissions: async () => {
        const res = await api.get('/enumerator/commissions');
        return res.data;
    },
    getProfile: async () => {
        const res = await api.get('/enumerator/profile');
        return res.data;
    },
    updateProfile: async (data: any) => {
        const res = await api.put('/enumerator/profile', data);
        return res.data;
    },
    getNotifications: async (params?: { page?: number; per_page?: number }) => {
        const res = await api.get('/enumerator/notifications', { params });
        return res.data;
    },
    markNotificationAsRead: async (id: number) => {
        const res = await api.put(`/enumerator/notifications/${id}/read`);
        return res.data;
    },
    publicRegister: async (data: FormData) => {
        const res = await api.post('/public/enumerator-register', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
};

// For agents to manage their enumerators
export const agentEnumeratorApi = {
    list: async () => {
        const res = await api.get('/agent/enumerators');
        return res.data;
    },
    create: async (data: { name: string; mobile: string }) => {
        const res = await api.post('/agent/enumerators', data);
        return res.data;
    },
    delete: async (id: number) => {
        const res = await api.delete(`/agent/enumerators/${id}`);
        return res.data;
    },
    updateStatus: async (id: number, status: string) => {
        const res = await api.put(`/agent/enumerators/${id}/status`, { status });
        return res.data;
    },
};

// For SA to view and add team enumerators
export const saEnumeratorApi = {
    list: async () => {
        const res = await api.get('/super-agent/enumerators');
        return res.data;
    },
    create: async (data: { name: string; mobile: string; email?: string }) => {
        const res = await api.post('/super-agent/enumerators', data);
        return res.data;
    },
    updateStatus: async (id: number, status: string) => {
        const res = await api.put(`/super-agent/enumerators/${id}/status`, { status });
        return res.data;
    },
};

// For admin
export const adminEnumeratorApi = {
    list: async () => {
        const res = await api.get('/admin/enumerators');
        return res.data;
    },
    create: async (data: { name: string; mobile: string; email?: string }) => {
        const res = await api.post('/admin/enumerators', data);
        return res.data;
    },
    updateStatus: async (id: number, status: string) => {
        const res = await api.put(`/admin/enumerators/${id}/status`, { status });
        return res.data;
    },
};
