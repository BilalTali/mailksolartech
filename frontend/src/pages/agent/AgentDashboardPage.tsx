import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/axios';
import type { AgentDashboardStats } from '@/types';
import DashboardSkeleton from '@/components/shared/DashboardSkeleton';
import LeadStatusBadge from '@/components/shared/LeadStatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { TrendingUp, Users, IndianRupee, CheckCircle2, PlusCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import DownloadJoiningLetterButton from '@/components/shared/DownloadJoiningLetterButton';
import { RevertedLeadBanner } from '@/components/agent/RevertedLeadBanner';
import { leadsApi } from '@/services/leads.api';
import QrCodePreview from '@/components/shared/QrCodePreview';
import QrScanHistory from '@/components/shared/QrScanHistory';
import { QrCode } from 'lucide-react';
import { OffersDashboardSection } from '@/components/offers/OffersDashboardSection';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ReferralShareWidget } from '@/components/shared/ReferralShareWidget';
import BankingStatusModule from '@/components/dashboard/BankingStatusModule';

export default function AgentDashboardPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const handleRedeem = async (offerId: number) => {
        try {
            await api.post(`/agent/offers/${offerId}/redeem`);
            toast.success('🏆 Redemption claimed! Admin will process your prize.');
            queryClient.invalidateQueries({ queryKey: ['agent-offers'] });
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Could not redeem at this time.');
        }
    };

    const { data, isLoading } = useQuery({
        queryKey: ['agent-dashboard'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: AgentDashboardStats }>('/agent/dashboard/stats');
            return res.data.data;
        },
    });

    const { data: revertedData } = useQuery({
        queryKey: ['agent-reverted-count'],
        queryFn: () => leadsApi.getAgentLeads({ verification_status: 'reverted_to_agent', per_page: 1 }),
        refetchInterval: 30_000,
    });
    const revertedCount: number = (revertedData?.data as any)?.total ?? 0;

    if (isLoading) return <DashboardSkeleton />;

    const stats = [
        { icon: <Users className="w-6 h-6" />, label: 'Total Leads Submitted', value: data?.total_leads ?? 0, color: 'border-primary text-primary' },
        { icon: <CheckCircle2 className="w-6 h-6" />, label: 'Leads Installed', value: data?.leads_installed ?? 0, color: 'border-success text-success' },
        { icon: <IndianRupee className="w-6 h-6" />, label: 'Pending Commission', value: formatCurrency(data?.pending_commission ?? 0), color: 'border-warning text-warning' },
        { icon: <TrendingUp className="w-6 h-6" />, label: 'Total Earned', value: formatCurrency(data?.total_earned ?? 0), color: 'border-accent text-accent' },
    ];

    return (
        <div className="pb-24 md:pb-0">
            {/* Reverted Leads Banner */}
            {revertedCount > 0 && (
                <div className="mb-5">
                    <RevertedLeadBanner count={revertedCount} onActionClick={() => { }} />
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="font-display font-bold text-2xl text-dark">Welcome back, {user?.name}! 👋</h1>
                <p className="text-neutral-600 text-sm mt-1">Here's your performance at a glance</p>
            </div>

            {/* ID Card & Letters section */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
                <DownloadIdCardButton variant="card" />
                {user && <DownloadJoiningLetterButton user={user} variant="card" />}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                    <div key={stat.label} className={`stat-card group ${stat.color}`}>
                        {/* Decorative Background Pattern */}
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-current opacity-[0.03] rounded-full group-hover:scale-125 transition-transform duration-500" />
                        
                        <div className="relative z-10">
                            <p className="text-xs text-neutral-600 font-medium mb-1">{stat.label}</p>
                            <p className="font-display font-bold text-2xl text-dark">{stat.value}</p>
                        </div>
                        <div className={`relative z-10 p-2 rounded-xl bg-current/10 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            <BankingStatusModule />

            {/* Offers Section */}
            <OffersDashboardSection role="agent" onRedeem={handleRedeem} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Leads */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-bold text-lg text-dark">Recent Leads</h2>
                        <Link to="/agent/leads" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {data?.recent_leads?.length ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-neutral-600 border-b border-gray-100">
                                            <th className="pb-3 font-semibold">Beneficiary</th>
                                            <th className="pb-3 font-semibold">District</th>
                                            <th className="pb-3 font-semibold">Status</th>
                                            <th className="pb-3 font-semibold">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recent_leads.map((lead, i) => (
                                            <tr key={lead.id} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-neutral-50' : ''}`}>
                                                <td className="py-3">
                                                    <Link to={`/agent/leads/${lead.ulid}`} className="font-medium text-dark hover:text-primary">
                                                        {lead.beneficiary_name}
                                                    </Link>
                                                    <p className="text-neutral-600 text-xs">{lead.beneficiary_mobile}</p>
                                                </td>
                                                <td className="py-3 text-neutral-600">{lead.beneficiary_district}</td>
                                                <td className="py-3"><LeadStatusBadge status={lead.status} /></td>
                                                <td className="py-3 text-neutral-600 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="lg:hidden divide-y divide-gray-100">
                                {data.recent_leads.map((lead) => (
                                    <div key={lead.id} className="py-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-0.5">
                                                <Link to={`/agent/leads/${lead.ulid}`} className="font-bold text-dark hover:text-primary transition-colors">
                                                    {lead.beneficiary_name}
                                                </Link>
                                                <p className="text-xs text-neutral-500">{lead.beneficiary_mobile}</p>
                                            </div>
                                            <LeadStatusBadge status={lead.status} />
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-neutral-500">{lead.beneficiary_district}</span>
                                            <span className="text-neutral-400">{formatDate(lead.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-neutral-600">
                            <p className="text-sm">No leads yet. Submit your first lead!</p>
                            <Link to="/agent/leads/new" className="btn-accent text-sm mt-3 inline-block px-5 py-2">Submit First Lead</Link>
                        </div>
                    )}
                </div>

                {/* Quick Actions + Earnings */}
                <div className="flex flex-col gap-6">
                    {/* Quick Actions */}
                    <div className="card">
                        <h2 className="font-display font-bold text-lg text-dark mb-3">Quick Actions</h2>
                        <Link to="/agent/leads/new" className="btn-accent w-full text-center flex items-center justify-center gap-2 py-3 mb-2">
                            <PlusCircle className="w-4 h-4" /> Submit New Lead
                        </Link>
                        <Link to="/agent/leads" className="btn-ghost w-full text-center py-2 text-sm">
                            View All My Leads
                        </Link>
                    </div>

                    {/* Earnings Summary */}
                    <div className="card">
                        <h2 className="font-display font-bold text-lg text-dark mb-4">Earnings Summary</h2>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: 'This Month', value: data?.this_month_earned ?? 0 },
                                { label: 'Last Month', value: data?.last_month_earned ?? 0 },
                                { label: 'Total Lifetime', value: data?.total_earned ?? 0 },
                                { label: 'Pending Payout', value: data?.pending_commission ?? 0 },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-600">{item.label}</span>
                                    <span className="font-semibold text-dark font-mono">{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Referral Share Widget */}
                    <ReferralShareWidget referralCode={user?.agent_id || ''} role="agent" />

                    {/* QR Verification Widget */}
                    <div className="card space-y-4">
                        <h2 className="font-display font-bold text-lg text-dark flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            My Verification QR
                        </h2>
                        {user && <QrCodePreview user={user} />}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {user && <QrScanHistory userId={user.id} role="agent" isSelfView={true} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 flex gap-3 px-4 md:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200"
                style={{
                    paddingTop: '12px',
                    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                }}
            >
                <DownloadIdCardButton
                    variant="button"
                    className="flex-1 h-[52px] !bg-sky-500 !text-white !rounded-xl shadow-md border-none font-bold text-sm hover:!bg-sky-600 transition-colors"
                />
                {user && (
                    <DownloadJoiningLetterButton
                        user={user}
                        variant="outline"
                        className="flex-1 h-[52px] !border-sky-500 !text-sky-600 !bg-transparent hover:!bg-sky-50 !rounded-xl font-bold text-sm transition-colors"
                    />
                )}
            </div>
        </div>
    );
}
