import { useQuery } from '@tanstack/react-query';
import {
    Users, UserCheck, FileText, Zap, Clock, IndianRupee,
    TrendingUp, TrendingDown, ArrowRight, AlertCircle, QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { superAgentApi } from '@/services/superAgent.api';
import { leadsApi } from '@/services/leads.api';
import { useAuthStore } from '@/store/authStore';
import type { SuperAgentDashboardStats } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { superAgentCommissionsApi } from '@/services/commissions.api';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import DownloadJoiningLetterButton from '@/components/shared/DownloadJoiningLetterButton';
import QrCodePreview from '@/components/shared/QrCodePreview';
import QrScanHistory from '@/components/shared/QrScanHistory';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { OffersDashboardSection } from '@/components/offers/OffersDashboardSection';
import { ReferralShareWidget } from '@/components/shared/ReferralShareWidget';
import DashboardSkeleton from '@/components/shared/DashboardSkeleton';
import BankingStatusModule from '@/components/dashboard/BankingStatusModule';

function StatCard({
    label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
    return (
        <div className={`stat-card group ${color}`}>
            {/* Decorative Background Pattern */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-current opacity-[0.03] rounded-full group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
            <div className="relative z-10 p-2 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform duration-300">
                <Icon size={20} className="text-slate-500" />
            </div>
        </div>
    );
}

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    installed: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
};

export default function SuperAgentDashboardPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const handleRedeem = async (offerId: number) => {
        try {
            await api.post(`/super-agent/offers/${offerId}/redeem`);
            toast.success('🏆 Redemption claimed!');
            queryClient.invalidateQueries({ queryKey: ['sa-offers'] });
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Could not redeem.');
        }
    };

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['sa-dashboard-stats'],
        queryFn: () => superAgentApi.getDashboardStats(),
        refetchInterval: 60_000,
    });

    const stats: SuperAgentDashboardStats | undefined = statsData?.data;

    const { data: leadsData } = useQuery({
        queryKey: ['sa-recent-leads'],
        queryFn: () => superAgentApi.getLeads({ per_page: 8 }),
    });

    const { data: teamData } = useQuery({
        queryKey: ['sa-team-preview'],
        queryFn: () => superAgentApi.getMyTeam({ per_page: 5 }),
    });

    const { data: commSummaryData } = useQuery({
        queryKey: ['sa-comm-summary'],
        queryFn: () => superAgentCommissionsApi.getSummary(),
    });

    const recentLeads = leadsData?.data?.data ?? [];
    const teamAgents = teamData?.data?.data ?? [];
    const commSummary = commSummaryData?.data?.data;

    // Pending verification count (from SA leads meta)
    const { data: pendingVerifData } = useQuery({
        queryKey: ['sa-pending-verification-count'],
        queryFn: () => leadsApi.getSALeads({ verification_status: 'pending_super_agent_verification', per_page: 1 }),
        refetchInterval: 30_000,
    });
    const pendingVerifCount: number = (pendingVerifData?.data as any)?.total ?? 0;

    if (isLoading) return <DashboardSkeleton />;

    const leadsThisMonthTrend = stats
        ? stats.trends.leads_this_month - stats.trends.leads_last_month
        : 0;

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-800 to-orange-700 rounded-2xl px-6 py-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold">Welcome, {user?.name}! 👋</h1>
                        <p className="text-slate-300 mt-0.5 text-sm">
                            Managing {stats?.team.total_agents ?? 0} agents
                            {user?.managed_states?.length
                                ? ` across ${user.managed_states.slice(0, 2).join(', ')}`
                                : ''}
                        </p>
                    </div>
                    <span className="px-3 py-1.5 bg-white/20 rounded-lg font-mono text-sm font-semibold tracking-wide">
                        {user?.super_agent_code}
                    </span>
                </div>
            </div>

            {/* Referral Share Widget */}
            <ReferralShareWidget referralCode={user?.super_agent_code || ''} role="super_agent" />

            {/* NEEDS ACTION BANNER — Verification Pending */}
            {pendingVerifCount > 0 && (
                <div className="bg-amber-50 border-amber-300 border rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <AlertCircle size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900">⏳ {pendingVerifCount} Lead{pendingVerifCount > 1 ? 's' : ''} Awaiting Your Verification</h3>
                            <p className="text-sm text-amber-800 mt-0.5">Review and verify {pendingVerifCount > 1 ? 'these agent submissions' : 'this agent submission'} before they reach Admin.</p>
                        </div>
                    </div>
                    <Link
                        to="/super-agent/leads?tab=needs_verification"
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
                    >
                        Verify Now →
                    </Link>
                </div>
            )}

            {/* NEEDS ACTION BANNER — Commission */}
            {commSummary && commSummary.agent_payouts_unpaid_count > 0 && (
                <div className="bg-orange-50 border-orange-200 border rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <span className="text-xl block leading-none">⚠️</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-orange-900">Action Required: Business Development Executive Commissions</h3>
                            <p className="text-sm text-orange-800 mt-0.5">
                                You have <strong>{commSummary.agent_payouts_unpaid_count}</strong> agent commission{commSummary.agent_payouts_unpaid_count > 1 ? 's' : ''} to pay out.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/super-agent/commissions?tab=payouts"
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
                    >
                        Review Payouts
                    </Link>
                </div>
            )}

            {/* ID Card & Letters section */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
                <DownloadIdCardButton variant="card" />
                {user && <DownloadJoiningLetterButton user={user} variant="card" />}
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="Needs Verification"
                    value={pendingVerifCount}
                    icon={Clock}
                    color={pendingVerifCount > 0 ? 'border-amber-500 bg-amber-50/30' : 'border-slate-200'}
                    sub={pendingVerifCount > 0 ? 'Action required' : 'All caught up'}
                />
                <StatCard
                    label="Team Agents"
                    value={stats?.team.total_agents ?? 0}
                    icon={Users}
                    color="border-blue-500"
                />
                <StatCard
                    label="Active Agents"
                    value={stats?.team.active_agents ?? 0}
                    icon={UserCheck}
                    color="border-green-500"
                />
                <StatCard
                    label="Total Team Leads"
                    value={stats?.leads.total ?? 0}
                    icon={FileText}
                    color="border-indigo-500"
                />
                <StatCard
                    label="Installs This Month"
                    value={stats?.trends.installs_this_month ?? 0}
                    icon={Zap}
                    color="border-teal-500"
                    sub={`Last month: ${stats?.trends.installs_last_month ?? 0}`}
                />
                <StatCard
                    label="Override Pending"
                    value={formatCurrency(stats?.commissions.override_pending ?? 0)}
                    icon={Clock}
                    color="border-amber-500"
                />
                <StatCard
                    label="Override Earned Total"
                    value={formatCurrency(
                        (stats?.commissions.override_paid ?? 0)
                    )}
                    icon={IndianRupee}
                    color="border-emerald-500"
                />
            </div>

            <BankingStatusModule />

            {/* Offers Section */}
            <OffersDashboardSection role="super_agent" onRedeem={handleRedeem} />

            {/* Monthly Lead Trend */}
            {stats && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Leads This Month</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.trends.leads_this_month}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-semibold ${leadsThisMonthTrend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {leadsThisMonthTrend >= 0
                                ? <TrendingUp size={16} />
                                : <TrendingDown size={16} />}
                            {Math.abs(leadsThisMonthTrend)} vs last month
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Preview */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="font-semibold text-slate-700">My Team (Top 5)</h2>
                        <Link to="/super-agent/team" className="text-xs text-orange-600 font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {teamAgents.length === 0 ? (
                            <p className="px-5 py-8 text-center text-slate-400 text-sm">No agents assigned to your team yet.</p>
                        ) : (
                            teamAgents.map((agent) => (
                                <div key={agent.id} className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{agent.name}</p>
                                        <p className="text-xs text-slate-400">{agent.agent_id} · {agent.district}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {agent.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="font-semibold text-slate-700">Recent Leads</h2>
                        <Link to="/super-agent/leads" className="text-xs text-orange-600 font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentLeads.length === 0 ? (
                            <p className="px-5 py-8 text-center text-slate-400 text-sm">No leads from your team yet.</p>
                        ) : (
                            recentLeads.map((lead) => (
                                <div key={lead.id} className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{lead.beneficiary_name}</p>
                                        <p className="text-xs text-slate-400">{lead.ulid} · {lead.beneficiary_district}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {lead.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* QR Verification Widget */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-orange-500" />
                        My Verification QR
                    </h2>
                    {user && <QrCodePreview user={user} />}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        {user && <QrScanHistory userId={user.id} role="super_agent" isSelfView={true} />}
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 flex gap-3 px-4 md:hidden"
                style={{
                    background: '#04111F',
                    borderTop: '2px solid #FF9500',
                    paddingTop: '12px',
                    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                }}
            >
                <DownloadIdCardButton
                    variant="button"
                    className="flex-1 h-[52px] !bg-[#FF9500] !text-[#04111F] !rounded-xl !shadow-none border-none font-bold text-sm"
                />
                {user && (
                    <DownloadJoiningLetterButton
                        user={user}
                        variant="outline"
                        className="flex-1 h-[52px] !border-[#FF9500] !text-white !bg-transparent !rounded-xl font-bold text-sm"
                    />
                )}
            </div>
        </div>
    );
}
