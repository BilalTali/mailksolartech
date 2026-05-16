import api from './axios';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface PipelineSummary {
    total: number;
    funnel: Record<string, number>;
    status_distribution: Record<string, number>;
}

export interface AgentPerformance {
    id: number;
    name: string;
    agent_id: string;
    total_leads: number;
    installed_leads: number;
    total_earned: string;
    conversion_rate: number;
}

export interface SuperAgentPerformance {
    id: number;
    name: string;
    agent_id: string;
    super_agent_code: string;
    team_size: number;
    total_leads: number;
    total_installed: number;
    conversion_rate: number;
    top_agents: AgentPerformance[];
}

export interface GeographyReport {
    by_state: Array<{ state: string; count: number }>;
    top_districts: Array<{ district: string; state: string; count: number }>;
}

export interface MonthlyTrend {
    month: string;
    new_leads: number;
    installations: number;
}

export const reportsApi = {
    getPipelineSummary: async () => {
        const res = await api.get<ApiResponse<PipelineSummary>>('/admin/reports/pipeline');
        return res.data;
    },
    getAgentPerformance: async (params?: Record<string, unknown>) => {
        const res = await api.get<ApiResponse<PaginatedResponse<AgentPerformance>>>('/admin/reports/agent-performance', { params });
        return res.data;
    },
    getSuperAgentPerformance: async () => {
        const res = await api.get<ApiResponse<SuperAgentPerformance[]>>('/admin/reports/super-agent-performance');
        return res.data;
    },
    getGeographyReport: async () => {
        const res = await api.get<ApiResponse<GeographyReport>>('/admin/reports/geography');
        return res.data;
    },
    getMonthlyTrend: async () => {
        const res = await api.get<ApiResponse<MonthlyTrend[]>>('/admin/reports/monthly-trend');
        return res.data;
    },
};
