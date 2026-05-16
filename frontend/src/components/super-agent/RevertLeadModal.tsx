import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead } from '@/types';
import { leadsApi } from '@/services/leads.api';

interface Props {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RevertLeadModal: React.FC<Props> = ({ lead, isOpen, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const queryClient = useQueryClient();
    const nextRevertCount = lead.revert_count + 1;
    const isLastRevert = nextRevertCount >= 3;

    const mutation = useMutation({
        mutationFn: () => leadsApi.revertSALead(lead.ulid, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sa-leads'] });
            onSuccess();
            onClose();
            setReason('');
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white">
                    <h3 className="text-lg font-semibold">↩ Revert Lead to Agent</h3>
                    <p className="text-red-100 text-sm mt-0.5">Agent will be asked to correct and resubmit</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                        <p className="text-sm font-medium text-gray-700">Beneficiary: <span className="text-gray-900">{lead.beneficiary_name}</span></p>
                        {lead.submitted_by_agent && (
                            <p className="text-sm text-gray-500">Agent: <span className="text-gray-700">{lead.submitted_by_agent.name} ({lead.submitted_by_agent.agent_id})</span></p>
                        )}
                        <p className="text-sm text-gray-500">
                            Revert count after this action: <span className={`font-bold ${isLastRevert ? 'text-red-600' : 'text-amber-600'}`}>{nextRevertCount}/3</span>
                        </p>
                    </div>

                    {isLastRevert && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <span className="text-red-500 mt-0.5 text-lg">⚠</span>
                            <p className="text-red-700 text-sm font-medium">
                                This is the 3rd revert. The lead will be <strong>automatically escalated to Admin</strong> after this action — the agent will not be given another chance to correct it.
                            </p>
                        </div>
                    )}

                    {!isLastRevert && nextRevertCount === 2 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <span className="text-amber-500">⚠</span>
                            <p className="text-amber-700 text-sm">One more revert after this will auto-escalate the lead to Admin.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Reason for returning <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g. Missing consumer number, wrong Aadhaar number, blurry electricity bill..."
                            rows={4}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimum 10 characters. This will be shown to the agent.</p>
                    </div>
                    {mutation.isError && (
                        <p className="text-red-600 text-sm">{(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'An error occurred'}</p>
                    )}
                </div>
                <div className="px-6 pb-6 flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={reason.trim().length < 10 || mutation.isPending}
                        className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors"
                    >
                        {mutation.isPending ? 'Reverting…' : '↩ Revert to Agent'}
                    </button>
                </div>
            </div>
        </div>
    );
};
