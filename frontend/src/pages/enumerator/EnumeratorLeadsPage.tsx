import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle, ChevronLeft, ChevronRight, Search, Filter, Phone, MapPin, Zap } from 'lucide-react';
import { enumeratorApi } from '@/services/enumerator.api';
import LeadStatusBadge from '@/components/shared/LeadStatusBadge';
import { VerificationStatusBadge } from '@/components/shared/VerificationStatusBadge';
import { formatDate } from '@/utils/formatters';
import type { Lead } from '@/types';
import { LEAD_STATUS_OPTIONS, getLeadStatusLabel, getLeadStatusColor } from '@/constants/leadStatuses';
import MobileFilterModal from '@/components/shared/MobileFilterModal';
import { LeadDocumentsModal } from '@/components/leads/LeadDocumentsModal';
import { LeadStatusUpdateModal } from '@/components/leads/LeadStatusUpdateModal';

export default function EnumeratorLeadsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['enumerator-leads', page, search, status],
        queryFn: () => enumeratorApi.getLeads({ 
            page,
            search: search || undefined,
            status: status || undefined
        }),
    });

    const leads: Lead[] = data?.data?.data ?? [];
    const totalPages = data?.data?.last_page ?? 1;
    const totalLeads = data?.data?.total ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        My Leads
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Track submissions and status updates
                        {totalLeads > 0 && <span className="ml-1 text-slate-400">({totalLeads} total)</span>}
                    </p>
                </div>
                <Link
                    to="/enumerator/leads/new"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-100 active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" /> New Lead
                </Link>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search beneficiary name..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                    />
                </div>
                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Statuses</option>
                    {LEAD_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {(search || status) && (
                    <button
                        onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-2"
                    >
                        <Filter size={13} /> Clear
                    </button>
                )}
            </div>

            {/* Mobile Filters Header */}
            <div className="sm:hidden flex items-center justify-between gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search your leads..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-8 pr-4 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`relative p-2 rounded-full border border-slate-200 ${status ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white text-slate-600'}`}
                >
                    <Filter size={18} />
                    {status && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                    )}
                </button>
            </div>

            <MobileFilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                fields={[
                    { id: 'search', label: 'Search', type: 'text' as const, placeholder: 'Beneficiary name...' },
                    { id: 'status', label: 'Status', type: 'select' as const, options: LEAD_STATUS_OPTIONS }
                ]}
                values={{ search, status }}
                onChange={(id, val) => {
                    if (id === 'search') setSearch(val);
                    if (id === 'status') setStatus(val);
                    setPage(1);
                }}
                onClear={() => {
                    setSearch(''); setStatus(''); setPage(1);
                }}
            />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm" aria-label="My Submitted Leads">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Ref', 'Beneficiary', 'Mobile', 'District', 'Capacity', 'Category', 'Verification', 'Status', 'Date', 'Documents'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={8} className="text-center py-12 text-slate-400">Loading leads...</td></tr>
                            ) : leads.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No leads found. Submit your first lead!</td></tr>
                            ) : leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{lead.ulid?.slice(-8)}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{lead.beneficiary_name}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.beneficiary_mobile}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.beneficiary_district}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.system_capacity?.replace(/_/g, ' ') || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.category || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <VerificationStatusBadge status={lead.verification_status} revertCount={lead.revert_count} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <LeadStatusBadge status={lead.status} />
                                        {lead.status === 'REJECTED' && lead.rejection_reason && (
                                            <div className="mt-1 text-[10px] text-red-600 font-medium truncate max-w-[150px]" title={lead.rejection_reason}>
                                                Reason: {lead.rejection_reason}
                                            </div>
                                        )}
                                        {(lead.status === 'FILE_DISBURSED' || lead.status === 'DISBURSEMENT_VERIFIED') && lead.admin_notes && (
                                            <div className="mt-1 text-[10px] text-emerald-600 font-medium truncate max-w-[150px]" title={lead.admin_notes}>
                                                Ref: {lead.admin_notes}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(lead.created_at)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <LeadDocumentsModal ulid={lead.ulid} />
                                            <LeadStatusUpdateModal lead={lead} queryKeyToInvalidate={['enumerator-leads']} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-300">Loading...</div>
                    ) : leads.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText size={40} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-slate-400 text-sm font-medium">No leads yet.</p>
                        </div>
                    ) : leads.map((lead) => (
                        <div 
                            key={lead.id} 
                            className="p-4 space-y-4 border-l-4 transition-all hover:bg-slate-50"
                            style={{ borderLeftColor: getLeadStatusColor(lead.status).split(' ')[1]?.replace('text-', '') === 'orange-600' ? '#ea580c' : (getLeadStatusColor(lead.status).includes('emerald') ? '#059669' : (getLeadStatusColor(lead.status).includes('rose') ? '#e11d48' : '#64748b')) }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-800 leading-tight">{lead.beneficiary_name}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Ref: {lead.ulid?.slice(-8)}</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getLeadStatusColor(lead.status)}`}>
                                            {getLeadStatusLabel(lead.status)}
                                        </span>
                                        {lead.status === 'REJECTED' && lead.rejection_reason && (
                                            <div className="w-full mt-0.5 text-[10px] text-red-600 font-medium" title={lead.rejection_reason}>
                                                Reason: {lead.rejection_reason}
                                            </div>
                                        )}
                                        {(lead.status === 'FILE_DISBURSED' || lead.status === 'DISBURSEMENT_VERIFIED') && lead.admin_notes && (
                                            <div className="w-full mt-0.5 text-[10px] text-emerald-600 font-medium" title={lead.admin_notes}>
                                                Ref: {lead.admin_notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <VerificationStatusBadge status={lead.verification_status} revertCount={lead.revert_count} />
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-medium">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><Phone size={10} /> Mobile</p>
                                    <p className="text-xs text-slate-700">{lead.beneficiary_mobile}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 justify-end"><MapPin size={10} /> District</p>
                                    <p className="text-xs text-slate-700 truncate">{lead.beneficiary_district}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><Zap size={10} /> Capacity</p>
                                    <p className="text-xs text-slate-700">{lead.system_capacity?.replace(/_/g, ' ') || '—'}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 justify-end"><PlusCircle size={10} /> Details</p>
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Active Submission</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <span className="text-[10px] text-slate-400 font-medium tracking-tight">Submitted on {formatDate(lead.created_at)}</span>
                                <div className="flex items-center gap-3">
                                    <LeadDocumentsModal ulid={lead.ulid} />
                                    <LeadStatusUpdateModal lead={lead} queryKeyToInvalidate={['enumerator-leads']} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1}
                            className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40 font-bold text-slate-600 shadow-sm active:scale-95 transition-all"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span className="text-xs font-bold text-slate-500">Page {page} of {totalPages}</span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            disabled={page === totalPages}
                            className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40 font-bold text-slate-600 shadow-sm active:scale-95 transition-all"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
