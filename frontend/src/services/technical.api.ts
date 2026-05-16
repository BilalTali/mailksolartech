import api from './axios';

export const technicalApi = {
    getStats: async () => {
        const res = await api.get('/technical/stats');
        return res.data;
    },
    getAssignedLeads: async () => {
        const res = await api.get('/technical/leads');
        return res.data;
    },
    submitVisit: async (ulid: string, data: FormData) => {
        const res = await api.post(`/technical/leads/${ulid}/visit`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    getProfile: async () => {
        const res = await api.get('/technical/profile');
        return res.data;
    },
    updateProfile: async (data: any) => {
        const res = await api.put('/technical/profile', data);
        return res.data;
    }
};
