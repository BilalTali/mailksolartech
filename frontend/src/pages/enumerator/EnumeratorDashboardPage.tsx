import { useQuery } from '@tanstack/react-query';
import { enumeratorApi } from '@/services/enumerator.api';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, FileText, CheckCircle, IndianRupee, TrendingUp, Users, ArrowRight, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import DownloadJoiningLetterButton from '@/components/shared/DownloadJoiningLetterButton';
import { formatCurrency, formatDate } from '@/utils/formatters';
import LeadStatusBadge from '@/components/shared/LeadStatusBadge';
import DashboardSkeleton from '@/components/shared/DashboardSkeleton';

export default function EnumeratorDashboardPage() {
    const { user } = useAuthStore();

    const { data: statsRes, isLoading } = useQuery({
        queryKey: ['enumerator-stats'],
        queryFn: enumeratorApi.getStats,
    });

    if (isLoading) return <DashboardSkeleton />;

    const stats = (statsRes as any)?.data;

    const isDirect = (user as any)?.enumerator_creator_role === 'admin' || (user as any)?.enumerator_creator_role === 'super_agent';
    const earningsLabelSuffix = isDirect ? ' (Direct)' : ' (Private)';

    const cards = [
        { label: 'Total Leads', value: stats?.total_leads ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Leads Installed', value: stats?.leads_installed ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: `Pending Payout${earningsLabelSuffix}`, value: formatCurrency(stats?.pending_commission ?? 0), icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: `Total Earned${earningsLabelSuffix}`, value: formatCurrency(stats?.total_earned ?? 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-2xl text-dark flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-emerald-600" />
                        Dashboard
                    </h1>
                    <p className="text-neutral-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c) => (
                    <div key={c.label} className={`stat-card group border-emerald-500 ${c.color.replace('text-', 'border-')}`}>
                        {/* Decorative Background Pattern */}
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-current opacity-[0.03] rounded-full group-hover:scale-125 transition-transform duration-500" />

                        <div className="relative z-10">
                            <p className="text-xs text-neutral-500 font-medium">{c.label}</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-neutral-200 rounded animate-pulse mt-1" />
                            ) : (
                                <p className="font-display font-bold text-xl text-dark mt-0.5">{c.value}</p>
                            )}
                        </div>
                        <div className={`relative z-10 w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <c.icon className={`w-6 h-6 ${c.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ID Card & Letters section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DownloadIdCardButton variant="card" />
                {user && <DownloadJoiningLetterButton user={user} variant="card" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Leads */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-bold text-lg text-dark">Recent Leads</h2>
                        <Link to="/enumerator/leads" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {stats?.recent_leads?.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-neutral-600 border-b border-gray-100">
                                        <th className="pb-3 font-semibold">Beneficiary</th>
                                        <th className="pb-3 font-semibold">Status</th>
                                        <th className="pb-3 font-semibold text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_leads.map((lead: any, i: number) => (
                                        <tr key={lead.id} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                                            <td className="py-3">
                                                <p className="font-medium text-dark">{lead.beneficiary_name}</p>
                                                <p className="text-neutral-500 text-[10px] font-mono uppercase">{lead.ulid}</p>
                                            </td>
                                            <td className="py-3">
                                                <LeadStatusBadge status={lead.status} />
                                            </td>
                                            <td className="py-3 text-neutral-500 text-right text-xs">
                                                {formatDate(lead.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-neutral-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm italic">No recent leads found.</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions + Earnings Summary */}
                <div className="space-y-6">
                    {/* Earnings Summary */}
                    <div className="card bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                        <h2 className="font-display font-bold text-lg mb-4 text-emerald-400">Earnings Summary</h2>
                        <div className="space-y-4">
                            {[
                                { label: 'This Month (Settled)', value: stats?.this_month_earned ?? 0 },
                                { label: 'Last Month (Settled)', value: stats?.last_month_earned ?? 0 },
                                { label: 'Total Settled Earnings', value: stats?.total_earned ?? 0, highlight: true },
                                { label: 'Pending Payout', value: stats?.pending_commission ?? 0, color: 'text-amber-400' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                                    <span className={`text-xs ${item.color || 'text-slate-400'}`}>{item.label}</span>
                                    <span className={`font-bold font-mono ${item.highlight ? 'text-xl text-white' : 'text-slate-200'}`}>
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {!isDirect && (
                            <Link
                                to="/enumerator/commissions"
                                className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                                View Earning Ledger
                            </Link>
                        )}
                    </div>

                    {/* Quick Action */}
                    <div className="card border-dashed border-2 border-emerald-100 bg-emerald-50/10">
                        <Link
                            to="/enumerator/leads/new"
                            className="flex flex-col items-center justify-center p-4 text-center group"
                        >
                            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-dark mb-1">Submit New Lead</h3>
                            <p className="text-[10px] text-neutral-500">Fast track your earnings by submitting a new lead today.</p>
                        </Link>
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
                    className="flex-1 h-[52px] !bg-emerald-600 !text-white !rounded-xl shadow-md border-none font-bold text-sm"
                />
                {user && (
                    <DownloadJoiningLetterButton
                        user={user}
                        variant="outline"
                        className="flex-1 h-[52px] !border-emerald-600 !text-emerald-700 !bg-transparent hover:!bg-emerald-50 !rounded-xl font-bold text-sm"
                    />
                )}
            </div>
        </div>
    );
}
