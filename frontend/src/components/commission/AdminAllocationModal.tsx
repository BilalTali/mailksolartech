import { useState, useEffect } from 'react';
import { adminCommissionsApi } from '../../services/commissions.api';
import toast from 'react-hot-toast';
import { X, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface AdminAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadUlid: string;
    beneficiaryName: string;
    initialAllocation?: {
        lead_revenue?: number;
        commission: number;
        meeting: number;
        expenses: number;
    };
}

export default function AdminAllocationModal({ isOpen, onClose, leadUlid, beneficiaryName, initialAllocation }: AdminAllocationModalProps) {
    const queryClient = useQueryClient();
    const [isPending, setIsPending] = useState(false);
    
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
        }
    }, [isOpen, initialAllocation]);

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
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <div>
                        <h3 className="font-black text-indigo-900">Pass Profit to Admin</h3>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Lead: {beneficiaryName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 mb-4">
                        <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">System Revenue (Lead Revenue) (₹)</label>
                        <p className="text-[9px] text-emerald-500 mb-2 leading-tight">Total revenue originated from this lead (e.g., ₹10,000 per kW).</p>
                        <input 
                            type="number" min="0" 
                            value={allocation.lead_revenue || ''} 
                            onChange={e => setAllocation({...allocation, lead_revenue: parseFloat(e.target.value) || 0})}
                            placeholder="e.g. 50000"
                            className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-slate-700 bg-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Commission Profit (₹)</label>
                        <input 
                            type="number" min="0" 
                            value={allocation.commission || ''} 
                            onChange={e => setAllocation({...allocation, commission: parseFloat(e.target.value) || 0})}
                            placeholder="e.g. 5000"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-700"
                        />
                    </div>
                    <div className="hidden">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meeting Allowance (₹)</label>
                        <input 
                            type="number" min="0" 
                            value={allocation.meeting || ''} 
                            onChange={e => setAllocation({...allocation, meeting: parseFloat(e.target.value) || 0})}
                            placeholder="e.g. 1000"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-700"
                        />
                    </div>
                    <div className="hidden">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Additional Expenses (₹)</label>
                        <input 
                            type="number" min="0" 
                            value={allocation.expenses || ''} 
                            onChange={e => setAllocation({...allocation, expenses: parseFloat(e.target.value) || 0})}
                            placeholder="e.g. 500"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-700"
                        />
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Grant</span>
                            <span className="text-xl font-black text-indigo-700">₹{total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                            <button onClick={handleUpdateAllocation} disabled={isPending || total === 0} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-200">
                                {isPending ? 'Saving...' : <><Check size={16} /> Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
