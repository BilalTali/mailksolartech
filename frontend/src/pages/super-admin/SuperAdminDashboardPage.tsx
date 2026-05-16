import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Users, Shield, Star, FileText, DollarSign, Activity, 
    TrendingUp, ArrowUpRight, Sparkles,
    BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
    Globe2, Server, Database, ShieldCheck
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '@/services/axios';
import { ApiResponse } from '@/types';
import BankingStatusModule from '@/components/dashboard/BankingStatusModule';

interface DashboardStats {
    total_admins: number;
    total_super_agents: number;
    total_agents: number;
    total_enumerators: number;
    total_leads: number;
    total_commissions: number;
    growth_data?: Array<{
        name: string;
        leads: number;
        revenue: number;
    }>;
    performance_data?: Array<{
        region: string;
        volume: number;
        efficiency: number;
    }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl">
                <p className="text-white font-bold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-300 text-sm capitalize">{entry.name}:</span>
                        <span className="text-white font-mono font-bold">
                            {entry.name === 'revenue' ? `₹${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function SuperAdminDashboardPage() {
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setAnimateIn(true);
    }, []);

    const { data: statsRes, isLoading } = useQuery({
        queryKey: ['super-admin', 'stats'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<DashboardStats>>('/super-admin/dashboard/stats');
            return res.data;
        }
    });

    const stats = statsRes?.data;

    const distributionData = [
        { name: 'BDMs (SA)', value: stats?.total_super_agents || 1, color: '#6366f1' },
        { name: 'BDEs (Agent)', value: stats?.total_agents || 1, color: '#3b82f6' },
        { name: 'Enumerators', value: stats?.total_enumerators || 1, color: '#10b981' },
    ];

    const cards = [
        { label: 'Total Admins', value: stats?.total_admins, icon: <Shield className="w-6 h-6" />, color: 'from-blue-600 to-cyan-500', bgGlow: 'bg-blue-500/10', trend: '+2 this month', trendUp: true, sparkline: [10, 12, 11, 14, 15, 18, 20] },
        { label: 'Total BDMs (SA)', value: stats?.total_super_agents, icon: <Star className="w-6 h-6" />, color: 'from-indigo-600 to-violet-500', bgGlow: 'bg-indigo-500/10', trend: '+5 this month', trendUp: true, sparkline: [20, 25, 22, 30, 28, 35, 40] },
        { label: 'Total BDEs (Agent)', value: stats?.total_agents, icon: <Users className="w-6 h-6" />, color: 'from-primary to-primary-light', bgGlow: 'bg-primary/10', trend: '+12 this month', trendUp: true, sparkline: [50, 60, 55, 75, 80, 100, 120] },
        { label: 'Total Enumerators', value: stats?.total_enumerators, icon: <Activity className="w-6 h-6" />, color: 'from-emerald-600 to-teal-500', bgGlow: 'bg-emerald-500/10', trend: '+24 this month', trendUp: true, sparkline: [30, 45, 40, 60, 55, 80, 95] },
        { label: 'Total Leads', value: stats?.total_leads, icon: <FileText className="w-6 h-6" />, color: 'from-orange-500 to-amber-400', bgGlow: 'bg-orange-500/10', trend: '+150 this week', trendUp: true, sparkline: [100, 150, 130, 200, 250, 320, 450] },
        { label: 'Global Commissions', value: `₹${(stats?.total_commissions || 0).toLocaleString()}`, icon: <DollarSign className="w-6 h-6" />, color: 'from-rose-600 to-pink-500', bgGlow: 'bg-rose-500/10', trend: 'Global Payout', trendUp: true, sparkline: [5, 8, 7, 12, 15, 22, 28] },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                </div>
                <p className="text-slate-500 font-bold tracking-widest uppercase text-sm animate-pulse">Initializing Authority Protocol...</p>
            </div>
        );
    }

    return (
        <div className={`space-y-8 transition-all duration-1000 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Ultra Premium Header Area */}
            <div className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] group border border-slate-800">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none rounded-[2.5rem]">
                    <div className="absolute -top-[30%] -right-[10%] w-[60%] h-[150%] bg-gradient-to-l from-indigo-600/30 via-primary/10 to-transparent rotate-12 transform group-hover:rotate-6 transition-transform duration-1000 blur-3xl"></div>
                    <div className="absolute -bottom-[50%] -left-[10%] w-[50%] h-[150%] bg-gradient-to-r from-emerald-600/20 via-teal-500/10 to-transparent -rotate-12 transform group-hover:-rotate-6 transition-transform duration-1000 blur-3xl"></div>
                    {/* Grid Pattern overlay */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
                </div>

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-indigo-300 text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-inner">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Executive Authority Console</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4">
                            Global Platform <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">Command Center</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-lg md:text-xl leading-relaxed max-w-2xl">
                            Real-time platform intelligence, cross-network distribution analytics, and global financial oversight.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">System Pulse</p>
                                <p className="text-emerald-400 text-xs font-black tracking-widest uppercase">100% Operational</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 group">
                            <BarChart3 className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition-transform" />
                            Live Telemetry
                        </button>
                    </div>
                </div>
            </div>

            <BankingStatusModule />

            {/* High-Fidelity Infographic KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <div 
                        key={i} 
                        className={`group relative overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 p-1`}
                    >
                        {/* Gradient Border Illusion */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 opacity-100 group-hover:opacity-0 transition-opacity duration-500 z-0"></div>
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 z-0`}></div>
                        
                        <div className="relative z-10 bg-white rounded-[1.8rem] h-full p-6 md:p-8 flex flex-col justify-between overflow-hidden">
                            {/* Abstract glow inside card */}
                            <div className={`absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${card.color} pointer-events-none`}></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-xl shadow-black/5 ring-4 ring-white transform group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                                    {card.icon}
                                </div>
                                <div className={`flex flex-col items-end`}>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide ${card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        <span>{card.trend}</span>
                                        {card.trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">{card.label}</h3>
                                <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{card.value}</p>
                            </div>

                            {/* Mini Sparkline Chart */}
                            <div className="h-12 mt-6 w-full opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                                <ResponsiveContainer width="100%" height={48} minWidth={0} minHeight={0}>
                                    <AreaChart data={card.sparkline.map((val, idx) => ({ value: val, index: idx }))}>
                                        <defs>
                                            <linearGradient id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={i % 2 === 0 ? '#6366f1' : '#10b981'} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={i % 2 === 0 ? '#6366f1' : '#10b981'} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke={i % 2 === 0 ? '#6366f1' : '#10b981'} 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill={`url(#color-${i})`} 
                                            isAnimationActive={true}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Deep Analytics Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Main Growth Chart */}
                <div className="xl:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-shadow duration-500 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <LineChartIcon className="w-6 h-6" />
                                </div>
                                Platform Growth Trajectory
                            </h3>
                            <p className="text-slate-500 font-medium mt-2">Correlating lead acquisition with generated revenue over 7 months.</p>
                        </div>
                        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <button className="px-4 py-2 text-sm font-bold bg-white shadow-sm rounded-lg text-slate-800">7M</button>
                            <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800">1Y</button>
                            <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800">ALL</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full min-h-[350px]">
                        <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
                            <AreaChart data={stats?.growth_data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dx={-10} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dx={10} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 8, strokeWidth: 0, fill: '#8b5cf6' }} />
                                <Area yAxisId="right" type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" activeDot={{ r: 8, strokeWidth: 0, fill: '#0ea5e9' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Role Distribution & Network Health */}
                <div className="flex flex-col gap-8">
                    {/* Role Distribution Pie Chart */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-shadow duration-500 flex-1">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                                <PieChartIcon className="w-5 h-5" />
                            </div>
                            Role Distribution
                        </h3>
                        <div className="h-[220px] w-full relative">
                            <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        animationBegin={200}
                                        animationDuration={1500}
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-900">{stats?.total_agents || 0}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase">Total Agents</span>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {distributionData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-sm font-bold text-slate-600">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Technical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Network Health Cards */}
                <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 border border-slate-700 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
                    <h3 className="text-xl font-black text-white flex items-center gap-3 mb-8 relative z-10">
                        <div className="p-2.5 bg-white/10 text-emerald-400 rounded-xl backdrop-blur-md">
                            <Server className="w-5 h-5" />
                        </div>
                        Infrastructure Health
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <Globe2 className="w-6 h-6 text-indigo-400" />
                                <div>
                                    <p className="text-white font-bold text-sm">CDN Edge Nodes</p>
                                    <p className="text-slate-400 text-xs">Latency: 12ms avg</p>
                                </div>
                            </div>
                            <span className="text-emerald-400 font-bold text-sm">Optimal</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <Database className="w-6 h-6 text-cyan-400" />
                                <div>
                                    <p className="text-white font-bold text-sm">Database Clusters</p>
                                    <p className="text-slate-400 text-xs">Load: 24% capacity</p>
                                </div>
                            </div>
                            <span className="text-emerald-400 font-bold text-sm">Stable</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="w-6 h-6 text-rose-400" />
                                <div>
                                    <p className="text-white font-bold text-sm">Security Firewall</p>
                                    <p className="text-slate-400 text-xs">Threats blocked: 142</p>
                                </div>
                            </div>
                            <span className="text-emerald-400 font-bold text-sm">Active</span>
                        </div>
                    </div>
                </div>

                {/* Regional Performance Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-shadow duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Globe2 className="w-6 h-6" />
                                </div>
                                Regional Volume & Efficiency
                            </h3>
                            <p className="text-slate-500 font-medium mt-2">Geographical distribution of operations and pipeline efficiency.</p>
                        </div>
                    </div>
                    
                    <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
                            <BarChart data={stats?.performance_data || []} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dx={-10} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 700, fontSize: '12px', color: '#64748b' }} />
                                <Bar dataKey="volume" name="Lead Volume" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="efficiency" name="Efficiency (%)" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}

