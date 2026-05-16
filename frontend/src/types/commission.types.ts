import { User } from './user.types';
import { Offer } from './offer.types';
export type CommissionStatus = 'pending' | 'approved' | 'paid';

export type CommissionPayeeRole = 'super_agent' | 'agent' | 'enumerator' | 'field_technical_team' | 'admin';
export type CommissionPaymentStatus = 'unpaid' | 'paid';
export type CommissionPaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'cheque';
// COMMISSION REDESIGN v1.0: Updated to match new DB enum values
export type LeadCommissionEntryStatus = 'none' | 'partially_entered' | 'all_entered';

export interface Commission {
    id: number;
    lead_id: number;
    payee_role: CommissionPayeeRole;
    chain_type?: 'SURVEYOR' | 'INSTALLER' | 'MANAGER' | 'AGENT' | 'ENUMERATOR' | 'WORKER';
    payee_id: number;
    amount: number;
    payment_status: CommissionPaymentStatus;
    paid_at: string | null;
    paid_by: number | null;
    paid_by_name: string | null;
    payment_method: CommissionPaymentMethod | null;
    payment_reference: string | null;
    payment_notes: string | null;
    is_locked: boolean;
    is_editable: boolean;
    created_at: string;

    payee: {
        id: number;
        name: string;
        code: string;
        mobile?: string;
    };

    entered_by: number;
    entered_by_name: string;

    lead?: {
        ulid: string;
        beneficiary_name: string;
        beneficiary_district: string;
        admin_received_commission?: number;
        admin_meeting_allowance?: number;
    };
}

export interface LeadCommissions {
    super_agent_commission: Commission | null;
    agent_commission: Commission | null;
}

export interface CommissionPrompt {
    should_prompt: boolean;
    payee_role?: CommissionPayeeRole;
    payee_id?: number;
    payee_name?: string;
    payee_code?: string;
    payee_type_label?: string;
    payer_id?: number;
    payer_role?: string;
    suggested_amount?: number;
    existing_commission?: Commission | null;
}

export interface EnterCommissionPayload {
    amount: number;
}

export interface MarkCommissionPaidPayload {
    payment_method: CommissionPaymentMethod;
    payment_reference: string;
    payment_notes?: string;
}

export interface AdminCommissionSummary {
    super_agent_unpaid_count: number;
    super_agent_unpaid_amount: number;
    super_agent_paid_amount: number;
    direct_agent_unpaid_count: number;
    direct_agent_unpaid_amount: number;
    direct_agent_paid_amount: number;
    enumerator_unpaid_count?: number;
    enumerator_unpaid_amount?: number;
    all_time_disbursed: number;
    all_time_pending: number;
    all_time_total: number;

    // ── Unified Net Profit (use these for the EarningsOverviewCard) ──
    admin_net_profit?: number;
    commissions_earned?: number;
    ledger_credits?: number;
    ledger_debits?: number;
    commissions_to_downlines?: number;

    // Legacy per-lead breakdown (kept for backward compatibility)
    admin_net_earning_total?: number;
    total_received_from_sa?: number;
    total_passed_to_downlines?: number;
    total_other_expenses?: number;
}

// ── Profit Ledger (unified lead + ledger view) ──────────────────────────
export interface ProfitLedgerDownlineEntry {
    name: string;
    role: 'agent' | 'enumerator' | 'super_agent';
    amount: number;
    status: 'paid' | 'unpaid';
}

export interface ProfitLedgerTechEntry {
    name: string;
    chain_type: string | null;
    amount: number;
    status: 'paid' | 'unpaid';
}

export interface ProfitLedgerRow {
    row_type: 'lead' | 'ledger_credit' | 'ledger_debit';
    date: string;
    lead_ulid: string | null;
    consumer_name: string | null;
    consumer_mobile: string | null;
    system_capacity: string | null;
    received_from_sa: number;
    lead_base_commission?: number;
    lead_meeting_allowance?: number;
    lead_additional_expenses?: number;
    ledger_credit: number;
    downlines: ProfitLedgerDownlineEntry[];
    tech_payouts: ProfitLedgerTechEntry[];
    enterprise_expense: number;
    total_outflows: number;
    row_net: number;
    running_balance: number;
    payment_status: 'paid' | 'unpaid' | 'settled';
    description?: string | null;
    category?: string | null;
    created_by_name?: string | null;
}

export interface ProfitLedgerTotals {
    total_received_from_sa: number;
    total_ledger_credits: number;
    total_downlines: number;
    total_tech: number;
    total_enterprise_exp: number;
    grand_net_profit: number;
}

export interface SuperAgentCommissionSummary {
    my_earnings_unpaid: number;
    my_earnings_paid: number;
    agent_payouts_unpaid_count: number;
    agent_payouts_unpaid: number;
    agent_payouts_paid: number;
}

export interface AgentCommissionSummary {
    my_earnings_total: number;
    my_earnings_unpaid: number;
    my_earnings_paid: number;
    my_earnings_this_month: number;
    enumerator_payouts_total: number;
    enumerator_payouts_unpaid: number;
    enumerator_payouts_paid: number;
}
export interface CommissionSlab {
    id: number;
    capacity: string;
    label: string;
    agent_commission: number;
    super_agent_override: number;
    enumerator_commission: number;
    description: string | null;
    is_active: boolean;
    super_agent_id: number | null;
    is_custom?: boolean;
    created_at: string;
    updated_at: string;
}

export interface WithdrawalRequest {
    id: number;
    user_id: number;
    offer_id?: number;
    points_withdrawn: number;
    amount: number | null;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    admin_notes: string | null;
    payment_method: string | null;
    payment_details: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    offer?: Offer;
}
