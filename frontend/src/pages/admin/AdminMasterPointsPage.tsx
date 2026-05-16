import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Search, ArrowUpFromLine, 
    Shield, ShieldAlert, Star, Users, User, Database
} from 'lucide-react';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { offersApi } from '@/services/offers.api';
import { useAuthStore } from '@/store/authStore';

interface HierarchyNode {
    user_id: number;
    name: string;
    role: string;
    identifier: string;
    points_earned: number;
    absorbed_points: number;
    total_available: number;
    redeemed_points: number;
}

export default function AdminMasterPointsPage() {
    const { role: _currentRole } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-points-master-overview'],
        queryFn: offersApi.admin.masterOverview
    });

    const hierarchy: HierarchyNode[] = response?.data || [];

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin': return { icon: <ShieldAlert size={12} />, bg: 'bg-rose-100', text: 'text-rose-700', label: 'SUPER ADMIN' };
            case 'admin': return { icon: <Shield size={12} />, bg: 'bg-amber-100', text: 'text-amber-700', label: 'ADMIN' };
            case 'super_agent': return { icon: <Star size={12} />, bg: 'bg-purple-100', text: 'text-purple-700', label: 'BDM' };
            case 'agent': return { icon: <Users size={12} />, bg: 'bg-blue-100', text: 'text-blue-700', label: 'BDE' };
            case 'enumerator': return { icon: <User size={12} />, bg: 'bg-slate-100', text: 'text-slate-600', label: 'ENUMERATOR' };
            default: return { icon: <User size={12} />, bg: 'bg-slate-100', text: 'text-slate-600', label: role.toUpperCase() };
        }
    };

    const filteredData = hierarchy.filter(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        h.identifier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 pb-20">
            <SEOHead title="Master Points Overview | Admin" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Database className="w-8 h-8 text-indigo-600" />
                        Master System Points
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Full hierarchy points overview from Enumerator up to Admin</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or identifier..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex justify-center"><LoadingSpinner /></div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center" title="Standard points earned from own leads">Points Earned directly</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center" title="Points absorbed from unredeemed downlines or enumerator fees">Absorbed Points</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center">Total Available Pool</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifetime Redeemed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.map((node) => {
                                    const badge = getRoleBadge(node.role);
                                    return (
                                        <tr key={node.user_id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight">{node.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">{node.identifier}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest ${badge.bg} ${badge.text}`}>
                                                    {badge.icon}
                                                    {badge.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-base font-bold text-slate-700">{node.points_earned.toFixed(1)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {node.absorbed_points > 0 ? (
                                                    <div className="flex flex-col items-center gap-1 text-indigo-600">
                                                        <ArrowUpFromLine size={16} className="text-indigo-400" />
                                                        <span className="text-base font-black bg-indigo-50 px-3 py-1 rounded-lg">{(node.absorbed_points).toFixed(1)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center min-w-16 h-10 px-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                                    <span className="text-lg font-black">{node.total_available.toFixed(1)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-500">
                                                <span className="text-base font-bold">{node.redeemed_points.toFixed(1)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <Database size={48} className="text-slate-100 mb-4 mx-auto" />
                                            <p className="text-slate-500 font-bold italic">No hierarchy data found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
