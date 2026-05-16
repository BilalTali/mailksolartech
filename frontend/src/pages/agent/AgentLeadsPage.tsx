import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle, CornerUpLeft, DollarSign, Search, Filter, Phone, MapPin, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { leadsApi } from '@/services/leads.api';
import type { Lead } from '@/types';
import LeadStatusBadge from '@/components/shared/LeadStatusBadge';
import { VerificationStatusBadge } from '@/components/shared/VerificationStatusBadge';
import { RevertedLeadBanner } from '@/components/agent/RevertedLeadBanner';
import { formatDate } from '@/utils/formatters';
import { VerifyLeadModal } from '@/components/agent/VerifyLeadModal';
import { RevertLeadModal } from '@/components/agent/RevertLeadModal';
import { agentCommissionsApi } from '@/services/commissions.api';
import CommissionInlineEntryForAgent from '@/components/super-agent/CommissionInlineEntryForAgent';
import { LEAD_STATUS_OPTIONS, getLeadStatusColor } from '@/constants/leadStatuses';
import MobileFilterModal from '@/components/shared/MobileFilterModal';
import { LeadDocumentsModal } from '@/components/leads/LeadDocumentsModal';
import { LeadStatusUpdateModal } from '@/components/leads/LeadStatusUpdateModal';


