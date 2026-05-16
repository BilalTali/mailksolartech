import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/services/offers.api';
import { OfferCard } from '@/components/shared/OfferCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Gift, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { UserOfferProgress, OfferRedemption } from '@/types';

export const AdminMyIncentives: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: offersResp, isLoading: isLoadingOffers } = useQuery({
        queryKey: ['admin-my-offers'],
        queryFn: () => offersApi.admin.getMyOffers()
    });

    const { data: redemptionsResp, isLoading: isLoadingRedemptions } = useQuery({
        queryKey: ['admin-my-redemptions'],
        queryFn: () => offersApi.admin.getMyRedemptions()
    });

    const redeemMutation = useMutation({
        mutationFn: offersApi.admin.redeem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-my-offers'] });
            queryClient.invalidateQueries({ queryKey: ['admin-my-redemptions'] });
            toast.success('Redemption claim submitted successfully!', {
                duration: 5000,
                icon: '🎁'
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to redeem');
        }
    });

    if (isLoadingOffers || isLoadingRedemptions) return <LoadingSpinner />;

    const offers = (offersResp?.data as UserOfferProgress[]) || [];
    const redemptions = (redemptionsResp?.data as OfferRedemption[]) || [];

    const activeOffers = offers.filter(o => !o.offer_ended_zeroed_at);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Standard Offers Section */}
            <div>
                <h2 className="text-xl text-slate-800 font-black flex items-center gap-2 mb-4">
                    <Gift className="text-indigo-600" /> My Eligible Target Offers
                </h2>
                
                {activeOffers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeOffers.map(offer => (
                            <OfferCard
                                key={offer.id}
                                offer={offer}
                                onRedeem={() => redeemMutation.mutate(offer.id)}
                                isRedeeming={redeemMutation.isPending}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                        <Gift className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Offers</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">There are currently no active system offers you are eligible for. Check back later.</p>
                    </div>
                )}
            </div>

            {/* Redemptions History */}
            <div>
                <h2 className="text-xl text-slate-800 font-black flex items-center gap-2 mb-4">
                    <History className="text-indigo-600" /> My Point Redemptions
                </h2>
                
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reward Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Points Consumed</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {redemptions.map((redemption) => (
                                    <tr key={redemption.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900">{format(new Date(redemption.claimed_at), 'dd MMM yyyy')}</p>
                                            <p className="text-xs font-medium text-slate-500">{format(new Date(redemption.claimed_at), 'hh:mm a')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900">{redemption.offer?.title || 'Unknown Offer'}</p>
                                            <p className="text-xs font-medium text-slate-500">{redemption.offer?.prize_label || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-indigo-600">{redemption.points_used}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight
                                                ${redemption.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                                redemption.status === 'approved' ? 'bg-blue-50 text-blue-700' :
                                                redemption.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                                                'bg-amber-50 text-amber-700'}`}>
                                                {redemption.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {redemptions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center">
                                            <p className="text-slate-400 font-bold mb-1">No claims yet</p>
                                            <p className="text-sm text-slate-400 font-medium">When you redeem points for a reward, it will appear here.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
