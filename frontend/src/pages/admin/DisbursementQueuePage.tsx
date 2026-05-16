import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface Lead {
    id: number;
    ulid: string;
    beneficiary_name: string;
    beneficiary_mobile: string;
    beneficiary_district: string;
    beneficiary_state: string;
    status: string;
    updated_at: string;
    assigned_agent?: { name: string };
    created_by_super_agent?: { name: string };
}

interface VerifyModalState {
    lead: Lead | null;
    ref: string;
    notes: string;
}

interface RejectModalState {
    lead: Lead | null;
    reason: string;
}

export default function DisbursementQueuePage() {
    const queryClient = useQueryClient();
    const [verifyModal, setVerifyModal] = useState<VerifyModalState>({ lead: null, ref: '', notes: '' });
    const [rejectModal, setRejectModal] = useState<RejectModalState>({ lead: null, reason: '' });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-disbursement-queue'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { data: Lead[] } }>('/admin/queue/disbursement');
            return res.data.data;
        },
    });
    const leads = data?.data ?? [];

    const verifyMutation = useMutation({
        mutationFn: async ({ ulid, disbursement_reference, notes }: { ulid: string; disbursement_reference: string; notes: string }) =>
            api.post(`/admin/leads/${ulid}/disbursement/verify`, { disbursement_reference, notes }),
        onSuccess: () => {
            toast.success('Disbursement verified — commissions triggered ✅');
            setVerifyModal({ lead: null, ref: '', notes: '' });
            queryClient.invalidateQueries({ queryKey: ['admin-disbursement-queue'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Verification failed'),
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ ulid, reason }: { ulid: string; reason: string }) =>
            api.post(`/admin/leads/${ulid}/disbursement/reject`, { reason }),
        onSuccess: () => {
            toast.success('Disbursement rejected');
            setRejectModal({ lead: null, reason: '' });
            queryClient.invalidateQueries({ queryKey: ['admin-disbursement-queue'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Rejection failed'),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Disbursement Queue</h1>
                        <p className="text-sm text-slate-500">Bank-submitted leads awaiting disbursement verification — Status: SIGNATURE_DONE</p>
                    </div>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
            ) : leads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-600">Queue is empty</p>
                    <p className="text-sm text-slate-400">No leads pending disbursement verification.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <div>Beneficiary</div><div>Agent / BDM</div><div>Location · Waiting Since</div><div className="text-right">Actions</div>
                    </div>
                    {leads.map((lead) => (
                        <div key={lead.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 items-center px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                            <div>
                                <div className="font-bold text-slate-800">{lead.beneficiary_name}</div>
                                <div className="text-xs text-slate-500 font-mono">{lead.ulid.slice(-10)} · {lead.beneficiary_mobile}</div>
                            </div>
                            <div>
                                {lead.assigned_agent && (
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600"><User className="w-3.5 h-3.5 text-slate-400" /> {lead.assigned_agent.name}</div>
                                )}
                                {lead.created_by_super_agent && (
                                    <div className="text-xs text-slate-400 mt-0.5">BDM: {lead.created_by_super_agent.name}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm text-slate-600">{lead.beneficiary_district}, {lead.beneficiary_state}</div>
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400"><Calendar className="w-3 h-3" /> {new Date(lead.updated_at).toLocaleDateString('en-IN')}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    id={`btn-verify-disbursement-${lead.ulid}`}
                                    onClick={() => setVerifyModal({ lead, ref: '', notes: '' })}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" /> Verify
                                </button>
                                <button
                                    id={`btn-reject-disbursement-${lead.ulid}`}
                                    onClick={() => setRejectModal({ lead, reason: '' })}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 transition"
                                >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Verify Modal */}
            {verifyModal.lead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Banknote className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800">Verify Disbursement</h3>
                                <p className="text-xs text-slate-500">{verifyModal.lead.beneficiary_name}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Bank/MNRE Reference Number <span className="text-red-500">*</span></label>
                            <input
                                id="input-disbursement-ref"
                                type="text"
                                placeholder="Enter disbursement reference..."
                                value={verifyModal.ref}
                                onChange={(e) => setVerifyModal((p) => ({ ...p, ref: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Notes (optional)</label>
                            <textarea
                                placeholder="Internal notes..."
                                rows={2}
                                value={verifyModal.notes}
                                onChange={(e) => setVerifyModal((p) => ({ ...p, notes: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                            />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
                            ⚡ This action will automatically trigger hierarchy commission payments to Agent, Enumerator, and Super Agent.
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setVerifyModal({ lead: null, ref: '', notes: '' })} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition">Cancel</button>
                            <button
                                id="btn-confirm-verify-disbursement"
                                onClick={() => verifyMutation.mutate({ ulid: verifyModal.lead!.ulid, disbursement_reference: verifyModal.ref, notes: verifyModal.notes })}
                                disabled={!verifyModal.ref.trim() || verifyMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {verifyMutation.isPending ? 'Verifying...' : 'Confirm & Trigger Commissions'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.lead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                            <div><h3 className="font-black text-slate-800">Reject Disbursement</h3><p className="text-xs text-slate-500">{rejectModal.lead.beneficiary_name}</p></div>
                        </div>
                        <textarea placeholder="Rejection reason (required)..." rows={3} value={rejectModal.reason} onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                        <div className="flex gap-3">
                            <button onClick={() => setRejectModal({ lead: null, reason: '' })} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition">Cancel</button>
                            <button onClick={() => rejectMutation.mutate({ ulid: rejectModal.lead!.ulid, reason: rejectModal.reason })} disabled={!rejectModal.reason.trim() || rejectMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition disabled:opacity-50">
                                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
