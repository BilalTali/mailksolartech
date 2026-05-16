import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Users, Search, FileText
} from 'lucide-react';
import api from '@/services/axios';
import { ApiResponse, User, PaginatedResponse } from '@/types';

export default function SuperAdminMonitorAgentsPage() {
    const [search, setSearch] = useState('');

    const { data: res, isLoading } = useQuery({
        queryKey: ['super-admin', 'monitor-agents', search],
        queryFn: async () => {
            const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/super-admin/monitor/agents', {
                params: { search, per_page: 10 }
            });
            return response.data;
        }
    });

    const agents = res?.data?.data || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Monitoring: Business Development Executives
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Read-only oversight of all Agents (BDEs) and their lead generation track record.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search BDEs by code or name..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Executive (Agent)</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Reporting To</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Team</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td></tr>
                                ))
                            ) : agents.map((agent) => (
                                <tr key={agent.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight">{agent.name}</p>
                                                <p className="text-[10px] text-blue-500 font-extrabold uppercase tracking-wider">{agent.agent_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {agent.super_agent ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{agent.super_agent.name}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{agent.super_agent.super_agent_code}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium font-italic">Direct / Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            {(agent as any).assigned_leads_count ?? 0} Leads
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                            agent.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                            {agent.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-medium text-slate-600 text-sm">
                                        <div className="flex items-center justify-end gap-1">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            {(agent as any).enumerators_count ?? 0} ENMs
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
}
