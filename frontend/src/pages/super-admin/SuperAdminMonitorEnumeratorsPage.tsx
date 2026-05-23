import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Search, FileText, UserCircle, Phone, Mail, UserPlus, X, Loader2, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { ApiResponse, User, PaginatedResponse } from '@/types';

export default function SuperAdminMonitorEnumeratorsPage() {
    const [search, setSearch] = useState('');
    const [activeContactId, setActiveContactId] = useState<number | null>(null);
    const [assigningEnum, setAssigningEnum] = useState<User | null>(null);
    const [selectedAdminId, setSelectedAdminId] = useState<string | number>('');

    const queryClient = useQueryClient();

    const { data: res, isLoading } = useQuery({
        queryKey: ['super-admin', 'monitor-enumerators', search],
        queryFn: async () => {
            const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/super-admin/monitor/enumerators', {
                params: { search, per_page: 10 }
            });
            return response.data;
        }
    });

    const { data: adminsRes } = useQuery({
        queryKey: ['super-admin', 'admins-all'],
        queryFn: async () => {
            const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/super-admin/admins', {
                params: { per_page: 100 }
            });
            return response.data;
        },
        enabled: !!assigningEnum,
    });

    const adminsList = adminsRes?.data?.data || [];

    const assignMutation = useMutation({
        mutationFn: async ({ enumeratorId, adminId }: { enumeratorId: number; adminId: number }) => {
            const response = await api.put(`/super-admin/monitor/enumerators/${enumeratorId}/assign-admin`, {
                admin_id: adminId
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'monitor-enumerators'] });
            toast.success('Enumerator assigned to administrator successfully.');
            setAssigningEnum(null);
            setSelectedAdminId('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to assign enumerator.');
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
                            ) : enumerators.map((enm) => {
                                const parentAgent = enm.parent_agent || enm.parentAgent;
                                const createdBySuperAgent = enm.created_by_super_agent || enm.createdBySuperAgent;
                                return (
                                    <tr key={enm.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                                    {enm.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight text-sm">{enm.name}</p>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-0.5 mt-0.5 text-slate-500">
                                                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest leading-none">{enm.enumerator_id || 'PENDING'}</span>
                                                        {enm.mobile && (
                                                            <span className="text-[11px] font-medium flex items-center gap-1 leading-none">
                                                                <Phone className="w-2.5 h-2.5 text-slate-400" /> {enm.mobile}
                                                            </span>
                                                        )}
                                                        {enm.email && (
                                                            <span className="text-[11px] font-medium flex items-center gap-1 leading-none truncate max-w-[150px]">
                                                                <Mail className="w-2.5 h-2.5 text-slate-400" /> {enm.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 relative">
                                            {parentAgent ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Agent</span>
                                                    <span className="text-sm font-bold text-slate-800 leading-tight">{parentAgent.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter">{parentAgent.agent_id}</span>
                                                </div>
                                            ) : createdBySuperAgent ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Super Agent (BDM)</span>
                                                    <span className="text-sm font-bold text-indigo-600 leading-tight">{createdBySuperAgent.name}</span>
                                                    <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-tighter">{createdBySuperAgent.super_agent_code}</span>
                                                </div>
                                            ) : (enm.parent && enm.parent.role === 'admin' && enm.enumerator_creator_role === 'admin') ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Admin (Direct)</span>
                                                    <span className="text-sm font-bold text-emerald-600 leading-tight">{enm.parent.name}</span>
                                                    <span className="text-[10px] text-emerald-400 font-semibold tracking-tighter">{enm.parent.email}</span>
                                                </div>
                                            ) : (enm.parent && enm.parent.role === 'admin') ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Admin (Assigned)</span>
                                                    <span className="text-sm font-bold text-emerald-600 leading-tight">{enm.parent.name}</span>
                                                    <span className="text-[10px] text-emerald-400 font-semibold tracking-tighter">{enm.parent.email}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssigningEnum(enm);
                                                        }}
                                                        className="mt-1.5 self-start inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer select-none"
                                                    >
                                                        Reassign Admin
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="inline-block">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveContactId(activeContactId === enm.id ? null : enm.id);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-200/60 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer select-none"
                                                    >
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                        </span>
                                                        Independent / External
                                                    </button>

                                                    {activeContactId === enm.id && (
                                                        <>
                                                            <div 
                                                                className="fixed inset-0 z-30" 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveContactId(null);
                                                                }}
                                                            />
                                                            
                                                            <div 
                                                                className="absolute left-6 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-150 shadow-2xl p-5 z-40 animate-in fade-in slide-in-from-top-3 duration-300"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                                                                    <div>
                                                                        <h4 className="text-sm font-black text-slate-900">Unassigned Enumerator</h4>
                                                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Independent / External</p>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setActiveContactId(null)}
                                                                        className="p-1 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                                                                    >
                                                                        <X className="w-4 h-4 text-slate-400" />
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-2.5 mb-4">
                                                                    {enm.mobile && (
                                                                        <a 
                                                                            href={`tel:${enm.mobile}`} 
                                                                            className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all group/item"
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                                                <Phone className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-0.5">Mobile Number</p>
                                                                                <p className="text-xs font-bold text-slate-800 group-hover/item:text-emerald-600 transition-colors leading-tight">{enm.mobile}</p>
                                                                            </div>
                                                                        </a>
                                                                    )}

                                                                    {enm.email && (
                                                                        <a 
                                                                            href={`mailto:${enm.email}`} 
                                                                            className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all group/item"
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                                                                <Mail className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="text-left max-w-[200px]">
                                                                                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-0.5">Email Address</p>
                                                                                <p className="text-xs font-bold text-slate-800 group-hover/item:text-indigo-600 transition-colors truncate leading-tight">{enm.email}</p>
                                                                            </div>
                                                                        </a>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        setAssigningEnum(enm);
                                                                        setActiveContactId(null);
                                                                    }}
                                                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-dark transition-all shadow-md shadow-primary/10 active:scale-[0.98]"
                                                                >
                                                                    <UserPlus className="w-4 h-4" />
                                                                    Assign to Admin
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Admin Assignment Modal */}
            {assigningEnum && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <UserCheck className="w-5 h-5 text-emerald-500" />
                                    Assign to Administrator
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Link this independent enumerator to a platform admin.</p>
                            </div>
                            <button 
                                onClick={() => { setAssigningEnum(null); setSelectedAdminId(''); }} 
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!selectedAdminId) {
                                toast.error('Please select an administrator.');
                                return;
                            }
                            assignMutation.mutate({ 
                                enumeratorId: assigningEnum.id, 
                                adminId: Number(selectedAdminId) 
                            });
                        }} className="p-8 space-y-6">
                            
                            {/* Enumerator Info Card */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Enumerator Details</p>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{assigningEnum.name}</p>
                                    <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest leading-none mt-1">{assigningEnum.enumerator_id}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                    <div className="truncate">
                                        <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Mobile</span>
                                        {assigningEnum.mobile}
                                    </div>
                                    <div className="truncate">
                                        <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Email</span>
                                        {assigningEnum.email}
                                    </div>
                                </div>
                            </div>

                            {/* Admin Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Platform Administrator</label>
                                <select 
                                    required 
                                    value={selectedAdminId}
                                    onChange={e => setSelectedAdminId(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-700 text-sm focus:outline-none"
                                >
                                    <option value="">Choose an administrator...</option>
                                    {adminsList.map((admin) => (
                                        <option key={admin.id} value={admin.id}>
                                            {admin.name} ({admin.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex items-center gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => { setAssigningEnum(null); setSelectedAdminId(''); }} 
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={assignMutation.isPending || !selectedAdminId}
                                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                >
                                    {assignMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        'Assign Enumerator'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
