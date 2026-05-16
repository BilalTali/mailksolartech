import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/services/offers.api';
import { SuperAgentAbsorbedPoint } from '@/types';
import {
    Inbox, Clock, CheckCircle2, AlertCircle,
    Gift, Filter, Search, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { clsx } from 'clsx';

export const AdminAbsorptionsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<'unclaimed' | 'claimed' | 'delivered' | ''>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPoint, setSelectedPoint] = useState<SuperAgentAbsorbedPoint | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    const { data: absorbedPointsResp, isLoading } = useQuery({
        queryKey: ['admin-absorbed-points'],
        queryFn: offersApi.admin.getAbsorbedPoints
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }: { id: number, notes?: string }) =>
            offersApi.admin.approveAbsorption(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-absorbed-points'] });
            toast.success('Absorption approved and marked as delivered');
            setSelectedPoint(null);
        }
    });

    const points = (absorbedPointsResp?.data as SuperAgentAbsorbedPoint[]) || [];
    const filtered = points.filter(p => {
        const matchesStatus = !statusFilter || p.status === statusFilter;
        const matchesSearch = !searchTerm ||
            p.super_agent?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.offer?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.source_agent?.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (isLoading) return <LoadingSpinner />;

    const getUserRoleLabel = (user: any) => {
        if (!user) return 'Beneficiary';
        if (user.role === 'admin' || user.role === 'super_admin') return 'Admin';
        if (user.role === 'super_agent') return 'Super Agent';
        return 'Beneficiary';
    };

    return (
        <div className="p-6">
            <SEOHead title="Absorbed Points Management | Admin" />

            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Absorbed Points</h1>
                <p className="text-slate-500 font-medium">Manage points transferred to Super Agents from expired agent offers</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by SA, Agent or Offer..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <select
                        className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="">All Statuses</option>
                        <option value="unclaimed">Unclaimed (Floating)</option>
                        <option value="claimed">Claimed (Pending Admin)</option>
                        <option value="delivered">Delivered / Approved</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {filtered.map((p: SuperAgentAbsorbedPoint) => (
                        <div
                            key={p.id}
                            onClick={() => { setSelectedPoint(p); setAdminNotes(p.admin_notes || ''); }}
                            className={clsx(
                                "group bg-white p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden",
                                selectedPoint?.id === p.id ? "border-indigo-600 ring-4 ring-indigo-50" : "border-slate-100 hover:border-slate-200"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                        p.status === 'unclaimed' ? "bg-slate-100 text-slate-400" :
                                            p.status === 'claimed' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        {p.status === 'delivered' ? <CheckCircle2 size={24} /> : <Inbox size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 leading-tight mb-1">{p.offer?.title}</h3>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-500">
                                                {getUserRoleLabel(p.super_agent)}: <span className="text-indigo-600 font-black">{p.super_agent?.name || 'Unassigned (Global Pool)'}</span>
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                <span>From: {p.source_agent?.name}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-slate-800">{p.absorbed_points} Pts</span>
                                                {p.lead && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-indigo-500 font-black">Lead: {p.lead.customer_name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight border capitalize",
                                        p.status === 'unclaimed' ? "bg-slate-50 text-slate-400" :
                                            p.status === 'claimed' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>
                                        {p.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {format(new Date(p.absorbed_at), 'dd MMM yyyy')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="bg-slate-50 p-20 rounded-[40px] border-2 border-dashed border-slate-100 text-center">
                            <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-500 font-bold italic">No absorbed points found</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                        {selectedPoint ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="p-6 bg-slate-900 text-white">
                                    <h2 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                                        <Gift size={20} className="text-amber-400" />
                                        Absorption Details
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailItem label="Source Agent" value={selectedPoint.source_agent?.name} />
                                        <DetailItem label={getUserRoleLabel(selectedPoint.super_agent)} value={selectedPoint.super_agent?.name || 'System (Global Pool)'} />
                                        <DetailItem label="Points" value={selectedPoint.absorbed_points.toString()} />
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-white/50 font-black uppercase tracking-widest leading-none mb-1.5">Reason</p>
                                            <span className={clsx(
                                                "text-xs font-bold px-2 py-1 rounded-lg w-fit",
                                                selectedPoint.absorption_reason === 'enumerator_absorption' ? "bg-indigo-500 text-white" : "text-white"
                                            )}>
                                                {selectedPoint.absorption_reason.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {selectedPoint.lead && <DetailItem label="Lead" value={`${selectedPoint.lead.customer_name} (${selectedPoint.lead.system_capacity})`} />}
                                    </div>
                                </div>

                                <div className="p-6 flex-grow space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Notes (visible to SA)</label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Add notes about delivery or confirmation..."
                                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
                                            rows={4}
                                        />
                                    </div>

                                    {selectedPoint.status === 'claimed' ? (
                                        <button
                                            onClick={() => approveMutation.mutate({ id: selectedPoint.id, notes: adminNotes })}
                                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm transition-all hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                            disabled={approveMutation.isPending}
                                        >
                                            {approveMutation.isPending ? "PROCESSING..." : "APPROVE & DELIVER"}
                                            {!approveMutation.isPending && <ChevronRight size={18} />}
                                        </button>
                                    ) : selectedPoint.status === 'delivered' ? (
                                        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center">
                                            <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-3" />
                                            <p className="text-emerald-800 font-black text-sm uppercase tracking-tight">Reward Delivered</p>
                                            <p className="text-[10px] text-emerald-600 font-bold mt-1">Confirmed by Admin on {format(new Date(selectedPoint.delivered_at!), 'dd MMM yyyy')}</p>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                                            <Clock size={32} className="mx-auto text-slate-300 mb-3" />
                                            <p className="text-slate-500 font-black text-sm uppercase tracking-tight">Floating Points</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1">Super Agent hasn't claimed this yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center p-10 text-center text-slate-300">
                                <Inbox size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">Select a record to manage</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value }: { label: string, value?: string }) => (
    <div>
        <p className="text-[10px] text-white/50 font-black uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-sm font-bold text-white leading-tight truncate">{value || 'N/A'}</p>
    </div>
);
export default AdminAbsorptionsPage;
