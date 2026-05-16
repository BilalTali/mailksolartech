import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/services/offers.api';
import { OfferCard } from '@/components/shared/OfferCard';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Gift, Award, TrendingUp, History, Info, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { UserOfferProgress, OfferRedemption, SuperAgentAbsorbedPoint } from '@/types';

export const AgentOffersPage: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: offersResp, isLoading } = useQuery({
        queryKey: ['agent-offers'],
        queryFn: () => offersApi.agent.getOffers()
    });

    const { data: redemptionsResp } = useQuery({
        queryKey: ['agent-redemptions'],
        queryFn: () => offersApi.agent.getMyRedemptions()
    });

    const { data: absorbedPointsResp } = useQuery({
        queryKey: ['agent-absorbed-points'],
        queryFn: () => offersApi.agent.getAbsorbedPoints()
    });

    const redeemMutation = useMutation({
        mutationFn: offersApi.agent.redeem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-offers'] });
            queryClient.invalidateQueries({ queryKey: ['agent-redemptions'] });
            toast.success('Redemption claim submitted! Admin will contact you.', {
                duration: 5000,
                icon: '🎁'
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to redeem');
        }
    });

    const claimAbsorbedMutation = useMutation({
        mutationFn: (id: number) => offersApi.agent.claimAbsorbed(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-absorbed-points'] });
            toast.success('Claim submitted to Admin for your absorbed points!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to claim absorbed points');
        }
    });

    if (isLoading) return <LoadingSpinner />;

    const offers = (offersResp?.data as UserOfferProgress[]) || [];
    const redemptions = (redemptionsResp?.data as OfferRedemption[]) || [];
    const absorbedPoints = (absorbedPointsResp?.data as SuperAgentAbsorbedPoint[]) || [];

    return (
        <div className="p-6">
            <SEOHead title="Offers & Incentives | Agent" />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black tracking-widest mb-4 border border-white/10 uppercase">
                            <Award size={14} />
                            Agent Rewards
                        </div>
                        <h1 className="text-3xl font-black mb-2 tracking-tight">Suryamitra Leaderboard Prizes</h1>
                        <p className="text-indigo-100 font-medium leading-relaxed opacity-90">
                            The harder you work, the bigger you win! Track your points and redeem premium prizes.
                            <span className="block mt-1 font-bold">Note: Unclaimed points are absorbed by your Super Agent when an offer period expires.</span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[120px] text-center">
                            <p className="text-[10px] font-black tracking-widest uppercase opacity-60 mb-1">Redeemed</p>
                            <p className="text-2xl font-black">{redemptions.length}</p>
                        </div>
                    </div>
                </div>

                {/* Abstract shapes for premium feel */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Offers Grid */}
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp size={22} className="text-indigo-600" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Milestone Offers</h2>
                    </div>

                    {offers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {offers.map((offer: UserOfferProgress) => (
                                <OfferCard
                                    key={offer.id}
                                    offer={offer}
                                    onRedeem={redeemMutation.mutate as any}
                                    isRedeeming={redeemMutation.isPending}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                            <Gift size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-500 font-bold italic">No active offers at the moment. Keep installing!</p>
                        </div>
                    )}
                </div>

                {/* Sidebar: Redemption History */}
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <History size={22} className="text-indigo-600" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Claims</h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
                        {redemptions.length > 0 ? (
                            redemptions.map((r: OfferRedemption) => (
                                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
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
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            r.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {r.status}
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
                                Earn points to fill your progress bar.
                            </li>
                            <li className="flex gap-2">
                                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-black">2</span>
                                Once the target is hit, the "REDEEM" button activates.
                            </li>
                            <li className="flex gap-2">
                                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-black">3</span>
                                Excess points are carried over to your next prize cycle!
                            </li>
                        </ul>
                    </div>

                    {/* Absorbed Points Section */}
                    {absorbedPoints.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Inbox size={22} className="text-indigo-600" />
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Absorbed from Team</h2>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
                                {absorbedPoints.map((point: any) => (
                                    <div key={point.id} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex flex-col items-center justify-center text-white shadow-sm shrink-0">
                                                    <span className="text-sm font-black leading-none">{point.absorbed_points}</span>
                                                    <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80">Pts</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 leading-tight">
                                                        {point.offer?.title}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-500">
                                                        From: {point.source_agent?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {format(new Date(point.absorbed_at), 'dd MMM yyyy')}
                                            </p>
                                            
                                            {point.status === 'unclaimed' ? (
                                                <button
                                                    onClick={() => claimAbsorbedMutation.mutate(point.id)}
                                                    disabled={claimAbsorbedMutation.isPending && claimAbsorbedMutation.variables === point.id}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-colors flex justify-center items-center"
                                                >
                                                    {claimAbsorbedMutation.isPending && claimAbsorbedMutation.variables === point.id ? 'Claiming...' : 'Claim Points'}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 tracking-wider">
                                                    {point.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
