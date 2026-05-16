import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/services/offers.api';
import { OfferRedemption, RedemptionStatus } from '@/types';
import {
    CheckCircle2, Package, Clock, Filter, Search,
    User, Gift, ChevronRight, Info, XCircle, List, Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

import { useAuthStore } from '@/store/authStore';

export const AdminRedemptionsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    (window as any).isSuperAdmin = isSuperAdmin; // Global helper for inline logic
    
    const [activeTab, setActiveTab] = useState<'redemptions' | 'leaderboard'>('redemptions');
    const [statusFilter, setStatusFilter] = useState<RedemptionStatus | ''>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRedemption, setSelectedRedemption] = useState<OfferRedemption | null>(null);
    const [actionNotes, setActionNotes] = useState('');

    const { data: redemptionsResp, isLoading: isLoadingRedemptions } = useQuery({
        queryKey: ['admin-redemptions', statusFilter],
        queryFn: () => offersApi.admin.getRedemptions(statusFilter || undefined)
    });

    const { data: leaderboardResp, isLoading: isLoadingLeaderboard } = useQuery({
        queryKey: ['admin-leaderboard'],
        queryFn: () => offersApi.admin.getLeaderboard(),
        enabled: activeTab === 'leaderboard'
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }: { id: number, notes?: string }) =>
            offersApi.admin.approveRedemption(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-redemptions'] });
            toast.success('Redemption approved');
            setSelectedRedemption(null);
        }
    });



    const cancelMutation = useMutation({
        mutationFn: ({ id, notes }: { id: number, notes?: string }) =>
            offersApi.admin.cancelRedemption(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-redemptions'] });
            toast.success('Redemption cancelled and points reverted');
            setSelectedRedemption(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to cancel redemption');
        }
    });

    const redemptions = (redemptionsResp?.data as OfferRedemption[]) || [];
    const filtered = redemptions.filter((r: OfferRedemption) =>
        r.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.offer?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.user as any)?.agent_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const leaderboard = (leaderboardResp?.data as any[]) || [];
    const filteredLeaderboard = leaderboard.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.identifier && u.identifier.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return "bg-amber-50 text-amber-700 border-amber-100";
            case 'admin_approved': return "bg-indigo-50 text-indigo-700 border-indigo-100";
            case 'approved': return "bg-blue-50 text-blue-700 border-blue-100";
            case 'delivered': return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case 'cancelled': return "bg-red-50 text-red-700 border-red-100";
            default: return "bg-slate-50 text-slate-700 border-slate-100";
        }
    };

    if (isLoadingRedemptions && activeTab === 'redemptions') return <LoadingSpinner />;
    if (isLoadingLeaderboard && activeTab === 'leaderboard') return <LoadingSpinner />;

    return (
        <div className="p-6">
            <SEOHead title="Offer Approvals | Admin" />

            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Offer Approvals</h1>
                <p className="text-slate-500 font-medium">Review claims and monitor agent performance leaderboard</p>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('redemptions')}
                    className={`pb-4 px-2 tracking-tight font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'redemptions' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-700'
                    }`}
                >
                    <List size={18} /> Pending Claims
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`pb-4 px-2 tracking-tight font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'leaderboard' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-700'
                    }`}
                >
                    <Trophy size={18} /> Global Leaderboard
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'redemptions' ? "Search by agent or offer..." : "Search by agent name or ID..."}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mediumShadow"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'redemptions' && (
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as RedemptionStatus)}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending Admin</option>
                            <option value="admin_approved">Pending Super Admin</option>
                            <option value="approved">Approved & Processing</option>
                            <option value="delivered">Delivered</option>
                        </select>
                    </div>
                )}
            </div>

            {activeTab === 'redemptions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List */}
                    <div className="lg:col-span-2 space-y-4">
                        {filtered.map((r: OfferRedemption) => (
                            <div
                                key={r.id}
                                onClick={() => { setSelectedRedemption(r); setActionNotes(r.notes || ''); }}
                                className={`group relative bg-white p-5 rounded-2xl border transition-all cursor-pointer ${selectedRedemption?.id === r.id
                                    ? "border-indigo-600 ring-4 ring-indigo-50"
                                    : "border-slate-100 hover:border-slate-200"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            {r.status === 'pending' || r.status === 'admin_approved' ? <Clock size={24} /> : r.status === 'approved' ? <Package size={24} /> : r.status === 'cancelled' ? <XCircle size={24} /> : <CheckCircle2 size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{r.offer?.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{r.user?.name}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-xs font-bold text-indigo-600">{(r.user as any)?.agent_id || (r.user as any)?.super_agent_code}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight border ${getStatusStyle(r.status)}`}>
                                            {r.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {format(new Date(r.claimed_at), 'dd MMM yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="bg-slate-50 p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                                <Package size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-500 font-bold italic">No redemption claims for this selection</p>
                            </div>
                        )}
                    </div>

                    {/* Detail View / Action Panel */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                            {selectedRedemption ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-6 bg-slate-900 text-white">
                                        <h2 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                                            <Gift size={20} className="text-amber-400" />
                                            Claim Details
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center translate-y-0.5">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest leading-none mb-1">Agent</p>
                                                    <p className="font-bold leading-none">{selectedRedemption.user?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center translate-y-0.5">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest leading-none mb-1">Prize</p>
                                                    <p className="font-bold leading-none text-amber-400">{selectedRedemption.offer?.prize_label}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                                                <span>Claim Info</span>
                                            </div>
                                            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Redemption ID</span>
                                                    <span className="font-black">#{selectedRedemption.id}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Claim #</span>
                                                    <span className="font-black text-indigo-600">{selectedRedemption.redemption_number}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Points Consumed</span>
                                                    <span className="font-black">{selectedRedemption.points_used}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Form */}
                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Internal Notes</label>
                                                <textarea
                                                    value={actionNotes}
                                                    onChange={(e) => setActionNotes(e.target.value)}
                                                    placeholder="Add verification notes..."
                                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                {(selectedRedemption.status === 'pending' || (selectedRedemption.status === 'admin_approved' && isSuperAdmin)) && (
                                                    <button
                                                        onClick={() => approveMutation.mutate({ id: selectedRedemption.id, notes: actionNotes })}
                                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm transition-all hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        {approveMutation.isPending ? "PROCESSING..." : (selectedRedemption.status === 'admin_approved' ? "FINAL APPROVAL" : "APPROVE CLAIM")}
                                                        {!approveMutation.isPending && <ChevronRight size={18} />}
                                                    </button>
                                                )}

                                                {selectedRedemption.status === 'admin_approved' && !isSuperAdmin && (
                                                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                                                        <Clock size={24} className="mx-auto text-indigo-600 mb-2" />
                                                        <p className="text-indigo-800 font-black text-sm tracking-tight uppercase">Passed To Super Admin</p>
                                                        <p className="text-[10px] text-indigo-600 font-bold mt-1">Pending final super admin approval.</p>
                                                    </div>
                                                )}

                                                {selectedRedemption.status === 'approved' && (
                                                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                                                        <Package size={24} className="mx-auto text-blue-600 mb-2" />
                                                        <p className="text-blue-800 font-black text-sm tracking-tight uppercase">Processing</p>
                                                        <p className="text-[10px] text-blue-600 font-bold mt-1">Super Admin is processing this delivery.</p>
                                                    </div>
                                                )}
                                                
                                                {(selectedRedemption.status === 'pending') && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm("Are you sure you want to cancel this redemption? Points will be reverted to the user's balance.")) {
                                                                cancelMutation.mutate({ id: selectedRedemption.id, notes: actionNotes });
                                                            }
                                                        }}
                                                        className="w-full py-3 bg-white text-red-600 border-2 border-red-100 rounded-2xl font-black text-xs transition-all hover:bg-red-50 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                                                        disabled={cancelMutation.isPending}
                                                    >
                                                        <XCircle size={16} />
                                                        {cancelMutation.isPending ? "CANCELLING..." : "CANCEL REDEMPTION"}
                                                    </button>
                                                )}

                                                {selectedRedemption.status === 'delivered' && (
                                                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                                                        <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
                                                        <p className="text-emerald-800 font-black text-sm tracking-tight uppercase">Successfully Fulfilled</p>
                                                    </div>
                                                )}

                                                {selectedRedemption.status === 'cancelled' && (
                                                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-center">
                                                        <XCircle size={24} className="mx-auto text-red-600 mb-2" />
                                                        <p className="text-red-800 font-black text-sm tracking-tight uppercase">Cancelled</p>
                                                        <p className="text-[10px] text-red-600 font-bold mt-1">
                                                            Points have been reverted to user.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                        <Info size={32} />
                                    </div>
                                    <h3 className="text-slate-900 font-black mb-1">No Claim Selected</h3>
                                    <p className="text-slate-400 text-sm font-medium">Click on a redemption claim in the list to view full details and take action.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'leaderboard' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Agent / Identity</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Total Lifetime Pts</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Redeemed</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Unredeemed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLeaderboard.map((u: any, index: number) => (
                                    <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="min-w-8 font-black text-slate-300 italic">{index + 1}</div>
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{u.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{u.role.replace('_', ' ')}</span>
                                                        {u.identifier && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                <span className="text-xs font-bold text-indigo-600">{u.identifier}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-black bg-slate-100 text-slate-700">
                                                {u.total_points}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-emerald-600">{u.redeemed_points}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-amber-600">{u.unredeemed_points}</span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLeaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                                            No agents have accumulated points yet.
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
};
