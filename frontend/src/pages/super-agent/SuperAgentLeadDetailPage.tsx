// @ts-nocheck
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, User, Phone, MapPin, Hash, Building2, FileText,
    Calendar, AlertCircle, FileDigit, Download, Image as ImageIcon,
    Camera, Mail, Shield, BadgeCheck, Save
} from 'lucide-react';
import { superAgentApi } from '@/services/superAgent.api';
import { superAgentCommissionsApi } from '@/services/commissions.api';
import { openAuthenticatedFile } from '@/utils/documentUtils';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { Lead, CommissionPrompt } from '@/types';
import CommissionInlineEntryForAgent from '@/components/super-agent/CommissionInlineEntryForAgent';
import { STATE_DISTRICTS, INDIAN_STATES } from '@/constants/locationData';
import ChangePasswordForm from '@/components/shared/ChangePasswordForm';

const STATUS_BADGE: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-purple-100 text-purple-700',
    documents_collected: 'bg-indigo-100 text-indigo-700',
    registered: 'bg-cyan-100 text-cyan-700',
    site_survey: 'bg-teal-100 text-teal-700',
    survey_done: 'bg-emerald-100 text-emerald-700',
    installation_scheduled: 'bg-amber-100 text-amber-700',
    material_verified_by_consumer: 'bg-indigo-100 text-indigo-700',
    installation_in_progress: 'bg-orange-100 text-orange-700',
    solar_installed: 'bg-green-100 text-green-700',
    subsidy_applied: 'bg-lime-100 text-lime-700',
    completed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
};



