import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';
import {
    BarChart3, TrendingUp, Users, MapPin,
    Activity, Target, Award, PieChart as PieIcon
} from 'lucide-react';
import { reportsApi } from '@/services/reports.api';

const COLORS = [
    '#f97316', // Orange
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#6366f1', // Indigo
    '#f43f5e', // Rose
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#eab308'  // Yellow
];

const AdminReportsPage: React.FC = () => {
    // ════════════════════ QUERIES ════════════════════
    const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
        queryKey: ['report-pipeline'],
        queryFn: () => reportsApi.getPipelineSummary()
    });

    const { data: trendData, isLoading: trendLoading } = useQuery({
        queryKey: ['report-trend'],
        queryFn: () => reportsApi.getMonthlyTrend()
    });

    const { data: geoData, isLoading: geoLoading } = useQuery({
        queryKey: ['report-geo'],
        queryFn: () => reportsApi.getGeographyReport()
    });

    const { data: saPerf, isLoading: saLoading } = useQuery({
        queryKey: ['report-sa-perf'],
        queryFn: () => reportsApi.getSuperAgentPerformance()
    });

    // ════════════════════ HELPERS ════════════════════
    const pipelineChartData = pipelineData?.success ? Object.entries(pipelineData.data.funnel).map(([name, value]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value
    })) : [];

    const stats = [
        { label: 'Total Leads', value: pipelineData?.data.total || 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Completed', value: pipelineData?.data.funnel.completed || 0, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Installations', value: pipelineData?.data.funnel.installed || 0, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>
                <p className="text-slate-500 text-sm">Real-time performance metrics and business insights</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${s.bg}`}>
                            <s.icon className={s.color} size={24} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">
                                {pipelineLoading ? '...' : s.value.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Flow Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-orange-500" size={20} />
                            <h3 className="font-bold text-slate-800 text-lg">Growth & Installation Trend</h3>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {trendLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-400">Loading trend data...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={trendData?.data || []}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInstalls" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area type="monotone" dataKey="new_leads" name="New Leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                                    <Area type="monotone" dataKey="installations" name="Completions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInstalls)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Pipeline Funnel */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2">
                        <PieIcon className="text-orange-500" size={20} />
                        <h3 className="font-bold text-slate-800 text-lg">Sales Pipeline</h3>
                    </div>
                    <div className="relative h-[300px] w-full flex items-center justify-center">
                        {pipelineLoading ? (
                            <div className="text-slate-400">Loading funnel...</div>
                        ) : (
                            <>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-slate-800">{pipelineData?.data.total || 0}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Leads</span>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pipelineChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pipelineChartData.map((_entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => <span className="text-[11px] font-bold text-slate-600 ml-1">{value}</span>}
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Geographic Data */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-orange-500" size={20} />
                        <h3 className="font-bold text-slate-800 text-lg">Top States</h3>
                    </div>
                    <div className="h-[300px]">
                        {geoLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-400">Loading geo data...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={geoData?.data.by_state || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="state" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={100} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                                    <Bar dataKey="count" name="Total Leads" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top Performing Business Development Managers */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="text-orange-500" size={20} />
                            <h3 className="font-bold text-slate-800 text-lg">Top Performing Business Development Managers</h3>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {saLoading ? (
                            <p className="text-center py-10 text-slate-400">Loading leaderboard...</p>
                        ) : (
                            saPerf?.data.slice(0, 5).map((sa, i) => (
                                <div key={sa.id} className="space-y-3">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-orange-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-800">{sa.name}</p>
                                                <p className="text-[11px] text-slate-500 font-medium">Team: {sa.team_size} Business Development Executives • ID: {sa.super_agent_code}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-slate-800">{sa.total_leads} <span className="text-xs text-slate-400 font-medium tracking-tight">Leads</span></p>
                                            <p className={`text-xs font-bold flex items-center justify-end gap-1 ${sa.conversion_rate > 15 ? 'text-green-600' : 'text-slate-500'}`}>
                                                {sa.conversion_rate}% Team Conv.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nested Top Business Development Executives */}
                                    <div className="ml-14 space-y-2 border-l-2 border-slate-100 pl-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Team Leaders</p>
                                        {sa.top_agents.map(agent => (
                                            <div key={agent.id} className="flex items-center justify-between py-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                    <span className="text-xs font-semibold text-slate-700">{agent.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] font-bold text-slate-800">{agent.total_leads} <span className="text-slate-400 font-medium">L</span></span>
                                                    <span className="text-[11px] font-bold text-green-600">{agent.conversion_rate}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Business Development Manager Performance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                    <BarChart3 className="text-orange-500" size={20} />
                    <h3 className="font-bold text-slate-800 text-lg">Business Development Manager Team Overview</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-y border-slate-200">
                                <th className="px-6 py-4 font-bold text-slate-700">Business Development Manager</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Team Size</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-center">Total Team Leads</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-center">Installations</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {saLoading ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading team metrics...</td></tr>
                            ) : saPerf?.data.map(sa => (
                                <tr key={sa.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                                {sa.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{sa.name}</p>
                                                <p className="text-[10px] text-slate-500">ID: {sa.agent_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-slate-400" />
                                            <span className="font-medium text-slate-700">{sa.team_size} Business Development Executives</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800">{sa.total_leads}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                                            {sa.total_installed}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(sa.conversion_rate, 100)}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">{sa.conversion_rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReportsPage;
