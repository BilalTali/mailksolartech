import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Search, LayoutList, MapPin, IndianRupee, Send, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { ApiResponse, Lead, PaginatedResponse } from '@/types';
import { LeadDocumentsModal } from '@/components/leads/LeadDocumentsModal';
import AdminAllocationModal from '@/components/commission/AdminAllocationModal';
import { useAuthStore } from '@/store/authStore';
import { DelegateSupportModal } from '@/components/leads/DelegateSupportModal';

export default function SuperAdminMonitorLeadsPage() {
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');
    
    // Sync search with URL for deep linking
    useEffect(() => {
        const params: any = {};
        if (search) params.search = search;
        if (status) params.status = status;
        setSearchParams(params, { replace: true });
    }, [search, status]);

    const [selectedLead, setSelectedLead] = useState<{
        ulid: string, 
        name: string,
        systemCapacity?: string | null,
        initialAllocation?: {
            lead_revenue?: number,
            commission: number,
            meeting: number,
            expenses: number
        }
    } | null>(null);

    const [delegatingLead, setDelegatingLead] = useState<{
        ulid: string,
        name: string
    } | null>(null);

    const getDelegatedTechnician = (lead: Lead) => {
        const log = lead.status_logs?.find(l => l.notes?.includes('TEAM_ACTION_REQUIRED: [Technician:'));
        if (!log) return null;
        const match = log.notes?.match(/\[Technician:\s*([^\]]+)\]/);
        return match ? match[1] : 'Field Technical Team';
    };

    // Extract latest unresolved consumer support ticket info
    const getConsumerTicket = (lead: Lead) => {
        const isResolved = lead.status_logs?.some(l => l.notes?.includes('SUPPORT_RESOLVED'));
        if (isResolved) return null;
        const log = lead.status_logs?.slice().reverse().find(l => l.notes?.startsWith('SUPPORT TICKET:'));
        if (!log) return null;
        const match = log.notes?.match(/^SUPPORT TICKET: \[([^\]]+)\]\s*(.*)$/);
        return match ? { subject: match[1], message: match[2] } : { subject: 'Support Query', message: log.notes ?? '' };
    };

    // Fetch leads
    const { data: res, isLoading } = useQuery({
        queryKey: ['super-admin', 'monitor-leads', search, status],
        queryFn: async () => {
            const prefix = role === 'super_admin' ? '/super-admin' : '/admin';
            const response = await api.get<ApiResponse<PaginatedResponse<Lead>>>(`${prefix}/monitor/leads`, {
                params: { search, status, per_page: 10 }
            });
            return response.data;
        }
    });




    const escalateMutation = useMutation({
        mutationFn: async ({ ulid, message }: { ulid: string, message?: string }) => {
            const res = await api.post(`/super-admin/leads/${ulid}/escalate-ticket`, { message });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Ticket escalated to administrator successfully.');
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'monitor-leads'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to escalate ticket');
        }
    });

    const resolveMutation = useMutation({
        mutationFn: async ({ ulid, message }: { ulid: string, message: string }) => {
            const res = await api.post(`/admin/leads/${ulid}/resolve-ticket`, { message });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Support ticket marked as resolved.');
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'monitor-leads'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to resolve ticket');
        }
    });

    const leads = res?.data?.data || [];


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <LayoutList className="w-6 h-6 text-orange-500" />
                        Monitoring: Platform Leads
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Read-only oversight of the national lead pipeline and status distribution.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by customer name or consumer number..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setStatus('')}
                        className={`px-4 h-12 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all ${
                            status === '' 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        All Leads
                    </button>
                    <button
                        onClick={() => setStatus('ESCALATED')}
                        className={`px-4 h-12 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all flex items-center gap-2 whitespace-nowrap ${
                            status === 'ESCALATED' 
                            ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200' 
                            : 'bg-rose-50/60 border-rose-100 text-rose-700 hover:bg-rose-100'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${status === 'ESCALATED' ? 'bg-white' : 'bg-rose-600'} animate-pulse`} />
                        🚨 Escalated Support
                    </button>
                    <div className="w-56">
                        <select 
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-slate-700 shadow-sm text-xs"
                          value={status === 'ESCALATED' ? '' : status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Filter by Status...</option>
                            <optgroup label="── Core ──">
                                <option value="NEW">New Application</option>

                                <option value="INVALID">Invalid</option>
                                <option value="DUPLICATE">Duplicate</option>
                                <option value="REJECTED">Rejected</option>
                            </optgroup>
                            <optgroup label="── Registration ──">
                                <option value="REGISTERED">Registered at MNRE.</option>

                                <option value="SURVEY_DONE">Site Survey Done</option>
                            </optgroup>
                            <optgroup label="── Banking ──">
                                <option value="LEAD_DOCUMENTS_PRINTED">Documents Printed</option>

                                <option value="SIGNATURE_PENDING">Signature Pending</option>
                                <option value="SIGNATURE_DONE">Signature Done</option>

                                <option value="FILE_DISBURSED">File Disbursed</option>
                                <option value="DISBURSEMENT_VERIFIED">Disbursement Verified</option>

                            </optgroup>
                            <optgroup label="── Installation ──">
                                <option value="DISPATCH_INITIATED">Dispatch Initiated</option>
                                <option value="IN_TRANSIT">In Transit</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="INSTALLATION_SCHEDULED">Installation Scheduled</option>
                                <option value="INSTALLATION_IN_PROGRESS">Installation In Progress</option>
                                <option value="SOLAR_INSTALLED">Solar Installed</option>
                                <option value="INSTALLATION_COMPLETED">Installation Completed</option>
                                <option value="INSTALLATION_VERIFIED">Installation Verified</option>
                            </optgroup>
                            <optgroup label="── POD & Completion ──">
                                <option value="POD_INSPECTION_INITIATED">POD Inspection Initiated</option>
                                <option value="POD_SUCCESSFUL">POD Passed</option>
                                <option value="POD_REJECTED">POD Rejected</option>
                                <option value="PROJECT_COMMISSIONING">Project Commissioning</option>
                                <option value="SUBSIDY_REQUEST">Subsidy Request</option>

                                <option value="SUBSIDY_DISBURSED">Subsidy Disbursed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="LEAD_COMPLETED">Lead Completed</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Customer / Consumer</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Docs</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td></tr>
                                ))
                            ) : leads.map((lead) => (
                                <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900 leading-tight">{lead.beneficiary_name}</p>
                                                {(lead.status_logs?.some(l => l.notes?.includes('ADMIN_ACTION_REQUIRED')) || lead.status_logs?.some(l => l.notes?.startsWith('SUPPORT TICKET:'))) && !lead.status_logs?.some(l => l.notes?.includes('SUPPORT_RESOLVED')) && (
                                                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Support Query Pending" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lead.consumer_number || 'No Number'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            {lead.beneficiary_district}, {lead.beneficiary_state}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase tracking-widest border border-slate-200">
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-2">
                                            {/* Consumer ticket info — always surface this */}
                                            {(() => {
                                                const ticket = getConsumerTicket(lead);
                                                return ticket ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {ticket.subject}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-medium px-1 max-w-[180px] truncate" title={ticket.message}>{ticket.message}</span>
                                                    </div>
                                                ) : null;
                                            })()}

                                            <div className="flex items-center gap-2 flex-wrap">
                                                <LeadDocumentsModal ulid={lead.ulid} triggerButtonText="Docs" buttonClassName="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 uppercase tracking-wider" />
                                            
                                                {/* Support Delegation (Admins only) */}
                                                {lead.status_logs?.some(l => l.notes?.includes('ADMIN_ACTION_REQUIRED')) && 
                                                !lead.status_logs?.some(l => l.notes?.includes('SUPPORT_RESOLVED')) && 
                                                (role === 'admin' || role === 'operator') && (
                                                    <div className="flex flex-col gap-1">
                                                        {getDelegatedTechnician(lead) ? (
                                                            <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Delegated: {getDelegatedTechnician(lead)}
                                                            </span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => setDelegatingLead({ ulid: lead.ulid, name: lead.beneficiary_name })}
                                                                className="px-2 py-1 bg-rose-50 border border-rose-100 rounded-md text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition-colors inline-flex items-center gap-1 uppercase tracking-wider whitespace-nowrap"
                                                            >
                                                                <Send size={10} /> Delegate Support
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => {
                                                                const msg = prompt('Enter resolution summary:');
                                                                if (msg) resolveMutation.mutate({ ulid: lead.ulid, message: msg });
                                                            }}
                                                            disabled={resolveMutation.isPending}
                                                            className="px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 uppercase tracking-wider whitespace-nowrap"
                                                        >
                                                            <CheckCircle size={10} /> Resolve Ticket
                                                        </button>
                                                    </div>
                                                )}

                                                {lead.status_logs?.some(l => l.notes?.includes('SUPPORT_RESOLVED')) && (
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-200 inline-flex items-center gap-1">
                                                        <CheckCircle size={10} /> Resolved
                                                    </span>
                                                )}

                                                {/* Support Escalation (Super Admin only) */}
                                                {role === 'super_admin' && (() => {
                                                    const isEscalated = lead.status_logs?.some(l => l.notes?.includes('ADMIN_ACTION_REQUIRED'));
                                                    const isResolved = lead.status_logs?.some(l => l.notes?.includes('SUPPORT_RESOLVED'));
                                                    const hasTicket = lead.status_logs?.some(l => l.notes?.startsWith('SUPPORT TICKET:'));
                                                    if (isResolved) return null;
                                                    if (isEscalated) return (
                                                        <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-md inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Escalated to Admin
                                                        </span>
                                                    );
                                                    if (hasTicket) return (
                                                        <button 
                                                            onClick={() => {
                                                                const msg = prompt('Enter escalation note for Admin (optional):');
                                                                if (msg !== null) escalateMutation.mutate({ ulid: lead.ulid, message: msg });
                                                            }}
                                                            disabled={escalateMutation.isPending}
                                                            className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 uppercase tracking-wider whitespace-nowrap disabled:opacity-50"
                                                        >
                                                            <Send size={10} /> Escalate to Admin
                                                        </button>
                                                    );
                                                    return null;
                                                })()}

                                                {role === 'super_admin' && (
                                                    <>
                        {['DISBURSEMENT_VERIFIED', 'POD_SUCCESSFUL', 'COMPLETED'].includes(lead.status) && lead.admin_received_commission === null && (
                                                            <button 
                                                                onClick={() => setSelectedLead({ ulid: lead.ulid, name: lead.beneficiary_name, systemCapacity: lead.system_capacity })}
                                                                className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 uppercase tracking-wider whitespace-nowrap"
                                                            >
                                                                <IndianRupee size={10} /> Pass Profit
                                                            </button>
                                                        )}
                                                        {lead.admin_received_commission !== null && (
                                                            <button 
                                                                onClick={() => setSelectedLead({ 
                                                                    ulid: lead.ulid, 
                                                                    name: lead.beneficiary_name,
                                                                    systemCapacity: lead.system_capacity,
                                                                    initialAllocation: {
                                                                        lead_revenue: Number(lead.lead_revenue) || 0,
                                                                        commission: Number(lead.admin_received_commission) || 0,
                                                                        meeting: Number(lead.admin_meeting_allowance) || 0,
                                                                        expenses: Number(lead.admin_additional_expenses) || 0
                                                                    }
                                                                })}
                                                                className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 uppercase tracking-wider whitespace-nowrap"
                                                            >
                                                                <IndianRupee size={10} /> Edit Allocation
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-medium text-slate-400 text-[10px] uppercase">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminAllocationModal 
                isOpen={!!selectedLead} 
                onClose={() => setSelectedLead(null)} 
                leadUlid={selectedLead?.ulid || ''} 
                beneficiaryName={selectedLead?.name || ''}
                systemCapacity={selectedLead?.systemCapacity}
                initialAllocation={selectedLead?.initialAllocation}
            />

            <DelegateSupportModal 
                isOpen={!!delegatingLead}
                onClose={() => setDelegatingLead(null)}
                leadUlid={delegatingLead?.ulid || ''}
                beneficiaryName={delegatingLead?.name || ''}
            />
        </div>
    );
}
