import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/axios';
import { ClipboardList, CheckCircle2, Clock, MapPin, Sun, LayoutDashboard, Banknote } from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import DashboardSkeleton from '@/components/shared/DashboardSkeleton';

interface TechnicalStats {
    total_assigned: number;
    pending_surveys: number;
    completed_surveys: number;
    pending_installations: number;
    completed_installations: number;
    unpaid_commission: number;
    paid_commission: number;
}

interface Activity {
    id: number;
    visit_type: string;
    created_at: string;
    lead: {
        ulid: string;
        beneficiary_name: string;
    };
}

export default function TechnicalDashboardPage() {
    const { user } = useAuthStore();
    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['technical-stats'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { stats: TechnicalStats; recent_activity: Activity[] } }>('/technical/stats');
            return res.data.data;
        }
    });

    if (isLoading) return <DashboardSkeleton />;

    const stats = dashboardData?.stats;
    const activities = dashboardData?.recent_activity || [];

    const techType = (user as any)?.technician_type?.toLowerCase() || 'both';

    const kpiCards = [
        { label: 'Assigned Leads', value: stats?.total_assigned || 0, icon: <ClipboardList />, color: 'border-blue-500 text-blue-600', sub: 'Total assigned', show: true },
        { 
            label: 'Pending Surveys', 
            value: stats?.pending_surveys || 0, 
            icon: <Clock />, 
            color: 'border-orange-500 text-orange-600', 
            sub: 'Action required',
            show: techType === 'surveyor' || techType === 'both'
        },
        { 
            label: 'Completed Surveys', 
            value: stats?.completed_surveys || 0, 
            icon: <CheckCircle2 />, 
            color: 'border-emerald-500 text-emerald-600', 
            sub: 'Surveyed',
            show: techType === 'surveyor' || techType === 'both'
        },
        { 
            label: 'Installations', 
            value: stats?.completed_installations || 0, 
            icon: <Sun />, 
            color: 'border-indigo-500 text-indigo-600', 
            sub: 'Finalized',
            show: techType === 'installer' || techType === 'both'
        },
        { label: 'Pending Earnings', value: formatCurrency(stats?.unpaid_commission || 0), icon: <Banknote />, color: 'border-amber-500 text-amber-600', sub: 'To be disbursed', show: true },
        { label: 'Disbursed Earnings', value: formatCurrency(stats?.paid_commission || 0), icon: <CheckCircle2 />, color: 'border-green-500 text-green-600', sub: 'Total paid out', show: true },
    ].filter(card => card.show);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-orange-500" size={32} />
                        Field Operations Hub
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Performance overview & real-time assignments</p>
                </div>
                <Link to="/technical/leads" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:scale-105 transition-all shadow-xl">
                    View Assigned Leads
                </Link>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, i) => (
                    <div key={i} className={`bg-white p-6 rounded-[2rem] border-l-8 ${card.color} shadow-sm hover:shadow-md transition-all group`}>
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{card.label}</p>
                                <h3 className="text-3xl font-display font-black text-slate-800">{card.value}</h3>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100 transition-colors">
                                {card.icon}
                            </div>
                         </div>
                         <p className="text-[9px] font-bold text-slate-500 mt-4 uppercase tracking-tighter">{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                    <h2 className="text-xl font-display font-black text-slate-800 mb-6 flex items-center gap-2">
                        Recent Logged Visits
                    </h2>
                    {activities.length > 0 ? (
                        <div className="space-y-4">
                            {activities.map((act) => (
                                <Link 
                                    key={act.id} 
                                    to={act.visit_type === 'site_survey' ? `/technical/leads/${act.lead.ulid}/survey` : `/technical/leads/${act.lead.ulid}/checklist`}
                                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-orange-300 hover:shadow-md transition-all group"
                                >
                                    <div className={`p-3 rounded-xl transition-colors ${act.visit_type === 'site_survey' ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                        <MapPin size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 text-sm group-hover:text-orange-600 transition-colors">{act.lead.beneficiary_name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                            {act.visit_type.replace('_', ' ')} • {act.lead.ulid.slice(-8)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">{formatDate(act.created_at)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No visit logs recorded yet</p>
                        </div>
                    )}
                </div>

                {/* Quick Info / Tips */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <h3 className="text-lg font-display font-black mb-4 flex items-center gap-2">
                            <Sun className="text-orange-400" /> Ground Support
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            Ensuring accurate geo-tagged status updates is critical for lead processing. Always verify the GPS lock before submitting a visit.
                        </p>
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Need Help?</p>
                            <p className="text-xs mt-1 text-slate-400">Contact your technical lead or regional admin.</p>
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-[2.5rem] border border-orange-100 p-8">
                        <h4 className="text-orange-800 font-black text-sm uppercase tracking-widest mb-4">Current Focus</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-xs font-bold text-orange-950">Prioritize "REGISTERED" leads</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-xs font-bold text-orange-950">Upload clear selfie photos</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-xs font-bold text-orange-950">Sync data after every visit</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