function label(status: string) { return status.replace(/_/g, ' '); }
function fmt(iso: string) { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

export function SuperAgentLeadDetailPage() {
    const { ulid } = useParams<{ ulid: string }>();
    const qc = useQueryClient();

    // Status update states


    const { data, isLoading } = useQuery({
        queryKey: ['sa-lead-detail', ulid],
        queryFn: () => superAgentApi.getLeadDetail(ulid!),
        enabled: !!ulid,
    });

    // team agents for assignment
    const { data: teamData } = useQuery({
        queryKey: ['sa-my-team'],
        queryFn: () => superAgentApi.getMyTeam({ per_page: 200 }),
    });

    const lead: Lead | undefined = data?.data;
    const teamAgents = (teamData?.data?.data ?? []) as any[];

    const [activeCommissionPrompt, setActiveCommissionPrompt] = useState<CommissionPrompt | null>(null);
    const [assignAgentId, setAssignAgentId] = useState<number | string>('');



    const assignMut = useMutation({
        mutationFn: ({ ulid, agent_id }: { ulid: string; agent_id: number }) =>
            superAgentApi.assignLead(ulid, agent_id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-lead-detail', ulid] });
            qc.invalidateQueries({ queryKey: ['sa-leads'] });
            toast.success('Lead assigned to agent');
            setAssignAgentId('');
        },
        onError: () => toast.error('Failed to assign lead.'),
    });

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading lead details...</div>;
    }

    if (!lead) {
        return <div className="p-8 text-center text-red-500">Lead not found.</div>;
    }

    // Initialize status dropdown if not set


    const docs = lead.documents || [];
    const getDoc = (type: string) => docs.find(d => d.document_type === type);

    const docTypes = [
        { key: 'aadhaar', label: 'Aadhaar Card' },
        { key: 'electricity_bill', label: 'Electricity Bill' },
        { key: 'other', label: 'PAN Card' },
        { key: 'photo', label: 'Beneficiary Photo' },
        { key: 'solar_roof_photo', label: 'Solar Roof Photo' },
        { key: 'bank_passbook', label: 'Bank Passbook' }
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/super-agent/leads" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            {lead.beneficiary_name}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                {label(lead.status)}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5 font-mono">{lead.ulid}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {(() => {
                    const currentPrompt = activeCommissionPrompt || lead.commission_prompt;
                    return (
                        <>

                {/* ── Left Column: Details ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Beneficiary Info */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Beneficiary Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex gap-3">
                                <User size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">Full Name</p>
                                    <p className="font-medium text-slate-800">{lead.beneficiary_name}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Phone size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">Mobile Number</p>
                                    <p className="font-medium text-slate-800">{lead.beneficiary_mobile}</p>
                                </div>
                            </div>
                            {lead.beneficiary_email && (
                                <div className="flex gap-3 sm:col-span-2">
                                    <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-600">Email Address</p>
                                        <p className="font-medium text-slate-800">{lead.beneficiary_email}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 sm:col-span-2">
                                <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">Full Address</p>
                                    <p className="font-medium text-slate-800 uppercase">
                                        {[lead.beneficiary_address, lead.beneficiary_district, lead.beneficiary_state, lead.beneficiary_pincode].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Info */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Technical & System Requirements</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex gap-3">
                                <Building2 size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">DISCOM</p>
                                    <p className="font-medium text-slate-800">{lead.discom_name || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Hash size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">Consumer Number</p>
                                    <p className="font-medium text-slate-800">{lead.consumer_number || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <FileDigit size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">Monthly Bill (₹)</p>
                                    <p className="font-medium text-slate-800">{lead.monthly_bill_amount ? `₹${lead.monthly_bill_amount}` : '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">Category</p>
                                    <p className="font-medium text-slate-800">{lead.category || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-600">Roof Size</p>
                                    <p className="font-medium text-slate-800 capitalize">{lead.roof_size?.replace(/_/g, ' ') || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 sm:col-span-2">
                                <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-slate-800 capitalize">
                                        {lead.system_capacity?.replace(/_/g, ' ') || '—'}
                                    </p>
                                </div>
                            </div>
                            {lead.installation_scheduled_at && (
                                <div className="flex gap-3 sm:col-span-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <Calendar size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Scheduled Installation Date</p>
                                        <p className="font-black text-amber-900 text-sm">
                                            {new Date(lead.installation_scheduled_at).toLocaleDateString('en-IN', { 
                                                weekday: 'long', 
                                                day: '2-digit', 
                                                month: 'long', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Query Message */}
                    {lead.query_message && (
                        <div className="bg-orange-50 rounded-xl border border-orange-100 p-6">
                            <h2 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-2">Query / Message</h2>
                            <p className="text-sm text-orange-900 leading-relaxed bg-white/50 p-4 rounded-lg border border-orange-200/50">
                                {lead.query_message}
                            </p>
                        </div>
                    )}

                    {/* Documents */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <FileText size={16} /> Attached Documents
                        </h2>
                        {docs.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No documents uploaded for this lead.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {docTypes.map(dtype => {
                                    const doc = getDoc(dtype.key);
                                    if (!doc) return null;

                                    return (
                                        <div key={dtype.key} className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                                <ImageIcon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-800">{dtype.label}</p>
                                            </div>
                                            <button
                                                onClick={() => openAuthenticatedFile(doc.download_url, doc.original_filename)}
                                                className="mt-1 text-xs px-3 py-1 bg-white border border-slate-200 rounded shadow-sm hover:border-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                            >
                                                <Download size={12} /> View
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>

                {/* ── Right Column: Actions & Log ── */}
                <div className="space-y-6">

                    {/* Status Update Card / Commission Entry */}
                    {(currentPrompt && currentPrompt.should_prompt) ? (
                        <div className="bg-orange-50 rounded-xl border border-orange-200 shadow-sm p-0 mb-6 overflow-hidden">
                            <CommissionInlineEntryForAgent
                                leadUlid={lead.ulid}
                                leadStatus={lead.status}
                                commissionPrompt={currentPrompt}
                                existingCommission={currentPrompt.payee_role === 'enumerator' ? (lead.formatted_commissions?.enumerator_commission || null) : (lead.formatted_commissions?.agent_commission || null)}
                                agentName={currentPrompt.payee_name || lead.assigned_agent?.name || 'Business Development Executive'}
                                agentCode={currentPrompt.payee_code || lead.assigned_agent?.agent_id || ''}
                                onSaved={() => {
                                    setActiveCommissionPrompt(null);
                                    qc.invalidateQueries({ queryKey: ['sa-lead-detail', ulid] });
                                }}
                                onSkip={() => setActiveCommissionPrompt(null)}
                                commissionsApi={superAgentCommissionsApi}
                            />
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Shield size={16} className="text-orange-600" /> Pipeline Status
                            </h2>
                            <div className="flex flex-col gap-3">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Current Stage</p>
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold capitalize ${STATUS_BADGE[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {label(lead.status)}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic leading-snug">
                                    Note: Only administrators can progress a lead through the pipeline.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Business Development Executive Information & Assignment */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Business Development Executive Assignment</h2>

                        {lead.submitted_by_agent && (
                            <div className="mb-4">
                                <p className="text-xs text-slate-600">Submitted By</p>
                                <p className="font-medium text-slate-800 text-sm">{lead.submitted_by_agent.name}</p>
                                <p className="text-xs text-slate-600">{lead.submitted_by_agent.mobile}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-600 mb-1">Assigned To</p>
                                {lead.assigned_agent ? (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="font-medium text-slate-800 text-sm">{lead.assigned_agent.name}</p>
                                        <p className="text-xs text-slate-600">{lead.assigned_agent.mobile}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Business Development Executive ID: {lead.assigned_agent.agent_id || 'N/A'}</p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100 border-dashed">
                                        <p className="text-sm text-orange-600/70 italic">Not yet assigned to an agent</p>
                                    </div>
                                )}
                            </div>

                            {/* Re-assignment or initial assignment */}
                            <div className="pt-2 border-t border-slate-50">
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    {lead.assigned_agent ? 'Change Assignment' : 'Assign to Team Member'}
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={assignAgentId}
                                        onChange={e => setAssignAgentId(e.target.value)}
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Select agent...</option>
                                        {teamAgents.map(a => (
                                            <option key={a.id} value={a.id}>{a.name} ({a.agent_id || 'no id'})</option>
                                        ))}
                                    </select>
                                    <button
                                        disabled={!assignAgentId || assignMut.isPending}
                                        onClick={() => assignMut.mutate({ ulid: lead.ulid, agent_id: Number(assignAgentId) })}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-40 transition-colors"
                                    >
                                        {assignMut.isPending ? '...' : lead.assigned_agent ? 'Reassign' : 'Assign'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    {(lead.status_logs?.length ?? 0) > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Status History</h2>
                            <ol className="relative border-l border-slate-200 space-y-5 ml-2">
                                {lead.status_logs!.map(log => (
                                    <li key={log.id} className="ml-4">
                                        <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${STATUS_BADGE[log.to_status] ?? 'bg-slate-100 text-slate-600'}`}>
                                                    {label(log.to_status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                <Calendar size={12} />
                                                <span>{fmt(log.created_at)}</span>
                                            </div>
                                            {log.notes && (
                                                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded mt-1 border border-slate-100"> "{log.notes}"</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
}

