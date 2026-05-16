import { User } from './user.types';
import { Lead } from './lead.types';
// ====== Dashboard Stats ======
export interface AdminDashboardStats {
    kpis: {
        total_leads: number;
        new_leads_today: number;
        leads_this_month: number;
        total_installations: number;
        installations_this_month: number;
        active_agents: number;
        pending_agents: number;
        total_commission_paid: number;
        pending_commission: number;
        // New super agent KPIs
        active_super_agents: number;
        unassigned_agents_count: number;
        admin_net_profit: number;
        admin_profit_breakdown?: {
            commissions_earned: number;
            allowances_received: number;
            expenses_logged: number;
            payouts_to_sublines: number;
        };
    };
    pipeline: Record<string, number>;
    trends: { date: string; count: number }[];
    district_distribution: { beneficiary_district: string; total: number }[];
    recent_leads: Lead[];
    pending_approvals: User[];
    unassigned_agents?: User[];
}

export interface AgentDashboardStats {
    total_leads: number;
    leads_installed: number;
    pending_commission: number;
    total_earned: number;
    this_month_earned: number;
    last_month_earned: number;
    recent_leads: Lead[];
}

// ====== Business Development Manager Dashboard Stats ======
export interface SuperAgentDashboardStats {
    team: {
        total_agents: number;
        active_agents: number;
        pending_agents: number;
    };
    leads: {
        total: number;
        new: number;
        in_progress: number;
        installed: number;
        completed: number;
        rejected: number;
    };
    commissions: {
        override_pending: number;
        override_paid: number;
        override_this_month: number;
        agent_pending: number;
        agent_paid: number;
    };
    trends: {
        leads_this_month: number;
        leads_last_month: number;
        installs_this_month: number;
        installs_last_month: number;
    };
}
