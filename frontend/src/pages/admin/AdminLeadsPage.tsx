import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Filter, ChevronLeft, ChevronRight, X,
    Phone, MapPin, User, Hash, FileText, AlertCircle, Calendar,
    Download, CheckCircle, Trash2, Plus, CreditCard
} from 'lucide-react';
import { leadsApi } from '@/services/leads.api';
import { adminSuperAgentApi } from '@/services/adminSuperAgent.api';
import api from '@/services/axios';
import toast from 'react-hot-toast';
import type { Lead, ApiResponse, PaginatedResponse, CommissionPrompt } from '@/types';
import CommissionInlineEntry from '@/components/admin/CommissionInlineEntry';
import { useAuthStore } from '@/store/authStore';

import { LEAD_STATUS_OPTIONS, getLeadStatusLabel, getLeadStatusColor, MILESTONE_STATUSES, countPipelineSkips, ORDERED_PIPELINE } from '@/constants/leadStatuses';
import MobileFilterModal from '@/components/shared/MobileFilterModal';
import { LeadDocumentsModal } from '@/components/leads/LeadDocumentsModal';
import { StatusTransitionModal } from '@/components/leads/StatusTransitionModal';


// ── constants ─────────────────────────────────────────────────────────────────
const CAPACITY_LABEL: Record<string, string> = {
    '3kw': '3 kW', '3.3kw': '3.3 kW', '4kw': '4 kW', '5kw': '5 kW', '5.5kw': '5.5 kW', '6kw': '6 kW', '7kw': '7 kW', '8kw': '8 kW', '9kw': '9 kW', '10kw': '10 kW', 'above_10kw': 'Above 10 kW', 'above_3kw': 'Above 3 kW',
};

