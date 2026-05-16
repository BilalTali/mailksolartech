export function calculateAdminReceived(lead: any): number {
    const commission = parseFloat(lead.admin_received_commission || '0');
    const meeting = parseFloat(lead.admin_meeting_allowance || '0');
    const expenses = parseFloat(lead.admin_additional_expenses || '0');
    return commission + meeting + expenses;
}

export function calculateAdminDownlinePayouts(lead: any): number {
    if (!lead.commissions || !Array.isArray(lead.commissions)) return 0;
    
    return lead.commissions.reduce((sum: number, c: any) => {
        // Exclude any commissions directly paid to the admin if such a thing exists
        if (c.payee_role === 'admin') return sum;
        return sum + parseFloat(c.amount || '0');
    }, 0);
}

export function calculateAdminOtherExpenses(lead: any): number {
    if (!lead.admin_other_expenses || !Array.isArray(lead.admin_other_expenses)) return 0;
    
    return lead.admin_other_expenses.reduce((sum: number, expense: any) => {
        return sum + parseFloat(expense.amount || '0');
    }, 0);
}

export function calculateAdminNetEarning(lead: any): number {
    // If backend already provided it, use it
    if (typeof lead.admin_net_earning === 'number') {
        return lead.admin_net_earning;
    }
    
    const received = calculateAdminReceived(lead);
    const downline = calculateAdminDownlinePayouts(lead);
    const other = calculateAdminOtherExpenses(lead);
    
    return received - downline - other;
}

export function calculateSuperAgentNetEarning(lead: any): number {
    // Super Agent's net earning is exactly their own commission record
    if (!lead.commissions || !Array.isArray(lead.commissions)) {
        // Fallback to formatted
        if (lead.formatted_commissions?.super_agent_commission) {
            return parseFloat(lead.formatted_commissions.super_agent_commission.amount || '0');
        }
        return 0;
    }
    
    const saCommission = lead.commissions.find((c: any) => c.payee_role === 'super_agent');
    return saCommission ? parseFloat(saCommission.amount || '0') : 0;
}

export function calculateAgentNetEarning(lead: any, role: string): number {
    // Agent/Enumerator/Installer's net earning is exactly their own commission record
    if (!lead.commissions || !Array.isArray(lead.commissions)) {
         if (role === 'agent' && lead.formatted_commissions?.agent_commission) {
             return parseFloat(lead.formatted_commissions.agent_commission.amount || '0');
         }
         if (role === 'enumerator' && lead.formatted_commissions?.enumerator_commission) {
             return parseFloat(lead.formatted_commissions.enumerator_commission.amount || '0');
         }
         return 0;
    }
    
    // For direct agents, enumerators, surveyors, installers
    const commission = lead.commissions.find((c: any) => c.payee_role === role);
    return commission ? parseFloat(commission.amount || '0') : 0;
}

export function calculateNetEarning(lead: any, role: string): number {
    if (role === 'admin' || role === 'super_admin') {
        return calculateAdminNetEarning(lead);
    }
    if (role === 'super_agent') {
        return calculateSuperAgentNetEarning(lead);
    }
    return calculateAgentNetEarning(lead, role);
}

export function isLeadDisbursed(lead: any): boolean {
    // In our system, checking if status has passed FILE_DISBURSED or DISBURSEMENT_VERIFIED
    const disbursedStatuses = [
        'DISBURSEMENT_VERIFIED', 'DISPATCH_INITIATED', 'IN_TRANSIT', 'DELIVERED',
        'MATERIAL_DISPATCHED_TO_INSTALLER', 'MATERIAL_RECEIVED_BY_INSTALLER',
        'MATERIAL_VERIFIED_BY_CONSUMER', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS',
        'SOLAR_INSTALLED', 'INSTALLATION_COMPLETED', 'INSTALLATION_VERIFIED',
        'POD_INSPECTION_INITIATED', 'POD_REJECTED', 'POD_SUCCESSFUL', 'PROJECT_COMMISSIONING',
        'SUBSIDY_REQUEST', 'SUBSIDY_DISBURSED', 'LEAD_COMPLETED'
    ];
    return disbursedStatuses.includes(lead.status);
}
