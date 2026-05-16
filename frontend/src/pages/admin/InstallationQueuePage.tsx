import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface InstallationDoc {
    id: number;
    document_key: string;
    model_make?: string;
    serial_number?: string;
    file_path: string;
    mime_type: string;
}

interface Lead {
    id: number;
    ulid: string;
    beneficiary_name: string;
    beneficiary_district: string;
    beneficiary_state: string;
    assigned_installer?: { name: string };
    installation_submissions?: { installation_documents?: InstallationDoc[] }[];
}

const DOC_LABELS: Record<string, string> = {
    geo_material: 'Material at Site', geo_panel_serial: 'Panel S/No',
    geo_erected_la: 'Erected LA', geo_earthing: 'Earthing',
    geo_inverter_serial: 'Inverter S/No', agreement_consumer: 'Consumer Agreement',
    loan_statement: 'Loan Statement', geo_consumer_inverter: 'Consumer + Inverter',
};

export default function InstallationQueuePage() {
    const queryClient = useQueryClient();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [rejectModal, setRejectModal] = useState<{ lead: Lead | null; reason: string }>({ lead: null, reason: '' });
    const storageBase = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-installation-queue'],
        queryFn: async () => {
            const res = await api.get<{ data: { data: Lead[] } }>('/admin/queue/installation');
            return res.data.data.data;
        },
    });
    const leads = data ?? [];

    const verifyMutation = useMutation({
        mutationFn: (ulid: string) => api.post(`/admin/leads/${ulid}/installation/verify`),
        onSuccess: () => { toast.success('Installation verified ✅'); setSelectedLead(null); queryClient.invalidateQueries({ queryKey: ['admin-installation-queue'] }); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ ulid, reason }: { ulid: string; reason: string }) => api.post(`/admin/leads/${ulid}/installation/reject`, { reason }),
        onSuccess: () => { toast.success('Rejected — installer notified'); setRejectModal({ lead: null, reason: '' }); setSelectedLead(null); queryClient.invalidateQueries({ queryKey: ['admin-installation-queue'] }); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
    });

    const docs = selectedLead?.installation_submissions?.[0]?.installation_documents ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Wrench className="w-5 h-5 text-orange-600" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Installation Queue</h1>
                        <p className="text-sm text-slate-500">Review 8-document installer submissions</p>
                    </div>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm hover:bg-slate-200 transition"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : leads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-600">Queue is empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.ulid.slice(-10)}</div>
                                <div className="font-bold text-slate-800">{lead.beneficiary_name}</div>
                                <div className="text-xs text-slate-500">{lead.beneficiary_district}, {lead.beneficiary_state}</div>
                                {lead.assigned_installer && <div className="text-xs text-slate-400 mt-1">Installer: {lead.assigned_installer.name}</div>}
                            </div>
                            <div className="p-4 flex gap-2 bg-slate-50">
                                <button id={`btn-review-install-${lead.ulid}`} onClick={() => setSelectedLead(lead)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition">
                                    <Eye className="w-3.5 h-3.5" /> Review Docs
                                </button>
                                <button id={`btn-reject-install-${lead.ulid}`} onClick={() => setRejectModal({ lead, reason: '' })} className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 transition">
                                    <XCircle className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Side Drawer */}
            {selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-start justify-end bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl h-full overflow-y-auto flex flex-col shadow-2xl">
                        <div className="sticky top-0 z-10 p-5 border-b border-slate-200 bg-white flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-slate-800">Installation Review</h3>
                                <p className="text-xs text-slate-500">{selectedLead.beneficiary_name} · {selectedLead.ulid.slice(-10)}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4 text-slate-600" /></button>
                        </div>
                        <div className="p-5 flex-1">
                            {docs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">No documents found.</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {docs.map((doc) => {
                                        const isPdf = doc.mime_type === 'application/pdf';
                                        const url = `${storageBase}/storage/${doc.file_path}`;
                                        return (
                                            <div key={doc.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                {isPdf ? (
                                                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-28 text-blue-600 hover:bg-blue-50 transition gap-2">
                                                        <Eye className="w-6 h-6" />
                                                        <span className="text-[10px] font-bold">View PDF</span>
                                                    </a>
                                                ) : (
                                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                                        <img src={url} alt={doc.document_key} className="w-full h-28 object-cover hover:opacity-90 transition" />
                                                    </a>
                                                )}
                                                <div className="p-2 border-t border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-700">{DOC_LABELS[doc.document_key] || doc.document_key}</div>
                                                    {doc.model_make && <div className="text-[10px] text-slate-500">Make: {doc.model_make}</div>}
                                                    {doc.serial_number && <div className="text-[10px] text-slate-400 font-mono">S/N: {doc.serial_number}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="sticky bottom-0 p-5 border-t border-slate-200 bg-white flex gap-3">
                            <button id="btn-reject-install-drawer" onClick={() => setRejectModal({ lead: selectedLead, reason: '' })} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition">
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                            <button id="btn-verify-install-drawer" onClick={() => verifyMutation.mutate(selectedLead.ulid)} disabled={verifyMutation.isPending} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
                                {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><CheckCircle className="w-4 h-4" /> Verify Installation</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.lead && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                            <div><h3 className="font-black text-slate-800">Reject Installation</h3><p className="text-xs text-slate-500">{rejectModal.lead.beneficiary_name}</p></div>
                        </div>
                        <textarea placeholder="Rejection reason (installer will be notified)..." rows={3} value={rejectModal.reason} onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                        <div className="flex gap-3">
                            <button onClick={() => setRejectModal({ lead: null, reason: '' })} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
                            <button onClick={() => rejectMutation.mutate({ ulid: rejectModal.lead!.ulid, reason: rejectModal.reason })} disabled={!rejectModal.reason.trim() || rejectMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-50">
                                {rejectMutation.isPending ? 'Rejecting...' : 'Reject & Notify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