export default function AgentLeadsPage() {
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const [verifyingLead, setVerifyingLead] = useState<Lead | null>(null);
    const [revertingLead, setRevertingLead] = useState<Lead | null>(null);
    const [activeCommissionPrompt, setActiveCommissionPrompt] = useState<{ leadUlid: string, prompt: any } | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['agent-leads', page, search, status],
        queryFn: () => leadsApi.getAgentLeads({ 
            page,
            search: search || undefined,
            status: status || undefined
        }),
    });

    const leads = data?.data?.data || [];
    const totalPages = data?.data?.last_page || 1;
    const revertedCount = (data?.data as any)?.meta?.reverted_count ??
        leads.filter((l: Lead) => l.verification_status === 'reverted_to_agent').length;

    return (
        <div className="space-y-6">
            {/* Reverted Leads Banner */}
            <RevertedLeadBanner
                count={revertedCount}
                onActionClick={() => navigate('/agent/leads?filter=reverted')}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">My Leads</h1>
                    <p className="text-sm text-slate-600 mt-0.5">Manage and track your submitted leads</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/agent/leads/new"
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-100 active:scale-95"
                    >
                        <PlusCircle size={18} /> New Lead
                    </Link>
                </div>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name, mobile..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
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
                        placeholder="Search leads..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-8 pr-4 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`relative p-2 rounded-full border border-slate-200 ${status ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white text-slate-600'}`}
                >
                    <Filter size={18} />
                    {status && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                    )}
                </button>
            </div>

            <MobileFilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                fields={[
                    { id: 'search', label: 'Search', type: 'text' as const, placeholder: 'Name or mobile...' },
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
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm" aria-label="My Leads List">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {[
                                    'Lead Ref', 'Beneficiary', 'Submitted By', 'Mobile', 'State', 'District',
                                    'DISCOM', 'Consumer No.', 'Capacity', 'Roof Size', 'Monthly Bill',
                                    'Commission', 'Pay Status', 'Verification', 'Status', 'Date', 'Action'
                                ].map(h => (
                                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={17} className="text-center py-12 text-slate-400">Loading leads...</td></tr>
                            ) : leads.length === 0 ? (
                                <tr><td colSpan={17} className="text-center py-12 text-slate-400">No leads found.</td></tr>
                            ) : (
                                leads.map((lead) => (
                                    <React.Fragment key={lead.id}>
                                    <tr
                                        className={`hover:bg-slate-50 transition-colors ${lead.verification_status === 'reverted_to_agent'
                                            ? 'bg-red-50 border-l-4 border-red-500'
                                            : ''
                                            } ${activeCommissionPrompt?.leadUlid === lead.ulid ? 'bg-orange-50/50' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{lead.ulid?.slice(-8)}</td>
                                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span>{lead.beneficiary_name}</span>
                                                {lead.referral_agent_id && (
                                                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">Referral Lead</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {lead.submitted_by_enumerator ? (
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="text-slate-800 font-medium">{lead.submitted_by_enumerator.name}</span>
                                                        <span className="text-[9px] text-emerald-600 font-mono font-bold uppercase tracking-tighter">Enm: {lead.submitted_by_enumerator.enumerator_id}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic text-xs">Self</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-sm">
                                                {lead.submitted_by_enumerator?.enumerator_creator_role === 'admin' ? (
                                                    <span className="text-emerald-700 font-semibold italic text-xs uppercase tracking-tighter">Direct Settlement</span>
                                                ) : (
                                                    lead.beneficiary_mobile || '—'
                                                )}
                                            </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.beneficiary_state}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.beneficiary_district}</td>

                                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{lead.discom_name || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">{lead.consumer_number || '—'}</td>

                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.system_capacity?.replace(/_/g, ' ') || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.roof_size?.replace(/_/g, ' ') || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.monthly_bill_amount ? `₹${lead.monthly_bill_amount}` : '—'}</td>


                                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-bold text-center">
                                            {(() => {
                                                const agentComm = lead.formatted_commissions?.all?.find(c => c.payee_role === 'agent');
                                                return agentComm ? `₹${agentComm.amount}` : '—';
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            {(() => {
                                                const agentComm = lead.formatted_commissions?.all?.find(c => c.payee_role === 'agent');
                                                if (!agentComm) return '—';
                                                return (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${agentComm.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {agentComm.payment_status}
                                                    </span>
                                                );
                                            })()}
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <VerificationStatusBadge
                                                status={lead.verification_status}
                                                revertCount={lead.revert_count}
                                            />
                                            {lead.verification_status === 'reverted_to_agent' && lead.revert_reason && (
                                                <p className="text-xs text-red-600 mt-1 max-w-[160px] truncate" title={lead.revert_reason}>
                                                    ↩ {lead.revert_reason}
                                                </p>
                                            )}
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
                                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                                            {formatDate(lead.created_at)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {lead.verification_status === 'reverted_to_agent' && (
                                                <Link
                                                    to={`/agent/leads/${lead.ulid}/resubmit`}
                                                    className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors block text-center mb-1"
                                                >
                                                    ↩ Edit & Resubmit
                                                </Link>
                                            )}
                                            
                                            {lead.verification_status === 'pending_agent_verification' && (
                                                <div className="flex gap-1.5 mb-1">
                                                    <button
                                                        onClick={() => setVerifyingLead(lead)}
                                                        className="px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={10} /> Verify
                                                    </button>
                                                    <button
                                                        onClick={() => setRevertingLead(lead)}
                                                        className="px-2 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <CornerUpLeft size={10} /> Revert
                                                    </button>
                                                </div>
                                            )}

                                            {(() => {
                                                const prompts = lead.commission_status?.prompts || [];
                                                if (prompts.length === 0) return null;

                                                return (
                                                    <button
                                                        onClick={() => setActiveCommissionPrompt({ leadUlid: lead.ulid, prompt: prompts[0] })}
                                                        className="inline-flex items-center gap-1 mb-1 px-2 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                    >
                                                        <DollarSign size={10} /> Add Comm.
                                                    </button>
                                                );
                                            })()}

                                            {(!lead.commission_prompt || !lead.commission_prompt.should_prompt) && lead.verification_status !== 'reverted_to_agent' && (
                                                <div className="flex flex-col gap-2 mt-1">
                                                    <LeadDocumentsModal ulid={lead.ulid} />
                                                    <LeadStatusUpdateModal lead={lead} queryKeyToInvalidate={['agent-leads']} />
                                                    <Link
                                                        to={`/agent/leads/${lead.ulid}`}
                                                        className="text-orange-600 hover:text-orange-700 font-extrabold text-[10px] uppercase tracking-widest block text-center mt-1"
                                                    >
                                                        VIEW →
                                                    </Link>
                                                </div>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Inline Commission Entry Row */}
                                    {activeCommissionPrompt?.leadUlid === lead.ulid && activeCommissionPrompt.prompt && (
                                        <tr>
                                            <td colSpan={17} className="p-0 border-b border-orange-200 bg-orange-50/30">
                                                <div className="p-4 md:p-6 lg:px-8 border-l-4 border-orange-400">
                                                    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                                                        {(() => {
                                                            const p = activeCommissionPrompt.prompt;
                                                            const existing = lead.formatted_commissions?.all?.find(c => 
                                                                (c.payee_id === p.payee_id || c.payee_role === p.payee_role)
                                                            );

                                                            return (
                                                                <CommissionInlineEntryForAgent
                                                                    leadUlid={lead.ulid}
                                                                    leadStatus={lead.status}
                                                                    commissionPrompt={p}
                                                                    existingCommission={existing || null}
                                                                    agentName={p.payee_name || lead.submitted_by_enumerator?.name || 'Enumerator'}
                                                                    agentCode={p.payee_code || ''}
                                                                    onSaved={() => {
                                                                        setActiveCommissionPrompt(null);
                                                                        qc.invalidateQueries({ queryKey: ['agent-leads'] });
                                                                    }}
                                                                    onSkip={() => setActiveCommissionPrompt(null)}
                                                                    commissionsApi={agentCommissionsApi}
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading leads...</div>
                    ) : leads.length === 0 ? (
                        <div className="p-8 text-center py-12">
                            <FileText size={40} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-slate-400 text-sm font-medium">No leads found.</p>
                        </div>
                    ) : (
                        leads.map((lead) => (
                            <div 
                                key={lead.id} 
                                className={`p-4 space-y-4 border-l-4 transition-all ${lead.verification_status === 'reverted_to_agent' ? 'bg-red-50/30 border-red-500' : 'hover:bg-slate-50'}`}
                                style={lead.verification_status !== 'reverted_to_agent' ? { borderLeftColor: getLeadStatusColor(lead.status).split(' ')[1]?.replace('text-', '') === 'orange-600' ? '#ea580c' : (getLeadStatusColor(lead.status).includes('emerald') ? '#059669' : (getLeadStatusColor(lead.status).includes('rose') ? '#e11d48' : '#64748b')) } : {}}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Link to={`/agent/leads/${lead.ulid}`} className="font-bold text-slate-800 leading-tight block">
                                            {lead.beneficiary_name}
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Ref: {lead.ulid?.slice(-8)}</p>
                                            {lead.referral_agent_id && (
                                                <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">Referral</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 items-end">
                                        <LeadStatusBadge status={lead.status} />
                                        <VerificationStatusBadge status={lead.verification_status} revertCount={lead.revert_count} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-medium">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><Phone size={10} /> Mobile</p>
                                        <p className="text-xs text-slate-700">{lead.beneficiary_mobile}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 justify-end"><MapPin size={10} /> Location</p>
                                        <p className="text-xs text-slate-700 truncate">{lead.beneficiary_district}, {lead.beneficiary_state}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5"><DollarSign size={10} /> Commission</p>
                                        <p className="text-xs font-black text-orange-600">
                                            {(() => {
                                                const agentComm = lead.formatted_commissions?.all?.find(c => c.payee_role === 'agent');
                                                return agentComm ? `₹${agentComm.amount}` : '—';
                                            })()}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 justify-end"><CheckCircle size={10} /> Pay Status</p>
                                        {(() => {
                                            const agentComm = lead.formatted_commissions?.all?.find(c => c.payee_role === 'agent');
                                            if (!agentComm) return <p className="text-xs text-slate-400 italic">N/A</p>;
                                            return (
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest ${agentComm.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {agentComm.payment_status}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {lead.verification_status === 'reverted_to_agent' && (
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 space-y-2">
                                        <p className="text-[10px] text-red-700 font-bold uppercase flex items-center gap-1.5"><CornerUpLeft size={10} /> Action Required</p>
                                        <p className="text-xs text-red-600 italic">"{lead.revert_reason}"</p>
                                        <Link
                                            to={`/agent/leads/${lead.ulid}/resubmit`}
                                            className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-lg shadow-red-100"
                                        >
                                            Edit & Resubmit Lead
                                        </Link>
                                    </div>
                                )}

                                {lead.verification_status === 'pending_agent_verification' && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setVerifyingLead(lead)} 
                                            className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                                        >
                                            ✅ Verify
                                        </button>
                                        <button 
                                            onClick={() => setRevertingLead(lead)} 
                                            className="flex-1 py-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
                                        >
                                            ↩ Revert
                                        </button>
                                    </div>
                                )}

                                {(() => {
                                    const prompts = lead.commission_status?.prompts || [];
                                    if (prompts.length === 0) return null;

                                    return (
                                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-inner">
                                            <p className="text-[10px] text-orange-700 font-bold uppercase mb-3 flex items-center gap-1.5"><DollarSign size={10} /> Add Commission for Executive</p>
                                            <CommissionInlineEntryForAgent
                                                leadUlid={lead.ulid}
                                                leadStatus={lead.status}
                                                commissionPrompt={prompts[0]}
                                                existingCommission={lead.formatted_commissions?.all?.find(c => c.payee_id === prompts[0].payee_id) || null}
                                                agentName={prompts[0].payee_name || lead.submitted_by_enumerator?.name || 'Enumerator'}
                                                agentCode={prompts[0].payee_code || ''}
                                                onSaved={() => qc.invalidateQueries({ queryKey: ['agent-leads'] })}
                                                onSkip={() => {}}
                                                commissionsApi={agentCommissionsApi}
                                            />
                                        </div>
                                    );
                                })()}

                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <span className="text-[10px] text-slate-400 font-medium">Added on {formatDate(lead.created_at)}</span>
                                    <div className="flex gap-3 items-center">
                                        <LeadDocumentsModal ulid={lead.ulid} />
                                        <LeadStatusUpdateModal lead={lead} queryKeyToInvalidate={['agent-leads']} />
                                        <Link
                                            to={`/agent/leads/${lead.ulid}`}
                                            className="text-[10px] text-orange-600 font-black uppercase tracking-widest flex items-center gap-1"
                                        >
                                            Details <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
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

            {/* Modals */}
            {verifyingLead && (
                <VerifyLeadModal
                    lead={verifyingLead}
                    isOpen={!!verifyingLead}
                    onClose={() => setVerifyingLead(null)}
                    onSuccess={() => qc.invalidateQueries({ queryKey: ['agent-leads'] })}
                />
            )}

            {revertingLead && (
                <RevertLeadModal
                    lead={revertingLead}
                    isOpen={!!revertingLead}
                    onClose={() => setRevertingLead(null)}
                    onSuccess={() => qc.invalidateQueries({ queryKey: ['agent-leads'] })}
                />
            )}
        </div>
    );
}
