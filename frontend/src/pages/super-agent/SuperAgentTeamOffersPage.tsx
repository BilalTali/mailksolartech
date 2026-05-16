import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/services/offers.api';
import { Gift, Users, Inbox, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { OfferCard } from '@/components/shared/OfferCard';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { UserOfferProgress, TeamOfferPerformance, SuperAgentAbsorbedPoint } from '@/types';

export const SuperAgentTeamOffersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'my_participation' | 'team_performance' | 'absorbed_points'>('my_participation');

    // 1. My Participation Query
    const { data: myOffersResp, isLoading: isMyLoading } = useQuery({
        queryKey: ['super-agent-my-offers'],
        queryFn: () => offersApi.superAgent.getOffers()
    });

    // 2. Team Performance Query
    const { data: performanceResp, isLoading: isTeamLoading } = useQuery({
        queryKey: ['super-agent-team-performance'],
        queryFn: () => offersApi.superAgent.getTeamPerformance(),
        enabled: activeTab === 'team_performance'
    });

    // 3. Absorbed Points Query
    const { data: absorbedPointsResp, isLoading: isAbsorbedLoading } = useQuery({
        queryKey: ['super-agent-absorbed-points'],
        queryFn: () => offersApi.superAgent.getAbsorbedPoints(),
        enabled: activeTab === 'absorbed_points'
    });

    const myOffers = (myOffersResp?.data as UserOfferProgress[]) ?? [];
    const teamPerformance = (performanceResp?.data as TeamOfferPerformance[]) ?? [];

    // Correction: absorbedPointsResp now returns { absorbed: [], summary: {} }
    const absorbedData = absorbedPointsResp?.data as any;
    const absorbedPoints = (absorbedData?.absorbed as SuperAgentAbsorbedPoint[]) ?? [];
    const summary = absorbedData?.summary;

    const claimMutation = useMutation({
        mutationFn: (id: number) => offersApi.superAgent.claimAbsorbed(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-agent-absorbed-points'] });
            toast.success("Reward claim submitted! Admin has been notified.");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to claim')
    });

    const redeemMutation = useMutation({
        mutationFn: (id: number) => offersApi.superAgent.redeem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-agent-my-offers'] });
            toast.success("Redemption request submitted!");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to redeem')
    });

    const tabs = [
        { id: 'my_participation', label: 'My Participation', icon: Gift },
        { id: 'team_performance', label: 'Team Performance', icon: Users },
        { id: 'absorbed_points', label: 'Absorbed Points', icon: Inbox },
    ];

    const isLoading = isMyLoading || (activeTab === 'team_performance' && isTeamLoading) || (activeTab === 'absorbed_points' && isAbsorbedLoading);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SEOHead title="Team Offers & Incentives" />

            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Incentive Programs</h1>
                <p className="text-slate-500 font-medium tracking-tight">Participate yourself, monitor your team, and claim absorbed points.</p>
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex items-center gap-1 mb-10 p-1.5 bg-slate-100 rounded-2xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const hasBadge = tab.id === 'absorbed_points' && summary?.unclaimed_count > 0;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={clsx(
                                "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black transition-all relative",
                                isActive
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            <Icon size={18} />
                            {tab.label}
                            {hasBadge && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {summary.unclaimed_count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="space-y-8">
                    {activeTab === 'my_participation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myOffers.length > 0 ? (
                                myOffers.map(offer => (
                                    <OfferCard
                                        key={offer.id}
                                        offer={offer}
                                        onRedeem={() => redeemMutation.mutate(offer.id)}
                                        isRedeeming={redeemMutation.isPending}
                                    />
                                ))
                            ) : (
                                <EmptyState title="No participating offers" desc="You aren't participating in any active individual offers." />
                            )}
                        </div>
                    )}

                    {activeTab === 'team_performance' && (
                        <div className="space-y-12">
                            {teamPerformance.length > 0 ? (
                                teamPerformance.map((offer: any) => (
                                    <TeamOfferSection key={offer.offer_id} offer={offer} />
                                ))
                            ) : (
                                <EmptyState title="No active team offers" desc="No incentives are currently live for your agent network." />
                            )}
                        </div>
                    )}

                    {activeTab === 'absorbed_points' && (
                        <div className="space-y-6">
                            {summary && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <SummaryBadge label="Unclaimed Points" value={summary.unclaimed_points} icon={Clock} color="text-amber-600 bg-amber-50" />
                                    <SummaryBadge label="Available Claims" value={summary.unclaimed_count} icon={AlertCircle} color="text-blue-600 bg-blue-50" />
                                    <SummaryBadge label="Total Absorbed" value={summary.total_absorbed_ever} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
                                    <SummaryBadge label="Approved Rewards" value={summary.delivered_count} icon={Gift} color="text-indigo-600 bg-indigo-50" />
                                </div>
                            )}

                            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800">Absorption History</h3>
                                    <p className="text-xs text-slate-500 font-medium italic hidden md:block text-right max-w-xs">
                                        Points are absorbed from ANY expired offer (including Agents-only) when goals aren't met.
                                    </p>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {absorbedPoints.length === 0 ? (
                                        <EmptyState
                                            icon={Inbox}
                                            title="No Absorbed Points"
                                            desc="No agent installations have been absorbed yet. Points from expired team offers will appear here automatically."
                                        />
                                    ) : (
                                        absorbedPoints.map((point: any) => (
                                            <AbsorbedPointCard
                                                key={point.id}
                                                point={point}
                                                onClaim={() => claimMutation.mutate(point.id)}
                                                isClaiming={claimMutation.isPending && (claimMutation.variables as any) === point.id}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---

const SummaryBadge = ({ label, value, icon: Icon, color }: any) => (
    <div className={clsx("p-4 rounded-2xl flex items-center gap-4 border border-current/10 shadow-sm transition-all hover:shadow-md", color)}>
        <div className="p-2 rounded-xl bg-white shadow-inner shrink-0"><Icon size={20} /></div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-70 leading-none mb-1">{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    </div>
);

const TeamOfferSection: React.FC<{ offer: any }> = ({ offer }) => (
    <section className="relative">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                    {offer.prize_image_url ? (
                        <img src={offer.prize_image_url} alt={offer.prize_label} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                        <Gift className="text-indigo-600" size={32} />
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">{offer.offer_title}</h2>
                    <p className="text-indigo-600 font-bold text-sm">Prize: {offer.prize_label}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="px-3 border-r border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Team Points</p>
                    <p className="text-lg font-black text-slate-900 leading-none">{offer.team_totals.total_points}</p>
                </div>
                <div className="px-3 border-r border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Prizes Won</p>
                    <p className="text-lg font-black text-indigo-600 leading-none">{offer.team_totals.redemption_count}</p>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-widest text-[9px] font-black text-slate-400">
                    <tr>
                        <th className="px-6 py-4">Agent</th>
                        <th className="px-6 py-4">Total Points</th>
                        <th className="px-6 py-4">Cycle Progress</th>
                        <th className="px-6 py-4">Redeemable</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {offer.agents.map((agent: any) => (
                        <tr key={agent.agent_id} className="hover:bg-slate-50/30">
                            <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{agent.agent_name}</p>
                                <p className="text-xs text-indigo-600 font-medium">{agent.agent_code}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-900">{agent.total_points}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3 w-32 md:w-48">
                                    <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (agent.cycle_points / offer.target_points) * 100)}%` }} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 shrink-0">{agent.cycle_points}/{offer.target_points}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {agent.can_redeem ? (
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[9px] font-black border border-emerald-200 uppercase">Redeemable</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-400">{agent.cycle_needed} more needed</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </section>
);

const AbsorbedPointCard: React.FC<{ point: any, onClaim: () => void, isClaiming: boolean }> = ({ point, onClaim, isClaiming }) => {
    const isUnclaimed = point.status === 'unclaimed';
    const isAgentsOnly = point.offer?.visible_to === 'agents';

    return (
        <div className="p-6 hover:bg-slate-50 transition-colors group">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex flex-col items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                        <span className="text-xl font-black leading-none">{point.absorbed_points}</span>
                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80">Points</span>
                    </div>
                    <div className="flex flex-col">
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-snug">{point.offer?.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <Users size={12} className="text-slate-400" />
                            <span>From: <strong className="text-slate-700">{point.source_agent?.name}</strong> <span className="text-slate-400 font-mono">({point.source_agent?.agent_id})</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex-grow space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <span className={clsx(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            point.absorption_reason === 'agent_fell_short' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                            {point.absorption_reason?.replace(/_/g, ' ')}
                        </span>
                        {isAgentsOnly && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                <AlertCircle size={12} className="text-slate-400" />
                                Agents-Only Offer
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-lg">
                        {isAgentsOnly
                            ? "Points absorbed because the agent fell short on a challenge not visible to Super Agents."
                            : "Points transferred from your agent's unredeemed progress after offer expiry."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="text-right flex-shrink-0 pr-4 border-r border-slate-100 hidden sm:block">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Absorbed On</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{format(new Date(point.absorbed_at), 'dd MMM yyyy')}</p>
                    </div>

                    <div className="flex-shrink-0 w-full lg:w-44">
                        {isUnclaimed ? (
                            <button
                                onClick={onClaim}
                                disabled={isClaiming}
                                className="w-full bg-indigo-600 hover:ring-2 hover:ring-indigo-600 hover:ring-offset-2 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                {isClaiming ? <div className="animate-spin w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full" /> : <Gift size={16} className="group-hover/btn:scale-110 transition-transform" />}
                                Claim Reward
                            </button>
                        ) : (
                            <div className={clsx(
                                "w-full py-3 rounded-xl text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2",
                                point.status === 'claimed' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                                {point.status === 'claimed' ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                                {point.status}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ title: string, desc: string, icon?: any }> = ({ title, desc, icon: Icon = Gift }) => (
    <div className="col-span-full bg-white p-20 rounded-[40px] border-2 border-dashed border-slate-100 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <Icon size={32} className="text-slate-200" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 font-medium max-w-sm mx-auto">{desc}</p>
    </div>
);
