import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, Save, Info, TrendingUp, IndianRupee, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { slabsApi } from '@/services/slabs.api';
import { CommissionSlab } from '@/types';

export default function SuperAdminCommissionRatesPage() {
    const queryClient = useQueryClient();
    const [localRates, setLocalRates] = useState<Record<number, number>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [savedAnimation, setSavedAnimation] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['super-admin', 'commission-slabs'],
        queryFn: () => slabsApi.superAdmin.getAll(),
    });

    const slabs: CommissionSlab[] = (data as any)?.data || [];

    // Initialise local rates from server data
    useEffect(() => {
        if (slabs.length > 0) {
            const initial: Record<number, number> = {};
            slabs.forEach(s => { initial[s.id] = Number(s.super_admin_rate ?? 0); });
            setLocalRates(initial);
            setIsDirty(false);
        }
    }, [slabs.length]);

    const bulkMutation = useMutation({
        mutationFn: (payload: { id: number; super_admin_rate: number }[]) =>
            slabsApi.superAdmin.bulkUpdate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'commission-slabs'] });
            toast.success('Commission rates saved successfully!');
            setIsDirty(false);
            setSavedAnimation(true);
            setTimeout(() => setSavedAnimation(false), 2000);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to save rates');
        },
    });

    const handleRateChange = (id: number, value: string) => {
        const parsed = parseFloat(value) || 0;
        setLocalRates(prev => ({ ...prev, [id]: parsed }));
        setIsDirty(true);
    };

    const handleSaveAll = () => {
        const payload = Object.entries(localRates).map(([id, rate]) => ({
            id: parseInt(id),
            super_admin_rate: rate,
        }));
        bulkMutation.mutate(payload);
    };

    const handleReset = () => {
        if (slabs.length > 0) {
            const reset: Record<number, number> = {};
            slabs.forEach(s => { reset[s.id] = Number(s.super_admin_rate ?? 0); });
            setLocalRates(reset);
            setIsDirty(false);
        }
    };

    const totalAllocatable = Object.values(localRates).reduce((sum, r) => sum + r, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
                            <Percent className="w-5 h-5 text-white" />
                        </div>
                        Commission Rates per kW
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Set how much you allocate to Admins per lead, based on system capacity.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
                        >
                            <RefreshCw size={14} /> Reset
                        </button>
                    )}
                    <button
                        onClick={handleSaveAll}
                        disabled={!isDirty || bulkMutation.isPending}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            savedAnimation
                                ? 'bg-emerald-500 shadow-emerald-200'
                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-200'
                        }`}
                    >
                        {savedAnimation ? (
                            <><CheckCircle size={16} /> Saved!</>
                        ) : bulkMutation.isPending ? (
                            <><RefreshCw size={16} className="animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={16} /> Save All Rates</>
                        )}
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div className="text-sm text-indigo-700">
                    <p className="font-bold mb-1">How these rates work</p>
                    <p className="text-indigo-600 leading-relaxed">
                        When you open the <strong>"Pass Profit"</strong> modal for a lead, the system auto-fills the
                        commission amount based on the lead's solar capacity and the rate you set here.
                        For example, if 3kW rate is ₹30,000, a 3kW lead will auto-suggest ₹30,000 for Admin allocation.
                        You can always override the suggested amount before saving.
                    </p>
                </div>
            </div>

            {/* Rates Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Rate Table</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Click any rate field to edit</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs font-black text-violet-700 uppercase tracking-widest">
                            {slabs.length} tiers configured
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Label</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-violet-500 uppercase tracking-widest">
                                        Super Admin Rate (₹/Lead)
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Agent Commission</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Super Agent Override</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {slabs.map((slab, idx) => {
                                    const currentRate = localRates[slab.id] ?? 0;
                                    const originalRate = Number(slab.super_admin_rate ?? 0);
                                    const changed = currentRate !== originalRate;
                                    return (
                                        <tr
                                            key={slab.id}
                                            className={`group transition-colors ${changed ? 'bg-violet-50/50' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                                        slab.is_active
                                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm'
                                                            : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-black text-slate-900 uppercase text-sm">{slab.capacity}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-600">{slab.label}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative flex items-center max-w-[200px]">
                                                    <span className="absolute left-3 text-sm font-bold text-violet-500">₹</span>
                                                    <input
                                                        id={`rate-${slab.id}`}
                                                        type="number"
                                                        min={0}
                                                        step={500}
                                                        value={currentRate || ''}
                                                        onChange={e => handleRateChange(slab.id, e.target.value)}
                                                        placeholder="0"
                                                        className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm font-bold text-slate-800 transition-all outline-none focus:ring-4 ${
                                                            changed
                                                                ? 'border-violet-400 bg-white focus:ring-violet-50 focus:border-violet-500'
                                                                : 'border-slate-200 bg-slate-50 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white'
                                                        }`}
                                                    />
                                                    {changed && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500" />
                                                    )}
                                                </div>
                                                {currentRate > 0 && (
                                                    <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">
                                                        = ₹{currentRate.toLocaleString('en-IN')} per lead
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-600">
                                                    ₹{Number(slab.agent_commission).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-600">
                                                    ₹{Number(slab.super_agent_override).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Card */}
            {slabs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-5">
                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-1">Lowest Tier (1kW)</p>
                        <div className="flex items-center gap-1">
                            <IndianRupee className="w-5 h-5 text-violet-700" />
                            <span className="text-2xl font-black text-violet-900">
                                {(localRates[slabs[0]?.id] ?? 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Highest Tier (10kW)</p>
                        <div className="flex items-center gap-1">
                            <IndianRupee className="w-5 h-5 text-amber-700" />
                            <span className="text-2xl font-black text-amber-900">
                                {(localRates[slabs[slabs.length - 1]?.id] ?? 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Sum of All Tiers</p>
                        <div className="flex items-center gap-1">
                            <IndianRupee className="w-5 h-5 text-emerald-700" />
                            <span className="text-2xl font-black text-emerald-900">
                                {totalAllocatable.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsaved Changes Warning */}
            {isDirty && (
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-sm font-bold">You have unsaved changes</span>
                    </div>
                    <button
                        onClick={handleSaveAll}
                        disabled={bulkMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                        <Save size={14} /> Save Now
                    </button>
                </div>
            )}
        </div>
    );
}
