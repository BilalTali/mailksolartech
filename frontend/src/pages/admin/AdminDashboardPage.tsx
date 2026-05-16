import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/axios';
import type { AdminDashboardStats } from '@/types';
import DashboardSkeleton from '@/components/shared/DashboardSkeleton';
import LeadStatusBadge from '@/components/shared/LeadStatusBadge';
import { formatCurrency, formatDate, STATUS_LABELS } from '@/utils/formatters';
import { ArrowRight, Users, TrendingUp, CheckCircle2, Clock, IndianRupee } from 'lucide-react';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import DownloadJoiningLetterButton from '@/components/shared/DownloadJoiningLetterButton';
import { useAuthStore } from '@/store/authStore';
import BankingStatusModule from '@/components/dashboard/BankingStatusModule';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const PIPELINE_COLORS: Record<string, string> = {
    new: '#94A3B8',
    registered: '#818CF8',
    site_survey: '#60A5FA',
    at_bank: '#A78BFA',
    installed: '#34D399',
    completed: '#4ADE80',
    rejected: '#F87171',
    on_hold: '#FCD34D',
};

export default function AdminDashboardPage() {
    const { user, role } = useAuthStore();
    
    if (role === 'operator') {
        return <Navigate to="/admin/leads" replace />;
    }

    const { data, isLoading } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: AdminDashboardStats }>('/admin/dashboard/stats');
            return res.data.data;
        },
    });

    if (isLoading) return <DashboardSkeleton />;

    const kpis = data?.kpis;
    const stats = [
        { icon: <TrendingUp className="w-6 h-6" />, label: 'Total Leads', value: kpis?.total_leads ?? 0, color: 'border-primary text-primary', sub: `${kpis?.new_leads_today ?? 0} today` },
        { icon: <CheckCircle2 className="w-6 h-6" />, label: 'Installations', value: kpis?.total_installations ?? 0, color: 'border-success text-success', sub: `${kpis?.installations_this_month ?? 0} this month` },
        { icon: <Users className="w-6 h-6" />, label: 'Active Business Development Executives', value: kpis?.active_agents ?? 0, color: 'border-accent text-accent', sub: `${kpis?.pending_agents ?? 0} pending` },
        { icon: <IndianRupee className="w-6 h-6" />, label: 'Net Profit', value: formatCurrency(kpis?.admin_net_profit ?? 0), color: 'border-emerald-500 text-emerald-500', sub: 'Earnings after expenses' },
        { icon: <IndianRupee className="w-6 h-6" />, label: 'Total Commission Paid', value: formatCurrency(kpis?.total_commission_paid ?? 0), color: 'border-warning text-warning', sub: `${formatCurrency(kpis?.pending_commission ?? 0)} pending` },
    ];

    // Pipeline chart data
    const pipelineData = data?.pipeline
        ? Object.entries(data.pipeline)
            .filter(([, count]) => Number(count) > 0)
            .map(([status, count]) => ({
                status: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status.replace(/_/g, ' '),
                rawStatus: status.toLowerCase(),
                count: Number(count),
            }))
        : [];

    // Trend data formatting
    const trendData = data?.trends?.map(t => ({
        ...t,
        formattedDate: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    })) || [];

    // District data formatting
    const districtData = data?.district_distribution?.map(d => ({
        name: d.beneficiary_district,
        value: d.total
    })) || [];

    return (
        <div className="pb-24">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-display font-black text-3xl text-slate-800 tracking-tight">Enterprise Overview</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Real-time performance monitoring & scale analytics</p>
                </div>
                <div className="hidden md:flex gap-3">
                    <DownloadIdCardButton />
                    {user && <DownloadJoiningLetterButton user={user} variant="button" />}
                    {role === 'super_admin' && (
                        <Link to="/admin/offers" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95">Manage Offers</Link>
                    )}
                    <Link to="/admin/leads" className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95">View All Leads</Link>
                </div>
            </div>

            <BankingStatusModule />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className={`stat-card group relative overflow-hidden bg-white p-6 rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all duration-300 ${stat.color}`}>
                        <div className="relative z-10 flex flex-col gap-1">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                            <div className="flex items-center gap-3">
                                <p className="font-display font-black text-3xl text-slate-800 tracking-tight">{stat.value}</p>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black tracking-tight">{stat.sub}</span>
                            </div>
                        </div>
                        <div className={`absolute top-6 right-6 p-2 rounded-xl bg-current/5 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Growth Trends */}
                <div className="xl:col-span-2 card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Weekly Growth Trends</h2>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><span className="w-2 h-2 rounded-full bg-primary" /> Leads</div>
                        </div>
                    </div>
                    <div className="h-[280px] min-w-0">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF9500" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#FF9500" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff', fontSize: '12px', color: '#1E293B', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#FF9500" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#FF9500' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-medium">Insufficient data for trends</div>
                        )}
                    </div>
                </div>

                {/* District Distribution */}
                <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0">
                    <h2 className="font-display font-black text-xl text-slate-800 tracking-tight mb-6">Top Districts</h2>
                    <div className="h-[280px] min-w-0">
                        {districtData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={districtData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 800, fill: '#1E293B' }} axisLine={false} tickLine={false} width={80} />
                                    <Tooltip 
                                         cursor={{fill: 'transparent'}}
                                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#1E293B', fontSize: '12px', color: '#fff', fontWeight: 'bold' }}
                                         itemStyle={{color: '#fff'}}
                                    />
                                    <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20}>
                                        {districtData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366F1' : '#818CF8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-medium">No district data yet</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Status distribution */}
                <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0">
                 <h2 className="font-display font-black text-xl text-slate-800 tracking-tight mb-6">Pipeline Funnel</h2>
                    <div className="h-[240px] min-w-0">
                        {pipelineData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="status" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                                        {pipelineData.map((entry) => (
                                            <Cell key={entry.rawStatus} fill={PIPELINE_COLORS[entry.rawStatus] || '#6B7280'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-neutral-600 text-center py-12">No lead data yet.</p>
                        )}
                    </div>
                </div>

                {/* Pending Business Development Executive Approvals */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-bold text-lg text-dark">Pending Business Development Executives</h2>
                        <Link to="/admin/agents?status=pending" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {data?.pending_approvals?.length ? (
                        <div className="flex flex-col gap-3">
                            {data.pending_approvals.map((agent) => (
                                <div key={agent.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                                    <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center text-warning font-bold text-sm shrink-0">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-dark text-sm truncate">{agent.name}</p>
                                        <p className="text-neutral-600 text-xs">{agent.mobile}</p>
                                    </div>
                                    <Link to={`/admin/agents/${agent.id}`} className="text-xs text-primary hover:underline shrink-0 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Review
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-600 text-center py-8">No pending approvals.</p>
                    )}
                </div>
            </div>

            {/* Recent Leads */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-lg text-dark">Recent Leads</h2>
                    <Link to="/admin/leads" className="text-sm text-primary hover:underline flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-neutral-600 border-b border-gray-100">
                                <th className="pb-3 font-semibold">Lead ULID</th>
                                <th className="pb-3 font-semibold">Beneficiary</th>
                                <th className="pb-3 font-semibold">District, State</th>
                                <th className="pb-3 font-semibold">Assigned Business Development Executive</th>
                                <th className="pb-3 font-semibold">Status</th>
                                <th className="pb-3 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.recent_leads?.length ? data.recent_leads.map((lead, i) => (
                                <tr key={lead.id} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-neutral-50' : ''}`}>
                                    <td className="py-3">
                                        <Link to={`/admin/leads/${lead.ulid}`} className="font-mono text-xs text-primary hover:underline">{lead.ulid}</Link>
                                    </td>
                                    <td className="py-3">
                                        <p className="font-medium text-dark">{lead.beneficiary_name}</p>
                                        <p className="text-neutral-600 text-xs">{lead.beneficiary_mobile}</p>
                                    </td>
                                    <td className="py-3 text-neutral-600 text-xs">{lead.beneficiary_district}, {lead.beneficiary_state}</td>
                                    <td className="py-3">
                                        {lead.assigned_agent
                                            ? <span className="text-xs font-mono text-dark">{lead.assigned_agent.agent_id || lead.assigned_agent.name}</span>
                                            : <span className="text-xs text-neutral-600 italic">Unassigned</span>}
                                    </td>
                                    <td className="py-3"><LeadStatusBadge status={lead.status} /></td>
                                    <td className="py-3 text-neutral-600 text-xs whitespace-nowrap">{formatDate(lead.created_at)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-10 text-neutral-600 text-sm">No leads yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
