import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Search, FileText, UserCircle
} from 'lucide-react';
import api from '@/services/axios';
import { ApiResponse, User, PaginatedResponse } from '@/types';

export default function SuperAdminMonitorEnumeratorsPage() {
    const [search, setSearch] = useState('');

    const { data: res, isLoading } = useQuery({
        queryKey: ['super-admin', 'monitor-enumerators', search],
        queryFn: async () => {
            const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/super-admin/monitor/enumerators', {
                params: { search, per_page: 10 }
            });
            return response.data;
        }
    });

    const enumerators = res?.data?.data || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCircle className="w-6 h-6 text-emerald-500" />
                        Monitoring: Enumerators
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Read-only oversight of all Enumerators and their contribution to lead generation.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search enumerators..."
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
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Enumerator</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Reporting To (Agent)</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Leads Gathered</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Added On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td></tr>
                                ))
                            ) : enumerators.map((enm) => (
                                <tr key={enm.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                                {enm.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight text-sm">{enm.name}</p>
                                                <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest">{enm.enumerator_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {enm.parentAgent ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{enm.parentAgent.name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{enm.parentAgent.agent_id}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">Independent / External</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            {(enm as any).enumerator_leads_count ?? 0} Leads
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                            enm.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                            {enm.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-medium text-slate-400 text-xs uppercase">
                                        {new Date(enm.created_at).toLocaleDateString()}
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
