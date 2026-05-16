import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead, LeadDocument } from '@/types';
import { leadsApi } from '@/services/leads.api';
import { FileText, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '@/services/axios';

interface Props {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DOC_LABEL: Record<string, string> = {
    aadhaar: 'Aadhaar Card',
    electricity_bill: 'Electricity Bill',
    photo: 'Beneficiary Photo',
    pan: 'PAN Card',
    solar_roof_photo: 'Solar Roof Photo',
    bank_passbook: 'Bank Passbook',
    other: 'Other Document',
};

export const VerifyLeadModal: React.FC<Props> = ({ lead, isOpen, onClose, onSuccess }) => {
    const [notes, setNotes] = useState('');
    const [showDocs, setShowDocs] = useState(true);
    const [viewingId, setViewingId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => leadsApi.verifyAgentLead(lead.ulid, notes || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-leads'] });
            onSuccess();
            onClose();
        },
    });

    const handleView = async (docId: number) => {
        setViewingId(docId);
        try {
            const { data } = await api.get(`/leads/${lead.ulid}/documents/${docId}/view-url`);
            if (data.url) {
                window.open(data.url, '_blank');
            }
        } catch (error) {
            console.error('Error fetching view URL:', error);
        } finally {
            setViewingId(null);
        }
    };

    const documents: LeadDocument[] = lead.documents ?? [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white flex-shrink-0">
                    <h3 className="text-lg font-semibold">✅ Verify Enumerator Lead</h3>
                    <p className="text-green-200 text-sm mt-0.5">This will send the lead to Super Agent for verification</p>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                        <p className="text-sm font-medium text-gray-700">Beneficiary: <span className="text-gray-900">{lead.beneficiary_name}</span></p>
                        {lead.submitted_by_enumerator && (
                            <p className="text-sm text-gray-500">Submitted by: <span className="text-gray-700">{lead.submitted_by_enumerator.name}</span></p>
                        )}
                        <p className="text-sm text-gray-500">Lead Ref: <span className="text-gray-700 font-mono text-xs">{lead.ulid}</span></p>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => setShowDocs(v => !v)}
                            className="flex items-center justify-between w-full text-left px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                Uploaded Documents
                                {documents.length > 0
                                    ? <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{documents.length}</span>
                                    : <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">None</span>
                                }
                            </span>
                            {showDocs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {showDocs && (
                            <div className="mt-2 space-y-1.5">
                                {documents.length === 0 ? (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        No documents uploaded for this lead. Verify with caution.
                                    </div>
                                ) : (
                                    documents.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => handleView(doc.id)}
                                            disabled={viewingId === doc.id}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-2.5
                                                       bg-white border border-slate-100 rounded-xl shadow-sm
                                                       hover:border-blue-300 hover:bg-blue-50 transition-all group disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {DOC_LABEL[doc.document_type] ?? doc.document_type}
                                                    </p>
                                                    {doc.original_filename && (
                                                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{doc.original_filename}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors text-[11px] font-medium">
                                                {viewingId === doc.id ? (
                                                    <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full mr-1.5" />
                                                ) : (
                                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                )}
                                                {viewingId === doc.id ? 'Loading...' : 'View'}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Any notes about this verification..."
                            rows={3}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                    </div>

                    {mutation.isError && (
                        <p className="text-red-600 text-sm">{(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'An error occurred'}</p>
                    )}
                </div>

                <div className="px-6 pb-6 pt-3 flex gap-3 justify-end border-t border-gray-100 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        {mutation.isPending ? 'Verifying…' : '✅ Verify & Send to Super Agent'}
                    </button>
                </div>
            </div>
        </div>
    );
};
