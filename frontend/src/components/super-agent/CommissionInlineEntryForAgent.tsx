import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CommissionPrompt, Commission } from '@/types';
import { Lock, Edit2, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    leadUlid: string;
    commissionPrompt?: CommissionPrompt;
    existingCommission: Commission | null;
    agentName: string;
    agentCode: string;
    onSaved: (commission: Commission) => void;
    onSkip?: () => void;
    leadStatus?: string;
    commissionsApi: {
        updateCommission: (id: number, payload: any) => Promise<any>;
        enterEnumeratorCommission: (leadUlid: string, payload: any) => Promise<any>;
        enterAgentCommission?: (leadUlid: string, payload: any) => Promise<any>;
    };
}

export default function CommissionInlineEntryForAgent({
    leadUlid,
    commissionPrompt,
    existingCommission,
    agentName,
    agentCode,
    onSaved,
    onSkip,
    leadStatus,
    commissionsApi
}: Props) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(!existingCommission);
    const [amount, setAmount] = useState<string>(
        existingCommission?.amount?.toString() || 
        commissionPrompt?.suggested_amount?.toString() || 
        ''
    );
    const [error, setError] = useState<string | null>(null);

    const saveMutation = useMutation({
        mutationFn: async (val: string) => {
            const payload = { amount: parseFloat(val) };
            if (existingCommission) {
                const res = await commissionsApi.updateCommission(existingCommission.id, payload);
                return res.data.data;
            } else {
                const payee_role = commissionPrompt?.payee_role;
                const apiCall = (payee_role === 'enumerator' || !commissionsApi.enterAgentCommission)
                    ? commissionsApi.enterEnumeratorCommission 
                    : commissionsApi.enterAgentCommission;
                const res = await apiCall(leadUlid, payload);
                return (res.data.data as any).commission as Commission;
            }
        },
        onSuccess: (data) => {
            const label = commissionPrompt?.payee_role === 'enumerator' ? 'Enumerator' : 'Business Development Executive';
            toast.success(`${label} commission saved successfully`);
            setIsEditing(false);
            onSaved(data);
            queryClient.invalidateQueries({ queryKey: ['super-agent-leads'] });
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to save commission. Please try again.');
        }
    });

    const handleSave = () => {
        setError(null);
        if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
            setError('Please enter a valid amount (0 or greater).');
            return;
        }
        if (Number(amount) > 9999999) {
            setError('Amount must be less than 10,000,000.');
            return;
        }
        saveMutation.mutate(amount);
    };

    const handleCancel = () => {
        if (!existingCommission && onSkip) {
            onSkip();
        } else {
            setIsEditing(false);
            setAmount(existingCommission?.amount?.toString() || '');
            setError(null);
        }
    };

    const getRoleLabel = (role?: string) => {
        if (role === 'super_agent') return 'Business Development Manager';
        if (role === 'agent') return 'Business Development Executive';
        if (role === 'enumerator') return 'Enumerator';
        return 'Business Development Executive';
    };

    return (
        <div className="bg-[#F0F9FF] border-l-4 border-sky-500 p-4 m-2 rounded-r-lg shadow-sm w-full mx-auto max-w-4xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💰</span>
                <h4 className="font-semibold text-sky-900">
                    {commissionPrompt?.payee_type_label || getRoleLabel(commissionPrompt?.payee_role)} Commission
                </h4>
                <div className="text-sm text-sky-800 bg-sky-100 px-2 py-0.5 rounded ml-2">
                    <span className="font-medium">{agentName}</span> ({agentCode})
                </div>
            </div>

            {isEditing ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="pl-8 pr-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-48 shadow-sm transition-all"
                            disabled={saveMutation.isPending}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-70"
                        >
                            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {existingCommission ? 'Update Commission' : 'Save Commission'}
                        </button>

                        <button
                            onClick={handleCancel}
                            disabled={saveMutation.isPending}
                            className="text-slate-500 hover:text-slate-700 hover:bg-sky-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            {existingCommission ? 'Cancel' : 'Skip for now'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold font-mono text-slate-800">
                        ₹{(existingCommission?.amount != null) 
                            ? Number(existingCommission.amount).toLocaleString('en-IN', { 
                                minimumFractionDigits: Number(existingCommission.amount) % 1 === 0 ? 0 : 2 
                              })
                            : '0'}
                    </div>

                    {existingCommission?.is_locked ? (
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <Lock className="w-3.5 h-3.5" />
                            Locked (entered &gt;24h ago)
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {['LEAD_COMPLETED', 'REGISTERED', 'SITE_SURVEY', 'AT_BANK', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_DISBURSED'].includes(leadStatus || '') ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-100 p-1.5 rounded transition-colors"
                                        title="Edit Commission (within 24h)"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-green-600 font-medium">Editable window open</span>
                                </>
                            ) : (
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200">
                                    <Lock className="w-3.5 h-3.5" />
                                    Read only (lead not completed)
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {existingCommission && !isEditing && (
                <p className="text-xs text-slate-400 mt-2">
                    Payment status: <span className="font-medium text-slate-500 uppercase">{existingCommission.payment_status}</span>
                </p>
            )}
        </div>
    );
}
