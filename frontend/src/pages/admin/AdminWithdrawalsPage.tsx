import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalsApi } from '@/services/withdrawals.api';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Wallet, Check, X as XIcon, DollarSign, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { WithdrawalRequest } from '@/types';

export const AdminWithdrawalsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('');
    
    // Modals state
    const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject' | null; id: number | null }>({ type: null, id: null });
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const { data: withdrawalsResp, isLoading } = useQuery({
        queryKey: ['admin-withdrawals', statusFilter],
        queryFn: () => withdrawalsApi.admin.getAll(statusFilter || undefined)
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number, payload: any }) => withdrawalsApi.admin.approve(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
            toast.success('Request approved successfully');
            setActionModal({ type: null, id: null });
            reset();
        },
        onError: () => toast.error('Failed to approve request')
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number, payload: any }) => withdrawalsApi.admin.reject(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
            toast.success('Request rejected and points refunded');
            setActionModal({ type: null, id: null });
            reset();
        },
        onError: () => toast.error('Failed to reject request')
    });

    const markPaidMutation = useMutation({
        mutationFn: withdrawalsApi.admin.markPaid,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
            toast.success('Request marked as paid');
        },
        onError: () => toast.error('Failed to mark as paid')
    });

    if (isLoading) return <LoadingSpinner />;
    const withdrawals = (withdrawalsResp?.data as WithdrawalRequest[]) || [];

    const onApproveSubmit = (data: any) => {
        if (!actionModal.id) return;
        approveMutation.mutate({ id: actionModal.id, payload: data });
    };

    const onRejectSubmit = (data: any) => {
        if (!actionModal.id) return;
        rejectMutation.mutate({ id: actionModal.id, payload: data });
    };

    return (
        <div className="p-6">
            <SEOHead title="Manage Withdrawals | Admin" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Wallet className="text-indigo-600" />
                        Withdrawal Requests
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Review, approve, and process agent/enumerator withdrawal requests
                    </p>
                </div>
                
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 shadow-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved (Unpaid)</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-black text-slate-500 uppercase">Request Details</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase">User</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase">Payment Info</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase">Status & Value</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                                        No requests found for the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map((w: WithdrawalRequest) => (
                                    <tr key={w.id} className="hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 text-sm">{w.offer?.title || 'Unknown'}</div>
                                            <div className="text-xs font-medium text-slate-500">
                                                Requested: <span className="font-bold text-slate-700">{w.points_withdrawn} PTS</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1">
                                                {format(new Date(w.created_at), 'dd MMM yyyy HH:mm')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 text-sm">{w.user?.name}</div>
                                            <div className="text-xs font-medium text-slate-500 capitalize">{w.user?.role?.replace('_', ' ')}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1">
                                                {w.payment_method?.replace('_', ' ')}
                                            </span>
                                            <div className="text-xs font-medium text-slate-600 max-w-[200px]" title={w.payment_details || ''}>
                                                {w.payment_details}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex mb-2 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                w.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                w.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                {w.status}
                                            </span>
                                            {w.amount !== null && (
                                                <div className="text-sm font-black text-emerald-600">
                                                    ₹{Number(w.amount).toLocaleString('en-IN')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {w.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => { reset(); setActionModal({ type: 'approve', id: w.id }); }}
                                                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} strokeWidth={3} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { reset(); setActionModal({ type: 'reject', id: w.id }); }}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                                                        title="Reject"
                                                    >
                                                        <XIcon size={18} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            )}
                                            {w.status === 'approved' && (
                                                <button 
                                                    onClick={() => {
                                                        if(confirm(`Mark withdrawal #${w.id} as PAID?`)) {
                                                            markPaidMutation.mutate(w.id);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition"
                                                    disabled={markPaidMutation.isPending}
                                                >
                                                    {markPaidMutation.isPending ? 'Processing...' : 'Mark Paid'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modals - implemented using native HTML/Tailwind over headlessUI */}
            {actionModal.type === 'approve' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActionModal({ type: null, id: null })} />
                    <div className="relative z-50 bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                            <Check className="text-emerald-500" /> Approve Request
                        </h3>
                        <form onSubmit={handleSubmit(onApproveSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Approved Amount (₹)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign size={16} className="text-slate-400" />
                                    </div>
                                    <input 
                                        type="number" step="0.01" min="0"
                                        {...register('amount', { required: 'Amount required' })}
                                        className="w-full pl-9 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.amount && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.amount.message as string}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Admin Notes (Optional)</label>
                                <textarea 
                                    {...register('admin_notes')}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white h-24 resize-none text-sm"
                                    placeholder="e.g. Approved by regional auditor"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setActionModal({ type: null, id: null })} className="px-4 py-2 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                                <button type="submit" disabled={approveMutation.isPending} className="px-6 py-2 font-bold text-white bg-emerald-600 shadow-lg shadow-emerald-200 rounded-xl hover:bg-emerald-700 disabled:opacity-50">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {actionModal.type === 'reject' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActionModal({ type: null, id: null })} />
                    <div className="relative z-50 bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-black text-rose-600 mb-4 flex items-center gap-2">
                            <XIcon className="text-rose-500" /> Reject Request
                        </h3>
                        <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-100 mb-4 flex gap-2">
                            <Info size={14} className="shrink-0 mt-0.5"/>
                            <span>Points will be refunded back to the user's unredeemed balance automatically.</span>
                        </div>
                        <form onSubmit={handleSubmit(onRejectSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Rejection Reason</label>
                                <textarea 
                                    {...register('admin_notes', { required: 'Please provide a reason' })}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white h-24 resize-none text-sm"
                                    placeholder="e.g. Invalid bank details provided"
                                />
                                {errors.admin_notes && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.admin_notes.message as string}</p>}
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setActionModal({ type: null, id: null })} className="px-4 py-2 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                                <button type="submit" disabled={rejectMutation.isPending} className="px-6 py-2 font-bold text-white bg-rose-600 shadow-lg shadow-rose-200 rounded-xl hover:bg-rose-700 disabled:opacity-50">Reject & Refund</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawalsPage;
