import axios from './axios';
import { ApiResponse, Offer, UserOfferProgress, OfferRedemption, TeamOfferPerformance, OfferParticipant, SuperAgentAbsorbedPoint } from '../types';

export const offersApi = {
    // ==============================
    // ADMIN ENDPOINTS
    // ==============================
    admin: {
        getAll: async () => {
            const { data } = await axios.get<ApiResponse<Offer[]>>('/admin/offers');
            return data;
        },
        getOne: async (id: number) => {
            const { data } = await axios.get<ApiResponse<Offer>>(`/admin/offers/${id}`);
            return data;
        },
        create: async (payload: Partial<Offer>) => {
            const { data } = await axios.post<ApiResponse<Offer>>('/admin/offers', payload);
            return data;
        },
        update: async (id: number, payload: any) => {
            const { data } = await axios.post<ApiResponse<Offer>>(`/admin/offers/${id}`, payload);
            return data;
        },
        delete: async (id: number) => {
            const { data } = await axios.delete<ApiResponse<void>>(`/admin/offers/${id}`);
            return data;
        },
        getRedemptions: async (status?: string) => {
            const { data } = await axios.get<ApiResponse<OfferRedemption[]>>('/admin/offers/redemptions', {
                params: { status }
            });
            return data;
        },
        approveRedemption: async (id: number, notes?: string) => {
            const { data } = await axios.post<ApiResponse<void>>(`/admin/offers/redemptions/${id}/approve`, { notes });
            return data;
        },
        deliverRedemption: async (id: number, notes?: string) => {
            const { data } = await axios.post<ApiResponse<void>>(`/admin/offers/redemptions/${id}/deliver`, { notes });
            return data;
        },
        cancelRedemption: async (id: number, notes?: string) => {
            const { data } = await axios.post<ApiResponse<void>>(`/admin/offers/redemptions/${id}/cancel`, { notes });
            return data;
        },
        getParticipants: async (id: number) => {
            const { data } = await axios.get<ApiResponse<OfferParticipant[]>>(`/admin/offers/${id}/participants`);
            return data;
        },
        getAbsorbedPoints: async () => {
            const { data } = await axios.get<ApiResponse<SuperAgentAbsorbedPoint[]>>('/admin/offers/absorbed-points');
            return data;
        },
        approveAbsorption: async (id: number, notes?: string) => {
            const { data } = await axios.post<ApiResponse<void>>(`/admin/offers/absorbed-points/${id}/approve`, { notes });
            return data;
        },
        triggerExpiry: async (id: number) => {
            const { data } = await axios.post<ApiResponse<any>>(`/admin/offers/${id}/trigger-expiry`);
            return data;
        },
        masterOverview: async () => {
            const { data } = await axios.get<ApiResponse<any[]>>('/admin/points/master-overview');
            return data;
        },
        getMyOffers: async () => {
            const { data } = await axios.get<ApiResponse<UserOfferProgress[]>>('/admin/my-offers');
            return data;
        },
        getMyRedemptions: async () => {
            const { data } = await axios.get<ApiResponse<OfferRedemption[]>>('/admin/my-redemptions');
            return data;
        },
        redeem: async (id: number) => {
            const { data } = await axios.post<ApiResponse<OfferRedemption>>(`/admin/offers/${id}/redeem`);
            return data;
        },
        getLeaderboard: async () => {
            const { data } = await axios.get<ApiResponse<any[]>>('/admin/offers/all-points-leaderboard');
            return data;
        },
        getAgentOffers: async (agentId: number) => {
            const { data } = await axios.get<ApiResponse<UserOfferProgress[]>>(`/admin/offers/agents/${agentId}/offers`);
            return data;
        }
    },

    // ==============================
    // AGENT ENDPOINTS
    // ==============================
    agent: {
        getOffers: async () => {
            const { data } = await axios.get<ApiResponse<UserOfferProgress[]>>('/agent/offers');
            return data;
        },
        redeem: async (id: number) => {
            const { data } = await axios.post<ApiResponse<OfferRedemption>>(`/agent/offers/${id}/redeem`);
            return data;
        },
        getMyRedemptions: async () => {
            const { data } = await axios.get<ApiResponse<OfferRedemption[]>>('/agent/offers/redemptions');
            return data;
        },
        getAbsorbedPoints: async () => {
            const { data } = await axios.get<ApiResponse<SuperAgentAbsorbedPoint[]>>('/agent/offers/absorbed-points');
            return data;
        },
        claimAbsorbed: async (id: number) => {
            const { data } = await axios.post<ApiResponse<void>>(`/agent/offers/absorbed-points/${id}/claim`);
            return data;
        }
    },

    // ==============================
    // SUPER AGENT ENDPOINTS
    // ==============================
    superAgent: {
        getOffers: async () => {
            const { data } = await axios.get<ApiResponse<UserOfferProgress[]>>('/super-agent/offers');
            return data;
        },
        getTeamPerformance: async () => {
            const { data } = await axios.get<ApiResponse<TeamOfferPerformance[]>>('/super-agent/offers/team-performance');
            return data;
        },
        redeem: async (id: number) => {
            const { data } = await axios.post<ApiResponse<OfferRedemption>>(`/super-agent/offers/${id}/redeem`);
            return data;
        },
        getMyRedemptions: async () => {
            const { data } = await axios.get<ApiResponse<OfferRedemption[]>>('/super-agent/offers/redemptions');
            return data;
        },
        getAbsorbedPoints: async () => {
            const { data } = await axios.get<ApiResponse<SuperAgentAbsorbedPoint[]>>('/super-agent/offers/absorbed-points');
            return data;
        },
        claimAbsorbed: async (id: number) => {
            const { data } = await axios.post<ApiResponse<void>>(`/super-agent/offers/absorbed-points/${id}/claim`);
            return data;
        }
    },
        // ==============================
    // ENUMERATOR ENDPOINTS
    // ==============================
    enumerator: {
        getOffers: async () => {
            const { data } = await axios.get<ApiResponse<UserOfferProgress[]>>('/enumerator/offers');
            return data;
        },
        redeem: async (id: number) => {
            const { data } = await axios.post<ApiResponse<OfferRedemption>>(`/enumerator/offers/${id}/redeem`);
            return data;
        },
        getMyRedemptions: async () => {
            const { data } = await axios.get<ApiResponse<OfferRedemption[]>>('/enumerator/offers/redemptions');
            return data;
        }
    }
};
