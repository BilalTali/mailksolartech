import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/services/offers.api';
import { OfferCard } from '@/components/shared/OfferCard';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Gift, Award, TrendingUp, History, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { UserOfferProgress, OfferRedemption } from '@/types';
import { useAuthStore } from '@/store/authStore';

export const EnumeratorOffersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const threshold = user?.offer_point_threshold ?? 10;

    const { data: offersResp, isLoading } = useQuery({
        queryKey: ['enumerator-offers'],
        queryFn: () => offersApi.enumerator.getOffers()
    });

    const { data: redemptionsResp } = useQuery({
        queryKey: ['enumerator-redemptions'],
        queryFn: () => offersApi.enumerator.getMyRedemptions()
    });

    const redeemMutation = useMutation({
        mutationFn: offersApi.enumerator.redeem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enumerator-offers'] });
            queryClient.invalidateQueries({ queryKey: ['enumerator-redemptions'] });
            toast.success('Redemption claim submitted! Admin will contact you.', {
                duration: 5000,
                icon: '🎁'
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to redeem');
        }
    });

    if (isLoading) return <LoadingSpinner />;

    const offers = (offersResp?.data as UserOfferProgress[]) || [];
    const redemptions = (redemptionsResp?.data as OfferRedemption[]) || [];

    return (
        <div className="p-6">
            <SEOHead title="Incentive Offers | Enumerator" />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black tracking-widest mb-4 border border-white/10 uppercase">
                            <Award size={14} />
                            Enumerator Rewards
                        </div>
                        <h1 className="text-3xl font-black mb-2 tracking-tight">Milestone Incentives</h1>
                        <p className="text-emerald-100 font-medium leading-relaxed opacity-90">
                            Earn points for every installation! 
                            <span className="block mt-1 font-bold italic">Note: Your first {threshold} points are absorbed by your creator as onboarding fee. Points for offers start accumulating after that.</span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[120px] text-center">
                            <p className="text-[10px] font-black tracking-widest uppercase opacity-60 mb-1">Redeemed</p>
                            <p className="text-2xl font-black">{redemptions.length}</p>
                        </div>
                    </div>
                </div>

                {/* Abstract shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Offers Grid */}
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp size={22} className="text-emerald-600" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Available Offers</h2>
                    </div>

                    {offers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {offers.map((offer: UserOfferProgress) => (
                                <OfferCard
                                    key={offer.id}
                                    offer={offer}
                                    onRedeem={redeemMutation.mutate as any}
                                    isRedeeming={redeemMutation.isPending}
                                    showEnumeratorTooltip={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                            <Gift size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-500 font-bold italic">Earn more than {threshold} points to unlock these offers. Keep going!</p>
                        </div>
                    )}
                </div>

                {/* Sidebar: Redemption History */}
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <History size={22} className="text-emerald-600" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">My Claims</h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
                        {redemptions.length > 0 ? (
                            redemptions.map((r: OfferRedemption) => (
                                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                                                <Gift size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 leading-tight truncate max-w-[120px]">
                                                    {r.offer?.title}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400">
                                                    #{r.id} • {format(new Date(r.claimed_at), 'dd MMM')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                                            r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            r.status === 'admin_approved' ? 'bg-indigo-100 text-indigo-700' :
                                            r.status === 'approved' ? 'bg-blue-100 text-blue-700' : 
                                            r.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {r.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {r.notes && (
                                        <div className="px-3 py-2 bg-white/60 rounded-xl border border-white text-[10px] text-slate-500 leading-relaxed italic">
                                            <Info size={10} className="inline mr-1" />
                                            {r.notes}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-slate-400 text-sm font-medium italic">No claims yet</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Guide Card */}
                    <div className="mt-6 bg-amber-50 rounded-3xl p-6 border border-amber-100">
                        <h3 className="text-amber-900 font-black text-sm mb-2 flex items-center gap-2">
                            <Info size={16} />
                            HOW IT WORKS?
                        </h3>
                        <ul className="space-y-2 text-xs text-amber-800/80 font-medium">
                            <li className="flex gap-2">
                                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-black">1</span>
                                Your first {threshold} earned points go to your account creator as an onboarding fee.
                            </li>
                            <li className="flex gap-2">
                                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-black">2</span>
                                After that, all points count directly towards these prizes.
                            </li>
                            <li className="flex gap-2">
                                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-black">3</span>
                                Once eligible, hit "REDEEM" to claim!
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EnumeratorOffersPage;
