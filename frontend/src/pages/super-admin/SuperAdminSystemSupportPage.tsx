import React from 'react';
import { 
    ShieldCheck, Bell, Activity, Lock, Database, Clock, 
    MessageSquare, LifeBuoy, ArrowRight, UserCircle2, Send
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminNotificationsApi } from '@/services/adminNotifications.api';
import api from '@/services/axios';
import toast from 'react-hot-toast';
import SecurityGuard from '@/components/super-admin/SecurityGuard';

export default function SuperAdminSystemSupportPage() {
    const queryClient = useQueryClient();
    const [view, setView] = React.useState<'health' | 'tickets'>('health');

    const { data: notifData, isLoading: notifLoading } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: () => adminNotificationsApi.getNotifications(),
    });

    const { data: ticketData, isLoading: ticketLoading } = useQuery({
        queryKey: ['super-admin-tickets'],
        queryFn: async () => {
            const res = await api.get('/super-admin/support-tickets');
            return res.data.data;
        },
    });

    const escalateMutation = useMutation({
        mutationFn: async ({ ulid, message }: { ulid: string, message?: string }) => {
            const res = await api.post(`/super-admin/leads/${ulid}/escalate-ticket`, { message });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Ticket escalated to administrator successfully.');
            queryClient.invalidateQueries({ queryKey: ['super-admin-tickets'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to escalate ticket');
        }
    });

    const notifications = notifData?.data?.data ?? [];
    const tickets = ticketData?.data ?? [];

    return (
        <SecurityGuard>
            <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Activity className="text-indigo-600 w-8 h-8" /> Platform Health & Security
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 uppercase tracking-[0.2em] text-[10px]">Administrative Monitoring & Core Protocols</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                    <button 
                        onClick={() => setView('health')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'health' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Infrastructure
                    </button>
                    <button 
                        onClick={() => setView('tickets')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'tickets' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Consumer Support
                    </button>
                </div>
            </div>

            {view === 'health' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Security Vault Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden p-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Lock size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">System Security & Core Parameters</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">Advanced configuration and audit infrastructure</p>
                            </div>
                        </div>

                        <div className="p-12 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-6">
                            <ShieldCheck className="w-16 h-16 text-indigo-600 mx-auto opacity-20" />
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold text-slate-800 tracking-tight">Security Protocol Vault</h4>
                                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
                                    This restricted area manages high-level API credentials, rate limiting algorithms, and cross-territory audit logs. 
                                    Access to specific keys is currently restricted to the Master Root account.
                                </p>
                            </div>
                            <div className="pt-4">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                                    <Activity size={12} /> System Status: Operational
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-slate-400">
                                    <Database size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live</span>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">Database Engine</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1">PostgreSQL 15.0 - Master Cluster</p>
                                </div>
                            </div>
                            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-slate-400">
                                    <ShieldCheck size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Secure</span>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">Auth Architecture</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1">JWT + OTP Gated Sessions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Feed */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden h-full min-h-[600px]">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                <Bell className="text-indigo-400" size={20} /> System Alerts
                            </h3>
                            {notifications.length > 0 && (
                                <span className="bg-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-400 shadow-lg shadow-indigo-900">
                                    {notifications.length} New
                                </span>
                            )}
                        </div>

                        <div className="relative z-10 space-y-4">
                            {notifLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Scanning Network...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                        <ShieldCheck size={32} className="text-slate-600" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Clear Sky: No pending system alerts detected.</p>
                                </div>
                            ) : (
                                notifications.slice(0, 8).map((n: any) => (
                                    <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
                                                <Activity size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                                                    {n.data?.title || 'System Event'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {n.data?.message || n.type}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                    <Clock size={10} /> {new Date(n.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {notifications.length > 8 && (
                                <button className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/5">
                                    Archive Overview
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-800">{tickets.length}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Queries</p>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <LifeBuoy size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-800">{tickets.length}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Response</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                                <MessageSquare size={18} className="text-indigo-500" /> Support Ticket Queue
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Feed</span>
                        </div>
                        
                        <div className="divide-y divide-slate-100">
                            {ticketLoading ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching Tickets...</p>
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                        <MessageSquare size={40} className="text-slate-200" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800">Clear Workspace</h4>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto">No consumer support queries require attention at this moment.</p>
                                </div>
                            ) : (
                                tickets.map((t: any) => (
                                    <div key={t.id} className="p-8 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                        <div className="flex items-start gap-5 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shrink-0">
                                                <UserCircle2 size={24} />
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-slate-900">{t.lead?.beneficiary_name || 'Consumer'}</h4>
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">
                                                        {t.lead?.ulid || 'No ULID'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                                                    {t.notes.replace('SUPPORT TICKET: ', '')}
                                                </p>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock size={12} /> {new Date(t.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex flex-col gap-2">
                                            <a 
                                                href={`/super-admin/monitor/leads?search=${t.lead?.ulid}`}
                                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                            >
                                                View Lead <ArrowRight size={14} />
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    const msg = prompt('Enter escalation note for Admin (optional):');
                                                    if (msg !== null) escalateMutation.mutate({ ulid: t.lead?.ulid, message: msg });
                                                }}
                                                disabled={escalateMutation.isPending}
                                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50"
                                            >
                                                <Send size={14} /> Escalate to Admin
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </SecurityGuard>
    );
}
