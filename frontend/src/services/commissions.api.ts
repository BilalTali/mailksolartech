import axiosInstance from './axios';
import type {
    Commission, EnterCommissionPayload, MarkCommissionPaidPayload,
    AdminCommissionSummary, SuperAgentCommissionSummary, AgentCommissionSummary,
    LeadCommissions, PaginatedResponse, ProfitLedgerRow, ProfitLedgerTotals,
} from '../types';

// ── ADMIN ──────────────────────────────────────────────────────────
export const adminCommissionsApi = {
    getAll: (params?: Record<string, unknown>) =>
        axiosInstance.get<{ data: Commission[]; meta: PaginatedResponse<Commission> }>('/admin/commissions', { params }),

    getSummary: () =>
        axiosInstance.get<{ data: AdminCommissionSummary }>('/admin/commissions/summary'),

    enterSuperAgentCommission: (leadUlid: string, payload: EnterCommissionPayload) =>
        axiosInstance.post(`/admin/leads/${leadUlid}/commission/super-agent`, payload),

    enterDirectAgentCommission: (leadUlid: string, payload: EnterCommissionPayload) =>
        axiosInstance.post(`/admin/leads/${leadUlid}/commission/agent-direct`, payload),

    enterEnumeratorCommission: (leadUlid: string, payload: EnterCommissionPayload) =>
        axiosInstance.post(`/admin/leads/${leadUlid}/commission/enumerator`, payload),

    // Unified commission entry: sends payee_id + amount, backend handles routing
    enterCommission: (leadUlid: string, payload: { payee_id: number; amount: number }) =>
        axiosInstance.post(`/admin/leads/${leadUlid}/commission/enter`, payload),

    updateCommission: (id: number, payload: EnterCommissionPayload) =>
        axiosInstance.put(`/admin/commissions/${id}`, payload),

    markPaid: (id: number, payload: MarkCommissionPaidPayload) =>
        axiosInstance.put(`/admin/commissions/${id}/mark-paid`, payload),

    getLeadCommissions: (leadUlid: string) =>
        axiosInstance.get<{ data: LeadCommissions }>(`/admin/leads/${leadUlid}/commissions`),

    updateAdminAllocation: (leadUlid: string, payload: { lead_revenue?: number; admin_received_commission: number; admin_meeting_allowance: number; admin_additional_expenses: number }) =>
        axiosInstance.put(`/admin/leads/${leadUlid}/commission/admin-allocation`, payload),

    updateAdminExpenses: (leadUlid: string, payload: { expenses: { label: string, amount: number }[] }) =>
        axiosInstance.put(`/admin/leads/${leadUlid}/commission/admin-expenses`, payload),

    // Profit Ledger — unified financial view (lead rows + ledger rows)
    getProfitLedger: (params?: { page?: number; start_date?: string; end_date?: string }) =>
        axiosInstance.get<{ data: ProfitLedgerRow[]; meta: { current_page: number; last_page: number; total: number }; totals: ProfitLedgerTotals }>(
            '/admin/commissions/profit-ledger', { params }
        ),

    exportProfitLedger: (params?: { start_date?: string; end_date?: string }) =>
        axiosInstance.get('/admin/commissions/profit-ledger/export', { params, responseType: 'blob' }),
};

// ── SUPER AGENT ────────────────────────────────────────────────────
export const superAgentCommissionsApi = {
    getAll: (params?: Record<string, unknown>) =>
        axiosInstance.get<{ data: Commission[]; meta: PaginatedResponse<Commission> }>('/super-agent/commissions', { params }),

    getSummary: () =>
        axiosInstance.get<{ data: SuperAgentCommissionSummary }>('/super-agent/commissions/summary'),

    enterAgentCommission: (leadUlid: string, payload: EnterCommissionPayload) =>
        axiosInstance.post(`/super-agent/leads/${leadUlid}/commission/agent`, payload),

    enterEnumeratorCommission: (leadUlid: string, payload: EnterCommissionPayload) =>
        axiosInstance.post(`/super-agent/leads/${leadUlid}/commission/enumerator`, payload),

    updateCommission: (id: number, payload: EnterCommissionPayload) =>
        axiosInstance.put(`/super-agent/commissions/${id}`, payload),

    markPaid: (id: number, payload: MarkCommissionPaidPayload) =>
        axiosInstance.put(`/super-agent/commissions/${id}/mark-paid`, payload),

    getLeadCommissions: (leadUlid: string) =>
        axiosInstance.get<{ data: LeadCommissions }>(`/super-agent/leads/${leadUlid}/commissions`),

    getProfitLedger: (params?: { page?: number; start_date?: string; end_date?: string }) =>
        axiosInstance.get<{ data: ProfitLedgerRow[]; meta: { current_page: number; last_page: number; total: number }; totals: ProfitLedgerTotals }>(
            '/super-agent/commissions/profit-ledger', { params }
        ),

    exportProfitLedger: (params?: { start_date?: string; end_date?: string }) =>
        axiosInstance.get('/super-agent/commissions/profit-ledger/export', { params, responseType: 'blob' }),
};

