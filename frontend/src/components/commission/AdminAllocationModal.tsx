import { useState, useEffect } from 'react';
import { adminCommissionsApi } from '../../services/commissions.api';
import { slabsApi } from '../../services/slabs.api';
import toast from 'react-hot-toast';
import { X, Check, Zap, IndianRupee } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface AdminAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadUlid: string;
    beneficiaryName: string;
    systemCapacity?: string | null;
    initialAllocation?: {
        lead_revenue?: number;
        commission: number;
        meeting: number;
        expenses: number;
    };
}

export default function AdminAllocationModal({
    isOpen, onClose, leadUlid, beneficiaryName, systemCapacity, initialAllocation
}: AdminAllocationModalProps) {
    const queryClient = useQueryClient();
    const [isPending, setIsPending] = useState(false);
    const [suggestedRate, setSuggestedRate] = useState<number | null>(null);
    const [isFetchingRate, setIsFetchingRate] = useState(false);

    const [allocation, setAllocation] = useState({
        lead_revenue: initialAllocation?.lead_revenue || 0,
        commission: initialAllocation?.commission || 0,
        meeting: initialAllocation?.meeting || 0,
        expenses: initialAllocation?.expenses || 0
    });

    // Reset allocation when modal opens/closes with new props
    useEffect(() => {
        if (isOpen) {
            setAllocation({
                lead_revenue: initialAllocation?.lead_revenue || 0,
                commission: initialAllocation?.commission || 0,
                meeting: initialAllocation?.meeting || 0,
                expenses: initialAllocation?.expenses || 0
            });
            setSuggestedRate(null);
        }
    }, [isOpen, initialAllocation]);

    // Auto-fetch the suggested rate from the rate table when modal opens
    useEffect(() => {
        if (isOpen && systemCapacity) {
            setIsFetchingRate(true);
            slabsApi.superAdmin.getRateForCapacity(systemCapacity)
                .then(res => {
                    if (res.data.found && res.data.super_admin_rate > 0) {
                        setSuggestedRate(res.data.super_admin_rate);
                    }
                })
                .catch(() => { /* silently ignore */ })
                .finally(() => setIsFetchingRate(false));
        }
    }, [isOpen, systemCapacity]);

    const applyAutoSuggest = () => {
        if (suggestedRate !== null) {
            setAllocation(prev => ({
                ...prev,
                commission: suggestedRate,
                lead_revenue: prev.lead_revenue || suggestedRate,
            }));
        }
    };

    if (!isOpen) return null;

    const handleUpdateAllocation = async () => {
        setIsPending(true);
        try {
            await adminCommissionsApi.updateAdminAllocation(leadUlid, {
                lead_revenue: allocation.lead_revenue,
                admin_received_commission: allocation.commission,
                admin_meeting_allowance: allocation.meeting,
                admin_additional_expenses: allocation.expenses
            });
            toast.success('Admin profit allocation saved successfully!');
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'monitor-leads'] });
            queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update allocation');
        } finally {
            setIsPending(false);
        }
    };

    const total = allocation.commission + allocation.meeting + allocation.expenses;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div>
                        <h3 className="font-black text-indigo-900">Pass Profit to Admin</h3>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
                            Lead: {beneficiaryName}
                            {systemCapacity && (
                                <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                                    {systemCapacity.toUpperCase()}
                                </span>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                        <X size={16} />
                    </button>
                </div>

                {/* Auto-suggest banner */}
                {(suggestedRate !== null || isFetchingRate) && (
                    <div className="mx-6 mt-4 flex items-center justify-between p-3 bg-violet-50 border border-violet-100 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-violet-500 shrink-0" />
                            <div>
                                <p className="text-xs font-black text-violet-800">
                                    {isFetchingRate
                                        ? 'Fetching configured rate...'
                                        : `Configured rate: ₹${suggestedRate?.toLocaleString('en-IN')} for ${systemCapacity?.toUpperCase()}`}
                                </p>
                                {!isFetchingRate && (
                                    <p className="text-[10px] text-violet-500">From your Commission Rates settings</p>
                                )}
                            </div>
                        </div>
                        {!isFetchingRate && suggestedRate !== null && (
                            <button
                                onClick={applyAutoSuggest}
                                className="shrink-0 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                            >
                                Apply
                            </button>
                        )}
                    </div>
                )}

                <div className="p-6 space-y-4">
                    {/* System Revenue */}
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                        <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">
                            System Revenue (Total Lead Revenue) (₹)
                        </label>
                        <p className="text-[9px] text-emerald-500 mb-2 leading-tight">
                            Total revenue you received from this lead installation.
                        </p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-500">₹</span>
                            <input
                                type="number" min="0"
                                value={allocation.lead_revenue || ''}
                                onChange={e => setAllocation({...allocation, lead_revenue: parseFloat(e.target.value) || 0})}
                                placeholder="e.g. 50000"
                                className="w-full pl-7 px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-slate-700 bg-white"
                            />
                        </div>
                    </div>

                    {/* Commission to Admin */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Commission to Admin (₹)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">₹</span>
                            <input
                                type="number" min="0"
                                value={allocation.commission || ''}
                                onChange={e => setAllocation({...allocation, commission: parseFloat(e.target.value) || 0})}
                                placeholder="e.g. 10000"
                                className="w-full pl-7 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Hidden fields kept for API compatibility */}
                    <input type="hidden" value={allocation.meeting} readOnly />
                    <input type="hidden" value={allocation.expenses} readOnly />

                    {/* Total */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Grant to Admin</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <IndianRupee className="w-5 h-5 text-indigo-700" />
                                <span className="text-2xl font-black text-indigo-700">{total.toLocaleString('en-IN')}</span>
                            </div>
                            {allocation.lead_revenue > 0 && total > 0 && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Your net: ₹{(allocation.lead_revenue - total).toLocaleString('en-IN')}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateAllocation}
                                disabled={isPending || total === 0}
                                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-200"
                            >
                                {isPending ? 'Saving...' : <><Check size={16} /> Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