function fmt(iso: string) { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

// ── component ─────────────────────────────────────────────────────────────────
export default function AdminLeadsPage() {
    const { role } = useAuthStore();
    const getDisplayAccount = (account?: string | null) => {
        if (!account) return '—';
        if (role === 'admin' || role === 'super_admin') return account;
        if (account.length <= 4) return account;
        return '•'.repeat(account.length - 4) + account.slice(-4);
    };
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [source, setSource] = useState('');
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<Lead | null>(null);
    // for status-update panel
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [installationDate, setInstallationDate] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    // for assign panel
    const [assignSuperAgent, setAssignSuperAgent] = useState<number | string>('');
    const [activePrompts, setActivePrompts] = useState<Record<string, CommissionPrompt>>({});
    // mobile filter modal state
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    // status transition modal state
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    // billing state
    const [quotationSerial, setQuotationSerial] = useState('1');
    const [receiptSerial, setReceiptSerial] = useState('1');
    const [receiptPercentage, setReceiptPercentage] = useState('10');
    const [billingItemsList, setBillingItemsList] = useState<{ description: string; make: string; qty: string; rate: string }[]>([]);
    const [gstPercentage, setGstPercentage] = useState('5');

    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Focus management for detail panel
    useEffect(() => {
        if (detail) {
            // small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);

            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setDetail(null);
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                window.removeEventListener('keydown', handleEsc);
                clearTimeout(timer);
            };
        }
    }, [detail]);

    const qc = useQueryClient();

    // ── list query ────────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery<ApiResponse<PaginatedResponse<Lead>>>({
        queryKey: ['admin-leads', search, status, source, page],
        queryFn: () => leadsApi.getAdminLeads({
            search: search || undefined,
            status: status || undefined,
            source: source || undefined,
            page,
            per_page: 50, // Reduced from 200 to prevent payload bottleneck
        }),
    });



    const leads: Lead[] = data?.data?.data ?? [];
    const total = data?.data?.total ?? 0;
    const lastPage = data?.data?.last_page ?? 1;

    // ── detail query (loads full lead with status logs) ────────────────────────
    const { data: detailData, isLoading: detailLoading } = useQuery<ApiResponse<Lead>>({
        queryKey: ['admin-lead-detail', detail?.ulid],
        queryFn: () => leadsApi.getAdminLeadByUlid(detail!.ulid),
        enabled: !!detail?.ulid,
    });
    const fullLead = detailData?.data ?? detail;

    // ── active super agents (for assign dropdown) ────────────────────────────
    const { data: superAgentsData } = useQuery({
        queryKey: ['admin-super-agents-for-assign'],
        queryFn: () => adminSuperAgentApi.getSuperAgents({ status: 'active', per_page: 200 }),
        staleTime: 60_000,
    });
    const activeSuperAgents = (superAgentsData?.data?.data ?? []) as { id: number; name: string; super_agent_code: string | null }[];

    // ── active technicians ───────────────────────────────────────────────────
    const { data: techniciansData } = useQuery({
        queryKey: ['admin-technical-team'],
        queryFn: () => api.get('/admin/technical-team').then(r => r.data.data),
        staleTime: 60_000,
    });
    const activeTechnicians = (techniciansData ?? []) as any[];

    // ── inventory items for billing ──────────────────────────────────────────
    const { data: inventoryData } = useQuery({
        queryKey: ['admin-inventory-all'],
        queryFn: () => api.get('/admin/inventory-items').then(r => r.data.data),
        staleTime: 60_000,
    });
    const inventoryItems = (inventoryData ?? []) as any[];

    // ── mutations ─────────────────────────────────────────────────────────────
    const statusMut = useMutation({
        mutationFn: ({ ulid, formData }: { ulid: string; formData: FormData }) =>
            leadsApi.updateLeadStatus(ulid, formData),
        onSuccess: (res: any) => {
            const returnedData = res?.data;
            if (returnedData?.commission_prompts?.length > 0 && role === 'admin') {
                const adminPrompts = returnedData.commission_prompts.filter((p: any) => 
                    (p.payer_role === 'admin' || p.payer_role === 'super_admin') && p.status === 'pending'
                );
                if (adminPrompts.length > 0) {
                    setActivePrompts(p => ({ ...p, [detail?.ulid || '']: adminPrompts[0] }));
                } else {
                    setActivePrompts(p => { const newPrompts = { ...p }; delete newPrompts[detail?.ulid || '']; return newPrompts; });
                }
            } else {
                setActivePrompts(p => {
                    const newPrompts = { ...p };
                    delete newPrompts[detail?.ulid || ''];
                    return newPrompts;
                });
            }
            qc.invalidateQueries({ queryKey: ['admin-leads'] });
            qc.invalidateQueries({ queryKey: ['admin-lead-detail'] });
            qc.invalidateQueries({ queryKey: ['lead-documents'] });
            toast.success('Lead status updated');
            setNewStatus(''); setStatusNote(''); setReceiptFile(null);
            setIsStatusModalOpen(false);
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Failed to update status.';
            const errors = error.response?.data?.errors;
            if (errors) {
                const firstError = Object.values(errors)[0] as string[];
                toast.error(firstError[0] || msg);
            } else {
                toast.error(msg);
            }
        },
    });

    const assignMut = useMutation({
        mutationFn: ({ ulid, super_agent_id }: { ulid: string; super_agent_id: number }) =>
            leadsApi.assignLead(ulid, super_agent_id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-leads'] });
            qc.invalidateQueries({ queryKey: ['admin-lead-detail'] });
            toast.success('Lead assigned to Business Development Manager successfully');
            setAssignSuperAgent('');
        },
        onError: () => toast.error('Failed to assign lead.'),
    });

    const assignTechMut = useMutation({
        mutationFn: ({ ulid, payload }: { ulid: string; payload: any }) =>
            leadsApi.assignTechnicians(ulid, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-leads'] });
            qc.invalidateQueries({ queryKey: ['admin-lead-detail'] });
            toast.success('Technician assigned successfully');
        },
        onError: () => toast.error('Failed to assign technician.'),
    });

    const updateLeadMut = useMutation({
        mutationFn: ({ ulid, data }: { ulid: string; data: Record<string, any> }) =>
            leadsApi.updateAdminLead(ulid, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-leads'] });
            qc.invalidateQueries({ queryKey: ['admin-lead-detail'] });
            toast.success('Lead updated');
        },
        onError: () => toast.error('Failed to update lead.'),
    });

    const openDetail = (lead: Lead | any) => {
        setDetail(lead);
        setNewStatus(lead.status);
        setStatusNote('');
        setInstallationDate(lead.installation_scheduled_at ? lead.installation_scheduled_at.split('T')[0] : '');
        setAssignSuperAgent('');
        setReceiptFile(null);
        setQuotationSerial(lead.quotation_serial || '');
        setReceiptSerial(lead.receipt_serial || '');
        
        // Compute reverse percentage if they had a receipt amount
        if (lead.quotation_total_amount && lead.receipt_amount) {
            setReceiptPercentage(((lead.receipt_amount / lead.quotation_total_amount) * 100).toFixed(1));
        } else {
            setReceiptPercentage('10');
        }


        if (lead.billing_items && lead.billing_items.length > 0) {
            setBillingItemsList(lead.billing_items.map((it: any) => ({ 
                description: it.description ?? '',
                make: it.make ?? '',
                qty: it.qty != null ? String(it.qty) : '1',
                rate: it.rate != null ? String(it.rate) : ''
            })));
        } else {
            // Support legacy: if they have old data but no new array
            if (lead.quotation_base_amount) {
                setBillingItemsList([{ 
                    description: lead.system_item || 'Solar Grid Tie System', 
                    make: lead.system_make || 'Standard', 
                    qty: '1',
                    rate: String(lead.quotation_base_amount) 
                }]);
            } else {
                setBillingItemsList([]);
            }
        }
        setGstPercentage(String(lead.billing_gst_percentage || '5'));
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-slate-800">All Leads</h1>
                <p className="text-sm text-slate-600 mt-0.5">
                    View &amp; manage all leads across the platform
                    {total > 0 && <span className="ml-1 text-slate-500">({total} total)</span>}
                </p>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search beneficiary name, mobile, lead ref…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-80"
                    />
                </div>
                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                    <option value="">All Statuses</option>
                    {LEAD_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select
                    value={source}
                    onChange={e => { setSource(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                    <option value="">All Sources</option>
                    <option value="public_form">Public Lead</option>
                    <option value="agent_submission">Agent Lead</option>
                    <option value="super_agent_submission">Super Agent Lead</option>
                    <option value="enumerator_submission">Enumerator Lead</option>
                    <option value="admin_manual">Admin Manual</option>
                </select>
                {(search || status || source) && (
                    <button
                        onClick={() => { setSearch(''); setStatus(''); setSource(''); setPage(1); }}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-2"
                    >
                        <Filter size={13} /> Clear filters
                    </button>
                )}
            </div>

            {/* Mobile Filters Header */}
            <div className="sm:hidden flex items-center justify-between gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-8 pr-4 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`relative p-2 rounded-full border border-slate-200 ${status || source ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white text-slate-600'}`}
                >
                    <Filter size={18} />
                    {(status || source) && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {[status, source].filter(Boolean).length}
                        </span>
                    )}
                </button>
            </div>

            <MobileFilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                fields={[
                    { id: 'search', label: 'Search', type: 'text' as const, placeholder: 'Name, mobile, or reference ID...' },
                    { id: 'status', label: 'Status', type: 'select' as const, options: LEAD_STATUS_OPTIONS },
                    { id: 'source', label: 'Source', type: 'select' as const, options: [
                        { label: 'Public Lead', value: 'public_form' },
                        { label: 'Agent Lead', value: 'agent_submission' },
                        { label: 'Super Agent Lead', value: 'super_agent_submission' },
                        { label: 'Enumerator Lead', value: 'enumerator_submission' },
                        { label: 'Admin Manual', value: 'admin_manual' },
                    ]}
                ]}
                values={{ search, status, source }}
                onChange={(id, val) => {
                    if (id === 'search') setSearch(val);
                    if (id === 'status') setStatus(val);
                    if (id === 'source') setSource(val);
                    setPage(1);
                }}
                onClear={() => {
                    setSearch(''); setStatus(''); setSource(''); setPage(1);
                }}
            />

            {/* Table / Card View */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm" aria-label="Leads list">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {[
                                    'Ref', 'Beneficiary', 'Mobile', 'Referral ID', 'State', 'District', 'Address',
                                    'DISCOM', 'Consumer No.', 'Capacity', 'Roof Size', 'Monthly Bill',
                                    'Source', 'Business Development Manager', 'Business Development Executive', 'Status', 'Receipt', 'Date', 'Action'
                                ].map(h => (
                                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={19} className="text-center py-12 text-slate-400">Loading leads…</td></tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={19} className="text-center py-12">
                                        <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-400">No leads found{search || status || source ? ' matching your filters' : ''}.</p>
                                    </td>
                                </tr>
            ) : leads.map((lead, idx) => (
                                <tr
                                    key={lead.id ?? idx}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => openDetail(lead)}
                                >
                                    <td className="px-4 py-3 font-mono text-[10px] text-slate-600 whitespace-nowrap">{lead.ulid?.slice(-10)}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{lead.beneficiary_name}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.beneficiary_mobile}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.referral_agent_id || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.beneficiary_state}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.beneficiary_district}</td>
                                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={lead.beneficiary_address ?? ''}>{lead.beneficiary_address ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{lead.discom_name || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">{lead.consumer_number || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.system_capacity?.replace(/_/g, ' ') || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.roof_size?.replace(/_/g, ' ') || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.monthly_bill_amount ? `₹${lead.monthly_bill_amount}` : '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                                            lead.source === 'public_form'
                                                ? (lead.referral_agent_id ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700')
                                                : 'bg-sky-100 text-sky-700'
                                        }`}>
                                            {lead.source === 'public_form'
                                                ? (lead.referral_agent_id ? 'Referral' : 'Public')
                                                : 'Executive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.assigned_super_agent?.name ?? <span className="text-slate-400 italic">Unassigned</span>}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.submitted_by_enumerator?.name ?? lead.submitted_by_agent?.name ?? <span className="text-slate-500 italic">Direct</span>}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${getLeadStatusColor(lead.status)}`}>
                                            {getLeadStatusLabel(lead.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {lead.documents?.find(d => d.document_type === 'receipt') ? (
                                            <a
                                                href={lead.documents.find(d => d.document_type === 'receipt')?.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 transition-colors uppercase tracking-tight"
                                            >
                                                <Download size={10} /> Receipt
                                            </a>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 italic">No receipt</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 text-[10px] whitespace-nowrap">{fmt(lead.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openDetail(lead); }}
                                                className="text-[10px] text-orange-600 hover:text-orange-700 font-black uppercase tracking-widest border border-orange-100 px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                                            >
                                                View
                                            </button>
                                            <LeadDocumentsModal
                                                ulid={lead.ulid}
                                                triggerButtonText=""
                                                buttonClassName="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading leads…</div>
                    ) : leads.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileText size={32} className="mx-auto text-slate-300 mb-2" aria-hidden="true" />
                            <p className="text-slate-400">No leads found.</p>
                        </div>
                    ) : leads.map(lead => (
                        <div
                            key={lead.id}
                            className="p-4 space-y-4 cursor-pointer hover:bg-slate-50 transition-all border-l-4 relative rounded-r-xl"
                            style={{ borderLeftColor: getLeadStatusColor(lead.status).split(' ')[1]?.replace('text-', '') === 'orange-600' ? '#ea580c' : (getLeadStatusColor(lead.status).includes('emerald') ? '#059669' : (getLeadStatusColor(lead.status).includes('rose') ? '#e11d48' : '#64748b')) }}
                            onClick={() => openDetail(lead)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 leading-tight flex items-center gap-2">
                                        {lead.beneficiary_name}
                                        {lead.source === 'public_form' && !lead.referral_agent_id && <span className="bg-violet-100 text-violet-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Public</span>}
                                        {lead.referral_agent_id && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Referral</span>}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Ref: {lead.ulid?.slice(-8)}</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getLeadStatusColor(lead.status)}`}>
                                            {getLeadStatusLabel(lead.status)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openDetail(lead); }}
                                    className="p-2 -mt-1 -mr-1 rounded-full text-slate-400 hover:text-slate-600"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><Phone size={10} /> Mobile</p>
                                    <p className="text-xs text-slate-700 font-medium">{lead.beneficiary_mobile}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><Hash size={10} /> Referral</p>
                                    <p className="text-xs text-indigo-600 font-bold font-mono">{lead.referral_agent_id || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><MapPin size={10} /> Location</p>
                                    <p className="text-xs text-slate-700 truncate font-medium">{lead.beneficiary_district}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><CheckCircle size={10} /> Manager</p>
                                    <p className="text-xs text-slate-700 truncate font-medium">
                                        {lead.submitted_by_enumerator?.enumerator_creator_role === 'admin' 
                                            ? 'Admin direct' 
                                            : (lead.assigned_super_agent?.name ?? 'Unassigned')}
                                    </p>
                                </div>
                            </div>

                            {activePrompts[lead.ulid] && (
                                <div className="p-3 bg-orange-50 mt-2 rounded-xl border border-orange-100 w-full" onClick={e => e.stopPropagation()}>
                                    <CommissionInlineEntry
                                        leadUlid={lead.ulid}
                                        leadStatus={lead.status}
                                        commissionPrompt={activePrompts[lead.ulid]}
                                        existingCommission={lead.formatted_commissions?.super_agent_commission || lead.formatted_commissions?.agent_commission || null}
                                        onSaved={() => {
                                            setActivePrompts(p => { const o = { ...p }; delete o[lead.ulid]; return o; });
                                        }}
                                        onSkip={() => {
                                            setActivePrompts(p => { const o = { ...p }; delete o[lead.ulid]; return o; });
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <span className="text-[10px] text-slate-400 font-medium">Added on {fmt(lead.created_at)}</span>
                                <div className="flex items-center gap-4">
                                    <LeadDocumentsModal 
                                        ulid={lead.ulid} 
                                        triggerButtonText="Documents" 
                                        buttonClassName="text-[10px] text-indigo-600 font-black tracking-widest uppercase flex items-center gap-1.5"
                                    />
                                    <span className="text-[10px] text-orange-600 font-black tracking-widest uppercase">View full details →</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Page {page} of {lastPage}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                aria-label="Previous Page"
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} aria-hidden="true" /> Prev
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                                aria-label="Next Page"
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════ LEAD DETAIL PANEL ═══════════════ */}
            {
                detail && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex justify-end"
                        onClick={() => setDetail(null)}
                        role="presentation"
                    >
                        <div
                            className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="detail-title"
                        >
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 bg-white z-10">
                                <button
                                    onClick={() => setDetail(null)}
                                    aria-label="Back to leads list"
                                    className="sm:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <ChevronLeft size={24} className="text-slate-600" />
                                </button>
                                <div className="flex-1">
                                    <h2 id="detail-title" className="text-base font-bold text-slate-800">Lead Details</h2>
                                    <p className="text-[10px] font-mono text-slate-500 uppercase">ULID: {fullLead?.ulid?.slice(-12)}</p>
                                </div>
                                <button
                                    ref={closeButtonRef}
                                    onClick={() => setDetail(null)}
                                    aria-label="Close detail panel"
                                    className="hidden sm:block p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <X size={20} className="text-slate-500 hover:text-slate-600" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                                {detailLoading ? (
                                    <p className="text-center text-slate-400 py-8">Loading…</p>
                                ) : (
                                    <>
                                        {/* ── Beneficiary ── */}
                                        <section>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Beneficiary</p>
                                            <div className="space-y-2">
                                                {([
                                                    [<User size={13} />, 'Name', fullLead?.beneficiary_name],
                                                    [<Phone size={13} />, 'Mobile', fullLead?.beneficiary_mobile],
                                                    [<Hash size={13} />, 'Referral ID', fullLead?.referral_agent_id ? (
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">{fullLead.referral_agent_id}</span>
                                                    ) : '—'],
                                                    [<MapPin size={13} />, 'State', fullLead?.beneficiary_state],
                                                    [<MapPin size={13} />, 'District', fullLead?.beneficiary_district],
                                                    [<MapPin size={13} />, 'Address', fullLead?.beneficiary_address ?? '—'],
                                                    [<Hash size={13} />, 'Consumer No.', fullLead?.consumer_number ?? '—'],
                                                    [<Hash size={13} />, 'DISCOM', fullLead?.discom_name ?? '—'],
                                                ] as [React.ReactNode, string, any][]).map(([icon, lbl, val]) => (
                                                    <div key={lbl as string} className="flex gap-3 items-start">
                                                        <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
                                                        <span className="text-xs text-slate-600 w-28 shrink-0">{lbl}</span>
                                                        <span className="text-xs font-medium text-slate-800 break-all">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* ── Bank Details ── */}
                                        <section>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                <CreditCard size={14} className="text-slate-400" /> Bank Details
                                            </p>
                                            <div className="space-y-2">
                                                {[
                                                    ['Bank Name', fullLead?.beneficiary_bank_name ?? '—'],
                                                    ['Account Number', getDisplayAccount(fullLead?.beneficiary_bank_account)],
                                                    ['IFSC Code', fullLead?.beneficiary_bank_ifsc ?? '—'],
                                                    ['Branch', fullLead?.beneficiary_bank_branch ?? '—'],
                                                ].map(([lbl, val]) => (
                                                    <div key={lbl} className="flex gap-3 items-start">
                                                        <span className="text-xs text-slate-600 w-28 shrink-0">{lbl}</span>
                                                        <span className="text-xs font-medium text-slate-800 break-all">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* ── Lead Creator Details ── */}
                                        {fullLead && (fullLead.submitted_by_agent || fullLead.submitted_by_enumerator) && (
                                            <section className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Creator Details</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                        <User size={14} className="text-orange-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-slate-700 truncate">
                                                            {fullLead.submitted_by_agent?.name || fullLead.submitted_by_enumerator?.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 capitalize leading-none mt-0.5">
                                                            Role: {fullLead.submitted_by_agent ? 'Agent' : 'Enumerator'}
                                                        </p>
                                                    </div>
                                                    {(fullLead.submitted_by_agent?.mobile || fullLead.submitted_by_enumerator?.mobile) && (
                                                        <a
                                                            href={`tel:${fullLead.submitted_by_agent?.mobile || fullLead.submitted_by_enumerator?.mobile}`}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors shrink-0"
                                                        >
                                                            <Phone size={11} className="text-slate-500" />
                                                            <span className="text-[11px] font-bold">
                                                                {fullLead.submitted_by_agent?.mobile || fullLead.submitted_by_enumerator?.mobile}
                                                            </span>
                                                        </a>
                                                    )}
                                                </div>
                                            </section>
                                        )}

                                        {/* ── System ── */}
                                        <section>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">System Info</p>
                                            <div className="space-y-2">
                                                {([
                                                    ['Source', fullLead?.source === 'public_form'
                                                        ? (fullLead.referral_agent_id ? `Referral (via ${fullLead.referral_agent_id})` : 'Public Form')
                                                        : 'Executive Submission'],
                                                    ['Roof Size', fullLead?.roof_size?.replace(/_/g, ' ') ?? '—'],
                                                    ['Capacity', (
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={fullLead?.system_capacity ?? ''}
                                                                onChange={e => updateLeadMut.mutate({ ulid: fullLead!.ulid, data: { system_capacity: e.target.value } })}
                                                                className="border border-slate-200 rounded px-2 py-0.5 text-xs bg-white"
                                                            >
                                                                <option value="">Select Capacity…</option>
                                                                {Object.entries(CAPACITY_LABEL).map(([k, v]) => (
                                                                    <option key={k} value={k}>{v}</option>
                                                                ))}
                                                            </select>
                                                            {updateLeadMut.isPending && <span className="text-[10px] text-slate-400">Saving…</span>}
                                                        </div>
                                                    )],
                                                    ['Panel Make/Model', (
                                                        <input 
                                                            type="text"
                                                            placeholder="e.g. Tata 540W Mono PERC"
                                                            value={fullLead?.system_item ?? ''}
                                                            onChange={e => updateLeadMut.mutate({ ulid: fullLead!.ulid, data: { system_item: e.target.value } })}
                                                            className="w-full border border-slate-200 rounded px-2 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                                                        />
                                                    )],
                                                    ['Inverter Make/Model', (
                                                        <input 
                                                            type="text"
                                                            placeholder="e.g. Microtek 5kVA Hybrid"
                                                            value={fullLead?.system_make ?? ''}
                                                            onChange={e => updateLeadMut.mutate({ ulid: fullLead!.ulid, data: { system_make: e.target.value } })}
                                                            className="w-full border border-slate-200 rounded px-2 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                                                        />
                                                    )],
                                                    ['Monthly Bill', fullLead?.monthly_bill_amount ? `₹${fullLead.monthly_bill_amount}` : '—'],
                                                    ['Govt. App No.', fullLead?.govt_application_number ?? '—'],
                                                    ['Business Development Manager Comm.', fullLead?.formatted_commissions?.super_agent_commission?.amount ? `₹${fullLead.formatted_commissions.super_agent_commission.amount}` : '—'],
                                                    ['Business Development Executive Comm.', fullLead?.formatted_commissions?.agent_commission?.amount ? `₹${fullLead.formatted_commissions.agent_commission.amount}` : '—'],
                                                    ['Created', fullLead?.created_at ? fmt(fullLead.created_at) : '—'],
                                                ] as [string, any][]).map(([lbl, val]) => (
                                                    <div key={lbl} className="flex gap-3 items-start">
                                                        <span className="text-xs text-slate-600 w-28 shrink-0">{lbl}</span>
                                                        <span className="text-xs font-medium text-slate-800">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* ── Business Development Manager Assignment ── */}
                                        {fullLead?.submitted_by_enumerator?.enumerator_creator_role === 'admin' ? (
                                            <section className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1 uppercase tracking-wider">
                                                    <CheckCircle size={14} /> Direct Settlement Lead
                                                </p>
                                                <p className="text-[11px] text-emerald-600">This lead was submitted by an admin-created enumerator. Settlement is handled directly between Admin and {fullLead.submitted_by_enumerator?.name}.</p>
                                            </section>
                                        ) : (
                                            <section>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Business Development Manager Assignment</p>

                                                {fullLead?.assigned_super_agent ? (
                                                    <div className="flex gap-3">
                                                        <span className="text-xs text-slate-600 w-28 shrink-0">Assigned to</span>
                                                        <span className="text-xs font-medium text-slate-800">{fullLead.assigned_super_agent.name} ({fullLead.assigned_super_agent.mobile})</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs text-slate-600 mb-2">Not yet assigned to a manager</p>
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={assignSuperAgent}
                                                                onChange={e => setAssignSuperAgent(e.target.value ? Number(e.target.value) : '')}
                                                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                            >
                                                                <option value="">Select active manager…</option>
                                                                {activeSuperAgents.map(a => (
                                                                    <option key={a.id} value={a.id}>{a.name} {a.super_agent_code ? `(${a.super_agent_code})` : ''}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                disabled={!assignSuperAgent || assignMut.isPending}
                                                                onClick={() => assignMut.mutate({ ulid: fullLead!.ulid, super_agent_id: assignSuperAgent as number })}
                                                                className="px-3 py-2 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:opacity-40 shrink-0"
                                                            >
                                                                {assignMut.isPending ? '…' : 'Assign'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </section>
                                        )}

                                        {/* ── Field Technical Team Assignment ── */}
                                        <section>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Field Technical Team Assignment</p>
                                            
                                            <div className="space-y-4">
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                    <p className="text-xs text-slate-800 mb-2 font-bold">Site Surveyor</p>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={fullLead?.assigned_surveyor_id ?? ""}
                                                            onChange={e => assignTechMut.mutate({ ulid: fullLead!.ulid, payload: { surveyor_id: Number(e.target.value) } })}
                                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                        >
                                                            <option value="">Select a surveyor…</option>
                                                            {activeTechnicians.filter(t => t.technician_type === 'surveyor' && t.status === 'active').map(t => (
                                                                <option key={t.id} value={t.id}>{t.name} ({t.mobile})</option>
                                                            ))}
                                                        </select>
                                                        {assignTechMut.isPending && <span className="p-2 text-xs text-slate-400">...</span>}
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                    <p className="text-xs text-slate-800 mb-2 font-bold">Installer</p>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={fullLead?.assigned_installer_id ?? ""}
                                                            onChange={e => assignTechMut.mutate({ ulid: fullLead!.ulid, payload: { installer_id: Number(e.target.value) } })}
                                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                        >
                                                            <option value="">Select an installer…</option>
                                                            {activeTechnicians.filter(t => t.technician_type === 'installer' && t.status === 'active').map(t => (
                                                                <option key={t.id} value={t.id}>{t.name} ({t.mobile})</option>
                                                            ))}
                                                        </select>
                                                        {assignTechMut.isPending && <span className="p-2 text-xs text-slate-400">...</span>}
                                                    </div>
                                                </div>

                                                {fullLead?.installation_scheduled_at && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                                                                <Calendar size={12} /> Installation Scheduled
                                                            </p>
                                                            <p className="text-sm font-black text-blue-900">
                                                                {fmt(fullLead.installation_scheduled_at)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <Calendar size={20} className="text-blue-600" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                        {/* ── Documents ── */}
                                        <section>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Documents & Bills</p>
                                            <LeadDocumentsModal ulid={fullLead!.ulid} />
                                        </section>

                                        {/* ── Billing & Invoice ── */}
                                        <section>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <FileText size={14} /> Billing & Invoice Generation
                                            </p>
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quotation Serial No.</label>
                                                        <input 
                                                            type="text" 
                                                            value={quotationSerial}
                                                            onChange={e => setQuotationSerial(e.target.value)}
                                                            placeholder="e.g. 119"
                                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receipt Serial No.</label>
                                                        <input 
                                                            type="text" 
                                                            value={receiptSerial}
                                                            onChange={e => setReceiptSerial(e.target.value)}
                                                            placeholder="e.g. 299"
                                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* ── Multi-Item Billing Table ── */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bill Items</label>
                                                        <button 
                                                            onClick={() => setBillingItemsList([...billingItemsList, { description: '', make: '', qty: '1', rate: '' }])}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded"
                                                        >
                                                            <Plus size={10} /> Add Item
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        {billingItemsList.map((item, idx) => {
                                                            const foundItem = inventoryItems.find((i: any) => i.name === item.description);
                                                            return (
                                                            <div key={idx} className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm space-y-2">
                                                                <div className="grid grid-cols-12 gap-2">
                                                                    {/* Description (inventory picker) */}
                                                                    <div className="col-span-4">
                                                                        <select
                                                                            value={item.description ?? ''}
                                                                            onChange={e => {
                                                                                const newList = [...billingItemsList];
                                                                                const selectedName = e.target.value;
                                                                                newList[idx].description = selectedName;
                                                                                // Auto-fill make from inventory, but do NOT overwrite rate
                                                                                const found = inventoryItems.find((i: any) => i.name === selectedName);
                                                                                if (found?.make) {
                                                                                    newList[idx].make = found.make;
                                                                                }
                                                                                setBillingItemsList(newList);
                                                                            }}
                                                                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                        >
                                                                            <option value="">Description...</option>
                                                                            {inventoryItems.map((opt: any) => (
                                                                                <option key={opt.id} value={opt.name}>{opt.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    {/* Make (auto-filled, editable) */}
                                                                    <div className="col-span-3">
                                                                        <input
                                                                            type="text"
                                                                            value={item.make ?? ''}
                                                                            onChange={e => {
                                                                                const newList = [...billingItemsList];
                                                                                newList[idx].make = e.target.value;
                                                                                setBillingItemsList(newList);
                                                                            }}
                                                                            placeholder="Make / Brand"
                                                                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                        />
                                                                    </div>

                                                                    {/* Qty */}
                                                                    <div className="col-span-2">
                                                                        <input
                                                                            type="number"
                                                                            value={item.qty ?? '1'}
                                                                            onChange={e => {
                                                                                const newList = [...billingItemsList];
                                                                                newList[idx].qty = e.target.value;
                                                                                setBillingItemsList(newList);
                                                                            }}
                                                                            placeholder="Qty"
                                                                            min="1"
                                                                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                        />
                                                                    </div>

                                                                    {/* Rate — admin enters their own amount */}
                                                                    <div className="col-span-2">
                                                                        <input
                                                                            type="number"
                                                                            value={item.rate ?? ''}
                                                                            onChange={e => {
                                                                                const newList = [...billingItemsList];
                                                                                newList[idx].rate = e.target.value;
                                                                                setBillingItemsList(newList);
                                                                            }}
                                                                            placeholder="Amount ₹"
                                                                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                        />
                                                                    </div>

                                                                    {/* Remove */}
                                                                    <div className="col-span-1 flex items-center justify-center">
                                                                        <button
                                                                            onClick={() => setBillingItemsList(billingItemsList.filter((_, i) => i !== idx))}
                                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Base price hint from inventory */}
                                                                {foundItem?.base_price !== undefined && (
                                                                    <div className="flex items-center gap-1.5 px-2">
                                                                        <span className="text-[10px] text-slate-400">Catalogue price:</span>
                                                                        <span className="text-[10px] font-bold text-emerald-700">₹{Number(foundItem.base_price).toLocaleString()}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newList = [...billingItemsList];
                                                                                newList[idx].rate = String(foundItem.base_price);
                                                                                setBillingItemsList(newList);
                                                                            }}
                                                                            className="text-[10px] text-indigo-500 font-bold hover:text-indigo-700 underline ml-1"
                                                                        >
                                                                            Use this
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            );
                                                        })}



                                                        {billingItemsList.length === 0 && (
                                                            <div className="text-center py-4 bg-white border border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px]">
                                                                No items added yet. Click "Add Item" to begin.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ── GST and Totals ── */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GST Percentage (%)</label>
                                                        <input 
                                                            type="number" 
                                                            value={gstPercentage}
                                                            onChange={e => setGstPercentage(e.target.value)}
                                                            placeholder="e.g. 5"
                                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receipt Percentage (%)</label>
                                                        <input 
                                                            type="number" 
                                                            value={receiptPercentage}
                                                            onChange={e => setReceiptPercentage(e.target.value)}
                                                            placeholder="e.g. 10"
                                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 flex items-end">
                                                        <button 
                                                            disabled={updateLeadMut.isPending || billingItemsList.length === 0}
                                                            onClick={() => {
                                                                const subtotal = billingItemsList.reduce((acc, it) => acc + (Number(it.rate) || 0) * (Number(it.qty) || 1), 0);
                                                                const gstTotal = subtotal * ((Number(gstPercentage) || 0) / 100);
                                                                const totalAmt = subtotal + gstTotal;
                                                                const receiptAmt = totalAmt * ((Number(receiptPercentage) || 0) / 100);
                                                                
                                                                updateLeadMut.mutate({ 
                                                                    ulid: fullLead!.ulid, 
                                                                    data: { 
                                                                        quotation_serial: quotationSerial,
                                                                        receipt_serial: receiptSerial,
                                                                        quotation_base_amount: subtotal,
                                                                        quotation_gst_amount: gstTotal,
                                                                        quotation_total_amount: totalAmt,
                                                                        receipt_amount: Math.round(receiptAmt),
                                                                        billing_items: billingItemsList.map(it => ({ ...it, rate: Number(it.rate), qty: Number(it.qty) || 1 })),
                                                                        billing_gst_percentage: Number(gstPercentage) || 0
                                                                    }
                                                                });
                                                            }}
                                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                                        >
                                                            {updateLeadMut.isPending ? 'Saving...' : 'Save Multi-Item Bill'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {billingItemsList.length > 0 && (
                                                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-mono text-indigo-800">
                                                        {(() => {
                                                            const subtotal = billingItemsList.reduce((acc, it) => acc + (Number(it.rate) || 0) * (Number(it.qty) || 1), 0);
                                                            const gstTotal = subtotal * ((Number(gstPercentage) || 0) / 100);
                                                            const totalAmt = subtotal + gstTotal;
                                                            return (
                                                                <>
                                                                    <span>Subtotal: ₹{subtotal.toLocaleString()}</span>
                                                                    <span>GST ({gstPercentage}%): ₹{gstTotal.toLocaleString()}</span>
                                                                    <span className="font-bold">Grand Total: ₹{totalAmt.toLocaleString()}</span>
                                                                    <span className="text-orange-700 font-bold ml-auto">
                                                                        Receipt Drop: ₹{Math.round(totalAmt * ((Number(receiptPercentage)||0)/100)).toLocaleString()}
                                                                    </span>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        {/* ── Installation Evidence Review ── */}
                                        {(fullLead as any)?.installation_submissions?.length > 0 && (
                                            <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                                                    📸 Installer Evidence ({(fullLead as any).installation_submissions[0]?.installation_documents?.length ?? 0} photos)
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(fullLead as any).installation_submissions[0]?.installation_documents?.map((doc: any) => (
                                                        <a
                                                            key={doc.id}
                                                            href={doc.signed_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block bg-white border border-emerald-100 rounded-lg p-2.5 hover:border-emerald-400 hover:shadow-sm transition-all group"
                                                        >
                                                            <p className="text-[10px] font-semibold text-emerald-800 truncate group-hover:text-emerald-600">
                                                                {doc.document_label || doc.document_key}
                                                            </p>
                                                            {doc.model_make && <p className="text-[9px] text-slate-500 truncate mt-0.5">Make: {doc.model_make}</p>}
                                                            {doc.serial_number && <p className="text-[9px] text-slate-500 truncate">S/N: {doc.serial_number}</p>}
                                                            {doc.latitude && (
                                                                <p className="text-[9px] text-slate-400 mt-0.5">
                                                                    📍 {Number(doc.latitude).toFixed(5)}, {Number(doc.longitude).toFixed(5)}
                                                                </p>
                                                            )}
                                                            <p className="text-[9px] text-emerald-600 font-medium mt-1">🔗 View Photo →</p>
                                                        </a>
                                                    ))}
                                                </div>
                                                {(fullLead as any).installation_submissions[0]?.latitude && (
                                                    <p className="text-[10px] text-slate-500 bg-white rounded-lg p-2 border border-emerald-100">
                                                        📍 Submission GPS: {Number((fullLead as any).installation_submissions[0].latitude).toFixed(6)},
                                                        {' '}{Number((fullLead as any).installation_submissions[0].longitude).toFixed(6)}
                                                    </p>
                                                )}
                                            </section>
                                        )}

                                        {/* ── Parallel Track Panel (Survey & Banking Roadmap) ── */}
                                        {(() => {
                                            const currentPos = ORDERED_PIPELINE.indexOf(fullLead?.status ?? '');
                                            const surveyDone = !!(fullLead as any)?.surveyor_form_submitted_at || 
                                                ['SURVEY_DONE', 'LEAD_DOCUMENTS_PRINTED', 'SIGNATURE_PENDING',
                                                 'SIGNATURE_DONE', 'FILE_SUBMITTED_TO_BANK', 'FILE_PENDING_DISBURSAL', 'FILE_REJECTED', 'FILE_DISBURSED', 'DISBURSEMENT_VERIFIED',
                                                 'SUBSIDY_APPLIED', 'DISPATCH_INITIATED', 'IN_TRANSIT',
                                                 'DELIVERED', 'MATERIAL_VERIFIED_BY_CONSUMER', 'INSTALLATION_SCHEDULED',
                                                 'INSTALLATION_IN_PROGRESS', 'SOLAR_INSTALLED', 'POD_INSPECTION_INITIATED', 'POD_SUCCESSFUL', 'LEAD_COMPLETED'].includes(fullLead?.status ?? '');
                                            const bankingSteps = [
                                                { key: 'LEAD_DOCUMENTS_PRINTED',  label: 'LEGAL DOCUMENTS PRINTED',      pos: ORDERED_PIPELINE.indexOf('LEAD_DOCUMENTS_PRINTED') },
                                                { key: 'SIGNATURE_PENDING',       label: 'CONSUMER SIGNATURE PENDING',   pos: ORDERED_PIPELINE.indexOf('SIGNATURE_PENDING') },
                                                { key: 'SIGNATURE_DONE',          label: 'CONSUMER SIGNATURE DONE',      pos: ORDERED_PIPELINE.indexOf('SIGNATURE_DONE') },
                                                { key: 'FILE_DISBURSED',          label: 'FILE DISBURSED SUCCESSFULLY',  pos: ORDERED_PIPELINE.indexOf('FILE_DISBURSED') },
                                            ];

                                            const fireStatus = (st: string) => {
                                                const fd = new FormData();
                                                fd.append('status', st);
                                                statusMut.mutate({ ulid: fullLead!.ulid, formData: fd });
                                            };

                                            return (
                                                <section className="rounded-xl border border-slate-200 overflow-hidden mb-4">
                                                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parallel Progress Tracks (Survey & Banking)</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                                                        {/* Survey Track */}
                                                        <div className="p-3 space-y-2">
                                                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"/>
                                                                Survey Track
                                                            </p>
                                                            <button
                                                                onClick={() => { if (!surveyDone) fireStatus('SURVEY_DONE'); }}
                                                                disabled={surveyDone || statusMut.isPending}
                                                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border text-left text-[10px] font-bold transition-all ${
                                                                    surveyDone
                                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                                                                }`}
                                                            >
                                                                <span className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 ${
                                                                    surveyDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                                                }`}>
                                                                    {surveyDone && <CheckCircle size={10} className="text-white" />}
                                                                </span>
                                                                SITE SURVEY COMPLETED
                                                            </button>
                                                        </div>

                                                        {/* Banking Track */}
                                                        <div className="p-3 space-y-2">
                                                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"/>
                                                                Banking Track
                                                            </p>
                                                            {bankingSteps.map((step, i) => {
                                                                const isDone = currentPos >= step.pos && currentPos !== -1;
                                                                const isNext = !isDone && (i === 0 || (currentPos >= bankingSteps[i - 1].pos && currentPos !== -1) || currentPos >= ORDERED_PIPELINE.indexOf('REGISTERED'));
                                                                return (
                                                                    <button
                                                                        key={step.key}
                                                                        onClick={() => { if (isNext) fireStatus(step.key); }}
                                                                        disabled={!isNext || statusMut.isPending}
                                                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left text-[10px] font-bold transition-all ${
                                                                            isDone
                                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                                : isNext
                                                                                    ? 'bg-white border-orange-300 text-orange-700 hover:bg-orange-50'
                                                                                    : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                                                        }`}
                                                                    >
                                                                        <span className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 ${
                                                                            isDone ? 'bg-emerald-500 border-emerald-500' : isNext ? 'border-orange-400' : 'border-slate-200'
                                                                        }`}>
                                                                            {isDone && <CheckCircle size={10} className="text-white" />}
                                                                        </span>
                                                                        {step.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Merge Gate Logic */}
                                                    {fullLead?.status === 'FILE_DISBURSED' && (
                                                        <div className={`px-4 py-2.5 border-t flex items-center gap-2 ${surveyDone ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                                            {surveyDone ? (
                                                                <>
                                                                    <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                                                                    <p className="text-[10px] text-emerald-700 font-bold">Both tracks complete ✓ — Advance to Disbursement Verified below.</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertCircle size={12} className="text-amber-600 shrink-0" />
                                                                    <p className="text-[10px] text-amber-700 font-bold">Banking complete but Site Survey pending.</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </section>
                                            );
                                        })()}

                                        {/* ── Status Update Dropdown ── */}
                                        {(() => {
                                            const parallelStatuses = [
                                                'SURVEY_DONE', 'LEAD_DOCUMENTS_PRINTED',
                                                'SIGNATURE_PENDING', 'SIGNATURE_DONE', 'FILE_DISBURSED'
                                            ];
                                            const parallelZone = ['REGISTERED', ...parallelStatuses];
                                            const inParallel = parallelZone.includes(fullLead?.status ?? '');

                                            // Allow LEAD_DOCUMENTS_PRINTED for NEW leads so admin can print
                                            // bills/agreements before MNRE registration
                                            const isNewLead = fullLead?.status === 'NEW';

                                            const forwardOptions = LEAD_STATUS_OPTIONS.filter(opt => {
                                                // For NEW leads: show LEAD_DOCUMENTS_PRINTED as the pre-registration billing step
                                                if (isNewLead && opt.value === 'LEAD_DOCUMENTS_PRINTED') return true;
                                                // All other parallel steps are handled by the parallel zone view
                                                if (parallelStatuses.includes(opt.value)) return false;
                                                // Show all non-parallel options to Admin for full control
                                                return true;
                                            });

                                            if (inParallel) {
                                                return (
                                                    <section className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Override Only</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    const fd = new FormData();
                                                                    fd.append('status', 'REJECTED');
                                                                    if (statusNote) fd.append('notes', statusNote);
                                                                    statusMut.mutate({ ulid: fullLead!.ulid, formData: fd });
                                                                }}
                                                                disabled={statusMut.isPending}
                                                                className="flex-1 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors"
                                                            >
                                                                ✕ Mark as Rejected
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const fd = new FormData();
                                                                    fd.append('status', 'DISBURSEMENT_VERIFIED');
                                                                    if (statusNote) fd.append('notes', statusNote);
                                                                    statusMut.mutate({ ulid: fullLead!.ulid, formData: fd });
                                                                }}
                                                                disabled={statusMut.isPending || fullLead?.status !== 'FILE_DISBURSED' || !((fullLead as any)?.surveyor_form_submitted_at)}
                                                                className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40"
                                                            >
                                                                ✓ Disbursement Verified
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={1}
                                                            value={statusNote}
                                                            onChange={e => setStatusNote(e.target.value)}
                                                            placeholder="Note..."
                                                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                                        />
                                                    </section>
                                                );
                                            }

                                            return (
                                                <section className="space-y-3">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Update Lead Status</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLeadStatusColor(fullLead?.status ?? '')}`}>
                                                            {getLeadStatusLabel(fullLead?.status ?? '')}
                                                        </span>
                                                        <span className="text-slate-400 text-xs">→</span>
                                                        <select
                                                            value={newStatus ?? ''}
                                                            onChange={e => setNewStatus(e.target.value)}
                                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        >
                                                            {forwardOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Skip warning */}
                                                    {newStatus && fullLead?.status && (() => {
                                                        const skips = countPipelineSkips(fullLead.status, newStatus);
                                                        return skips !== null && skips > 0 ? (
                                                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                                                                <p className="text-[10px] font-bold text-rose-700 uppercase">⚠ Skipping {skips} stages!</p>
                                                            </div>
                                                        ) : null;
                                                    })()}

                                                    <textarea
                                                        rows={2}
                                                        value={statusNote}
                                                        onChange={e => setStatusNote(e.target.value)}
                                                        placeholder="Optional note..."
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                                    />

                                                    {newStatus === 'LEAD_COMPLETED' && (
                                                        <div className="space-y-1.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                            <label className="text-[10px] font-bold text-blue-700 uppercase">Upload Receipt</label>
                                                            <input type="file" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="text-xs" />
                                                        </div>
                                                    )}

                                                    {newStatus === 'INSTALLATION_SCHEDULED' && (
                                                        <div className="space-y-1.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                            <label className="text-[10px] font-bold text-blue-700 uppercase">Installation Date</label>
                                                            <input type="date" value={installationDate} onChange={e => setInstallationDate(e.target.value)} className="w-full text-xs" />
                                                        </div>
                                                    )}

                                                    <button
                                                        disabled={!newStatus || newStatus === fullLead?.status || statusMut.isPending}
                                                        onClick={() => {
                                                            if (newStatus === 'REGISTERED') {
                                                                setIsStatusModalOpen(true);
                                                                return;
                                                            }
                                                            const fd = new FormData();
                                                            fd.append('status', newStatus);
                                                            if (statusNote) fd.append('notes', statusNote);
                                                            if (receiptFile) fd.append('receipt', receiptFile);
                                                            if (newStatus === 'INSTALLATION_SCHEDULED' && installationDate) {
                                                                fd.append('installation_scheduled_at', installationDate);
                                                            }
                                                            statusMut.mutate({ ulid: fullLead!.ulid, formData: fd });
                                                        }}
                                                        className="w-full py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                                                    >
                                                        {statusMut.isPending ? 'Saving...' : 'Save Status Change'}
                                                    </button>
                                                </section>
                                            );
                                        })()}


                                        {/* ── Commission Entry — only for terminal milestone leads ── */}
                                        {role === 'admin' && MILESTONE_STATUSES.includes(fullLead?.status as any) && (fullLead?.commission_status?.prompts?.length ?? 0) > 0 && (
                                            <section className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">💰 Commission Management</p>
                                                </div>

                                                <div className="space-y-4">
                                                    {fullLead!.commission_status!.prompts!.filter((p: any) => p.payer_role === 'admin' || p.payer_role === 'super_admin').map((p: any, idx: number) => {
                                                        const existing = fullLead?.formatted_commissions?.all?.find((c: any) => 
                                                            (c.payee_id === p.payee_id || c.payee_role === p.payee_role)
                                                        );

                                                        return (
                                                            <CommissionInlineEntry
                                                                key={`${p.payee_role}-${p.payee_id}-${idx}`}
                                                                leadUlid={fullLead!.ulid}
                                                                leadStatus={fullLead!.status}
                                                                commissionPrompt={p}
                                                                existingCommission={existing || null}
                                                                onSaved={() => {
                                                                    if (fullLead) {
                                                                        qc.invalidateQueries({ queryKey: ['admin-lead-detail', fullLead.ulid] });
                                                                        qc.invalidateQueries({ queryKey: ['admin-leads'] });
                                                                    }
                                                                }}
                                                                onSkip={() => {}}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        )}


                                        {/* ── Admin Notes ── */}
                                        {fullLead?.admin_notes && (
                                            <section>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Admin Notes</p>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex gap-2">
                                                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs text-amber-800">{fullLead.admin_notes}</p>
                                                </div>
                                            </section>
                                        )}

                                        {/* F3 + F4 — Status History with geotag evidence + technician banner */}
                                        {(fullLead?.status_logs?.length ?? 0) > 0 && (
                                            <section>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Status History</p>

                                                {/* F4 — Banner: last change was by a field technician */}
                                                {fullLead!.status_logs![0]?.changed_by_role === 'field_technical_team' && (
                                                    <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                                                        <AlertCircle size={14} className="text-amber-500 shrink-0" />
                                                        <span>Status last changed by Field Tech: <strong>{fullLead!.status_logs![0].changedBy?.name ?? 'Technician'}</strong> on {fmt(fullLead!.status_logs![0].created_at)}</span>
                                                    </div>
                                                )}

                                                <ol className="relative border-l border-slate-200 space-y-4 ml-2">
                                                    {fullLead!.status_logs!.map(log => (
                                                        <li key={log.id} className="ml-4">
                                                            <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`px-1.5 py-0.5 rounded text-xs ${getLeadStatusColor(log.from_status)}`}>{getLeadStatusLabel(log.from_status)}</span>
                                                                <span className="text-slate-400 text-xs">→</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-xs ${getLeadStatusColor(log.to_status)}`}>{getLeadStatusLabel(log.to_status)}</span>
                                                                {log.changed_by_role === 'field_technical_team' && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">Field Tech</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Calendar size={11} className="text-slate-400" />
                                                                <span className="text-xs text-slate-500">{fmt(log.created_at)}</span>
                                                                {log.changedBy && <span className="text-xs text-slate-400">by {log.changedBy.name}</span>}
                                                            </div>
                                                            {log.notes && <p className="text-xs text-slate-500 mt-0.5 italic">"{log.notes}"</p>}
                                                            {/* F3 — Geotag evidence (visible when set by field tech) */}
                                                            {log.geotag_photo_path && (
                                                                <div className="mt-2 flex items-start gap-3">
                                                                    <img
                                                                        src={`/storage/${log.geotag_photo_path}`}
                                                                        alt="Geotag selfie"
                                                                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                                                                    />
                                                                    <div className="space-y-1">
                                                                        {log.latitude && log.longitude && (
                                                                            <a
                                                                                href={`https://maps.google.com/?q=${log.latitude},${log.longitude}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center gap-1 text-[10px] text-blue-600 underline hover:text-blue-800"
                                                                            >
                                                                                <MapPin size={10} />
                                                                                {Number(log.latitude).toFixed(5)}, {Number(log.longitude).toFixed(5)} — View on Maps
                                                                            </a>
                                                                        )}
                                                                        <p className="text-[10px] text-slate-400 italic">Geo-tagged site photo</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </section>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer close */}
                            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
                                <button onClick={() => setDetail(null)}
                                    className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <StatusTransitionModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onSubmit={(formData) => {
                    statusMut.mutate({ ulid: fullLead!.ulid, formData });
                }}
                isPending={statusMut.isPending}
                targetStatus="REGISTERED"
                targetStatusLabel="Registered at MNRE"
            />
        </div>
    );
}