// ── AGENT (read-only) ──────────────────────────────────────────────
export const agentCommissionsApi = {
    getAll: (params?: Record<string, unknown>) =>
        axiosInstance.get<{ data: Commission[]; meta: PaginatedResponse<Commission> }>('/agent/commissions', { params }),

    getSummary: () =>
        axiosInstance.get<{ data: AgentCommissionSummary }>('/agent/commissions/summary'),

    enterEnumeratorCommission: (leadUlid: string, payload: EnterCommissionPayload) =>
        axiosInstance.post(`/agent/leads/${leadUlid}/commission/enumerator`, payload),

    updateCommission: (id: number, payload: EnterCommissionPayload) =>
        axiosInstance.put(`/agent/commissions/${id}`, payload),

    markPaid: (id: number, payload: MarkCommissionPaidPayload) =>
        axiosInstance.put(`/agent/commissions/${id}/mark-paid`, payload),

    getProfitLedger: (params?: { page?: number; start_date?: string; end_date?: string }) =>
        axiosInstance.get<{ data: ProfitLedgerRow[]; meta: { current_page: number; last_page: number; total: number }; totals: ProfitLedgerTotals }>(
            '/agent/commissions/profit-ledger', { params }
        ),

    exportProfitLedger: (params?: { start_date?: string; end_date?: string }) =>
        axiosInstance.get('/agent/commissions/profit-ledger/export', { params, responseType: 'blob' }),
};

// ── ENUMERATOR ─────────────────────────────────────────────────────
export const enumeratorCommissionsApi = {
    getAll: (params?: Record<string, unknown>) =>
        axiosInstance.get<{ data: Commission[]; meta: PaginatedResponse<Commission> }>('/enumerator/commissions', { params }),

    getProfitLedger: (params?: { page?: number; start_date?: string; end_date?: string }) =>
        axiosInstance.get<{ data: ProfitLedgerRow[]; meta: { current_page: number; last_page: number; total: number }; totals: ProfitLedgerTotals }>(
            '/enumerator/commissions/profit-ledger', { params }
        ),

    exportProfitLedger: (params?: { start_date?: string; end_date?: string }) =>
        axiosInstance.get('/enumerator/commissions/profit-ledger/export', { params, responseType: 'blob' }),
};

// ── SUPER ADMIN (settles commissions for Admins) ───────────────────
export const superAdminCommissionsApi = {
    getAll: (params?: Record<string, unknown>) =>
        axiosInstance.get<{ data: Commission[]; meta: { current_page: number; last_page: number; total: number } }>('/super-admin/commissions', { params }),

    getSummary: () =>
        axiosInstance.get<{ data: { admin_unpaid_count: number; admin_unpaid_amount: number; admin_paid_amount: number; all_time_disbursed: number; system_revenue: number; system_net_profit: number } }>('/super-admin/commissions/summary'),

    settle: (id: number, payload: MarkCommissionPaidPayload) =>
        axiosInstance.put(`/super-admin/commissions/${id}/settle`, payload),

    getProfitLedger: (params?: { page?: number; start_date?: string; end_date?: string }) =>
        axiosInstance.get<{ data: ProfitLedgerRow[]; meta: { current_page: number; last_page: number; total: number }; totals: ProfitLedgerTotals }>(
            '/super-admin/commissions/profit-ledger', { params }
        ),

    exportProfitLedger: (params?: { start_date?: string; end_date?: string }) =>
        axiosInstance.get('/super-admin/commissions/profit-ledger/export', { params, responseType: 'blob' }),

    updateSystemRevenue: (leadUlid: string, payload: { lead_revenue: number }) =>
        axiosInstance.put(`/admin/leads/${leadUlid}/commission/system-revenue`, payload),
};

