import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScanLine, Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface Lead {
    id: number;
    ulid: string;
    beneficiary_name: string;
    beneficiary_mobile: string;
    beneficiary_district: string;
    beneficiary_state: string;
    updated_at: string;
    assigned_installer?: { name: string };
}

export default function PodQueuePage() {
    const queryClient = useQueryClient();
    const [rejectModal, setRejectModal] = useState<{ lead: Lead | null; reason: string }>({ lead: null, reason: '' });
    const [confirmPass, setConfirmPass] = useState<Lead | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-pod-queue'],
        queryFn: async () => {
            const res = await api.get<{ data: { data: Lead[] } }>('/admin/queue/pod');
            return res.data.data.data;
        },
    });
    const leads = data ?? [];

    const passMutation = useMutation({
        mutationFn: (ulid: string) => api.post(`/admin/leads/${ulid}/pod/successful`),
        onSuccess: () => {
            toast.success('POD successful — installer commission triggered ✅');
            setConfirmPass(null);
            queryClient.invalidateQueries({ queryKey: ['admin-pod-queue'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ ulid, reason }: { ulid: string; reason: string }) => api.post(`/admin/leads/${ulid}/pod/reject`, { reason }),
        onSuccess: () => {
            toast.success('POD rejected');
            setRejectModal({ lead: null, reason: '' });
            queryClient.invalidateQueries({ queryKey: ['admin-pod-queue'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><ScanLine className="w-5 h-5 text-purple-600" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">POD Queue</h1>
                        <p className="text-sm text-slate-500">Proof of Delivery inspections — Status: POD_INSPECTION_INITIATED</p>
                    </div>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm hover:bg-slate-200 transition"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : leads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-600">Queue is empty</p>
                    <p className="text-sm text-slate-400">No POD inspections pending.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_auto] text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <div>Beneficiary</div><div>Installer · Location</div><div className="text-right">Actions</div>
                    </div>
                    {leads.map((lead) => (
                        <div key={lead.id} className="grid grid-cols-[1fr_1fr_auto] gap-0 items-center px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                            <div>
                                <div className="font-bold text-slate-800">{lead.beneficiary_name}</div>
                                <div className="text-xs text-slate-500 font-mono">{lead.ulid.slice(-10)} · {lead.beneficiary_mobile}</div>
                            </div>
                            <div>
                                {lead.assigned_installer && <div className="text-sm text-slate-600">{lead.assigned_installer.name}</div>}
                                <div className="text-xs text-slate-400">{lead.beneficiary_district}, {lead.beneficiary_state}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button id={`btn-pod-pass-${lead.ulid}`} onClick={() => setConfirmPass(lead)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition">
                                    <CheckCircle className="w-3.5 h-3.5" /> POD Pass
                                </button>
                                <button id={`btn-pod-reject-${lead.ulid}`} onClick={() => setRejectModal({ lead, reason: '' })} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 transition">
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Pass Modal */}
            {confirmPass && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                            <div><h3 className="font-black text-slate-800">Confirm POD Success</h3><p className="text-xs text-slate-500">{confirmPass.beneficiary_name}</p></div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
                            ⚡ This will mark the installation as verified and automatically trigger the installer's commission payment.
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmPass(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
                            <button id="btn-confirm-pod-pass" onClick={() => passMutation.mutate(confirmPass.ulid)} disabled={passMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-50">
                                {passMutation.isPending ? 'Processing...' : 'Confirm POD Pass'}
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
                            <div><h3 className="font-black text-slate-800">Reject POD</h3><p className="text-xs text-slate-500">{rejectModal.lead.beneficiary_name}</p></div>
                        </div>
                        <textarea placeholder="Rejection reason (required)..." rows={3} value={rejectModal.reason} onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                        <div className="flex gap-3">
                            <button onClick={() => setRejectModal({ lead: null, reason: '' })} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
                            <button onClick={() => rejectMutation.mutate({ ulid: rejectModal.lead!.ulid, reason: rejectModal.reason })} disabled={!rejectModal.reason.trim() || rejectMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-50">
                                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
