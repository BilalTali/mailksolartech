import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalsApi } from '@/services/withdrawals.api';
import { offersApi } from '@/services/offers.api';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Wallet, Plus, Calendar, IndianRupee, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { WithdrawalRequest, UserOfferProgress } from '@/types';

interface WithdrawalFormData {
    offer_id: number;
    points_withdrawn: number;
    payment_method: string;
    payment_details: string;
}

export const EnumeratorWithdrawalsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<WithdrawalFormData>();
    const selectedOfferId = watch('offer_id');

    const { data: withdrawalsResp, isLoading: isLoadingWithdrawals } = useQuery({
        queryKey: ['enumerator-withdrawals'],
        queryFn: () => withdrawalsApi.enumerator.getAll()
    });

    const { data: offersResp, isLoading: isLoadingOffers } = useQuery({
        queryKey: ['enumerator-offers'],
        queryFn: () => offersApi.enumerator.getOffers()
    });

    const createMutation = useMutation({
        mutationFn: withdrawalsApi.enumerator.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enumerator-withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['enumerator-offers'] });
            toast.success('Withdrawal request submitted successfully!');
            setIsModalOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        }
    });

    if (isLoadingWithdrawals || isLoadingOffers) return <LoadingSpinner />;

    const withdrawals = (withdrawalsResp?.data as WithdrawalRequest[]) || [];
    const offers = (offersResp?.data as UserOfferProgress[]) || [];
    
    // Only show offers that have unredeemed points to withdraw
    const eligibleOffers = offers.filter((o: UserOfferProgress) => Number(o.my_unredeemed_points) > 0);
    const selectedOffer = offers.find((o: UserOfferProgress) => String(o.id) === String(selectedOfferId));

    const onSubmit = (data: WithdrawalFormData) => {
        createMutation.mutate({
            ...data,
            offer_id: Number(data.offer_id),
            points_withdrawn: Number(data.points_withdrawn)
        });
    };

    return (
        <div className="p-6">
            <SEOHead title="Withdrawal Requests | Enumerator" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Wallet className="text-indigo-600" />
                        Withdrawal Requests
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Convert your unredeemed offer points into direct cash payments
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition duration-200"
                >
                    <Plus size={18} />
                    Request Withdrawal
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {withdrawals.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Offer</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Points</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Payment Info</th>
                                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {withdrawals.map((w: WithdrawalRequest) => (
                                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                <Calendar size={14} className="text-slate-400" />
                                                {format(new Date(w.created_at), 'dd MMM yyyy')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-900">
                                            {w.offer?.title || 'Unknown Offer'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-slate-900">{w.points_withdrawn}</span>
                                                <span className="text-xs font-bold text-slate-400">PTS</span>
                                            </div>
                                            {w.amount !== null && (
                                                <div className="flex items-center gap-1 mt-1 text-emerald-600 font-bold text-sm">
                                                    <IndianRupee size={12} />
                                                    {Number(w.amount).toLocaleString('en-IN')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-slate-900">{w.payment_method}</div>
                                            <div className="text-xs font-medium text-slate-500 max-w-[200px] truncate" title={w.payment_details || ''}>
                                                {w.payment_details}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                w.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                w.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                {w.status}
                                            </span>
                                            {w.admin_notes && (
                                                <div className="mt-2 flex items-start gap-1 text-[11px] font-medium text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <Info size={12} className="shrink-0 mt-0.5" />
                                                    {w.admin_notes}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 font-medium">
                        <Wallet size={48} className="mx-auto text-slate-200 mb-4" />
                        No withdrawal requests found.
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} aria-hidden="true" />
                    
                    <div className="relative z-50 mx-auto max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl overflow-hidden" role="dialog">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Wallet className="text-indigo-600" />
                                Request Cash Withdrawal
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Select Offer to Withdraw From</label>
                                <select 
                                    {...register('offer_id', { required: 'Please select an offer' })}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                                >
                                    <option value="">-- Choose an Offer --</option>
                                    {eligibleOffers.map((o: UserOfferProgress) => (
                                        <option key={o.id} value={o.id}>
                                            {o.title} - {Number(o.my_unredeemed_points)} PTS available
                                        </option>
                                    ))}
                                </select>
                                {errors.offer_id && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.offer_id.message}</p>}
                            </div>

                            {selectedOffer && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Points to Withdraw</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            step="1"
                                            min="1"
                                            max={Number(selectedOffer.my_unredeemed_points)}
                                            {...register('points_withdrawn', { 
                                                required: 'Required',
                                                min: { value: 1, message: 'Minimum 1 point' },
                                                max: { value: Number(selectedOffer.my_unredeemed_points), message: `Max ${Number(selectedOffer.my_unredeemed_points)} points` }
                                            })}
                                            className="w-32 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                                        />
                                        <span className="text-sm font-bold text-slate-500">
                                            / {Number(selectedOffer.my_unredeemed_points)} Available
                                        </span>
                                    </div>
                                    {errors.points_withdrawn && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.points_withdrawn.message}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                                <select 
                                    {...register('payment_method', { required: 'Please select a payment method' })}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                                >
                                    <option value="">-- Choose Method --</option>
                                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                                    <option value="upi">UPI</option>
                                    <option value="cash">Cash (Office Pickup)</option>
                                </select>
                                {errors.payment_method && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.payment_method.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Details</label>
                                <textarea 
                                    {...register('payment_details', { required: 'Please provide account details or instructions' })}
                                    placeholder="e.g. UPI ID: 9876543210@ybl, or Bank A/C: 123456789 IFSC: SBIN000123"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium h-24 resize-none"
                                />
                                {errors.payment_details && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.payment_details.message}</p>}
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); reset(); }}
                                    className="px-4 py-2 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || !selectedOffer}
                                    className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50"
                                >
                                    {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
