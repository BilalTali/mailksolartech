import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Users, CheckCircle, XCircle, Clock, Phone,
    Eye, X, Plus, UserCheck
} from 'lucide-react';
import { agentEnumeratorApi } from '@/services/enumerator.api';
import toast from 'react-hot-toast';
import type { User, ApiResponse } from '@/types';
import MobileInput from '@/components/shared/MobileInput';

// ── helpers ──────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
};
const STATUS_ICON: Record<string, React.ReactNode> = {
    active: <CheckCircle size={12} />,
    inactive: <XCircle size={12} />,
    pending: <Clock size={12} />,
};
function fmt(iso: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────
export default function AgentEnumeratorsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [detailEnum, setDetailEnum] = useState<User | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const [createForm, setCreateForm] = useState({
        name: '', mobile: '', email: '',
        offer_point_threshold: 10,
    });

    const qc = useQueryClient();

    // ── Fetch enumerators ───────────────────────────────────────────────
    const { data, isLoading } = useQuery<ApiResponse<User[]>>({
        queryKey: ['agent-enumerators'],
        queryFn: () => agentEnumeratorApi.list(),
    });

    let enumerators: User[] = data?.data ?? [];
    
    // Client-side filtering
    if (search) {
        const s = search.toLowerCase();
        enumerators = enumerators.filter(e => 
            e.name?.toLowerCase().includes(s) || 
            e.mobile?.includes(s) || 
            (e.enumerator_id && e.enumerator_id.toLowerCase().includes(s))
        );
    }
    if (statusFilter) {
        enumerators = enumerators.filter(e => e.status === statusFilter);
    }

    // ── Status mutation ──────────────────────────────────────────────────
    const statusMut = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            agentEnumeratorApi.updateStatus(id, status),
        onSuccess: (_r, vars) => {
            qc.invalidateQueries({ queryKey: ['agent-enumerators'] });
            toast.success(`Enumerator ${vars.status === 'active' ? 'activated' : 'deactivated'} successfully`);
            if (detailEnum?.id === vars.id) {
                setDetailEnum((prev) => prev ? { ...prev, status: vars.status as any } : null);
            }
        },
        onError: () => toast.error('Failed to update enumerator status.'),
    });

    // ── Create mutation ──────────────────────────────────────────────────
    const createMut = useMutation({
        mutationFn: (data: typeof createForm) => agentEnumeratorApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['agent-enumerators'] });
            toast.success('Enumerator created successfully. Leads from this enumerator will be routed to you for verification.');
            setIsCreateModalOpen(false);
            setCreateForm({ name: '', mobile: '', email: '', offer_point_threshold: 10 });
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create enumerator.';
            toast.error(msg);
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMut.mutate(createForm);
    };

    const isMutating = statusMut.isPending || createMut.isPending;

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">My Enumerators</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage enumerators assigned directly to you.
                        {enumerators.length > 0 && <span className="ml-1 text-slate-400">({enumerators.length} total)</span>}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Create Enumerator
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 w-72"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Enumerator ID', 'Name', 'Mobile', 'Status', 'Registered', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
                            ) : enumerators.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-400 text-sm">No enumerators found{search || statusFilter ? ' matching your filters' : ''}.</p>
                                    </td>
                                </tr>
                            ) : (
                                enumerators.map((enumr: any) => (
                                    <tr key={enumr.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            {enumr.enumerator_id
                                                ? <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{enumr.enumerator_id}</span>
                                                : <span className="text-xs text-slate-400 italic">Pending</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{enumr.name}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Phone size={12} className="text-slate-400" />
                                                {enumr.mobile}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[enumr.status]}`}>
                                                {STATUS_ICON[enumr.status]}
                                                {enumr.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {fmt(enumr.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => setDetailEnum(enumr)}
                                                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 transition-colors"
                                                >
                                                    <Eye size={12} /> View
                                                </button>
                                                {enumr.status === 'pending' && (
                                                    <button
                                                        onClick={() => statusMut.mutate({ id: enumr.id, status: 'active' })}
                                                        disabled={isMutating}
                                                        className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={12} /> Approve
                                                    </button>
                                                )}
                                                {enumr.status === 'active' && (
                                                    <button
                                                        onClick={() => statusMut.mutate({ id: enumr.id, status: 'inactive' })}
                                                        disabled={isMutating}
                                                        className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle size={12} /> Deact
                                                    </button>
                                                )}
                                                {enumr.status === 'inactive' && (
                                                    <button
                                                        onClick={() => statusMut.mutate({ id: enumr.id, status: 'active' })}
                                                        disabled={isMutating}
                                                        className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={12} /> React
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Create Modal
            ══════════════════════════════════════════════════════════════ */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <UserCheck size={16} className="text-slate-600" />
                                Add Enumerator
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 mb-2 leading-relaxed">
                                <strong>Note:</strong> Enumerators you create will be attached to your account. You will receive their submitted leads for initial verification.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm transition-shadow"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <MobileInput
                                    label="Mobile Number *"
                                    value={createForm.mobile}
                                    onChange={(val) => setCreateForm({ ...createForm, mobile: val })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm transition-shadow"
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Point Absorption Threshold
                                    <span className="ml-1 text-slate-400 font-normal text-xs">(default 10)</span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={200}
                                    value={createForm.offer_point_threshold}
                                    onChange={e => setCreateForm({ ...createForm, offer_point_threshold: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm transition-shadow"
                                />
                                <p className="text-xs text-slate-400 mt-1">First <strong>{createForm.offer_point_threshold}</strong> points this enumerator earns go to you. Set 0 to give all points directly to the enumerator.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMut.isPending || !createForm.name || createForm.mobile.length !== 10}
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {createMut.isPending ? 'Creating...' : 'Create Enumerator'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Detail Panel
            ══════════════════════════════════════════════════════════════ */}
            {detailEnum && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setDetailEnum(null)}>
                    <div
                        className="bg-white w-full max-w-sm h-full overflow-y-auto shadow-xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Panel Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-slate-800">Enumerator Details</h2>
                            <button onClick={() => setDetailEnum(null)} className="p-2 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 px-6 py-5 overflow-y-auto space-y-6">
                            {/* Avatar + status */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                                    {detailEnum.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-base leading-snug">{detailEnum.name}</p>
                                    {detailEnum.enumerator_id && (
                                        <p className="font-mono text-xs text-indigo-700">{detailEnum.enumerator_id}</p>
                                    )}
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize mt-1 ${STATUS_BADGE[detailEnum.status]}`}>
                                        {STATUS_ICON[detailEnum.status]}
                                        {detailEnum.status}
                                    </span>
                                </div>
                            </div>

                            {/* Info rows */}
                            <div className="space-y-4">
                                <section>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Information</p>
                                    <div className="divide-y divide-slate-50 border-t border-slate-50">
                                        {[
                                            ['Father\'s Name', (detailEnum as any).father_name ?? '—'],
                                            ['DOB', (detailEnum as any).dob ? fmt((detailEnum as any).dob) : '—'],
                                            ['Blood Group', (detailEnum as any).blood_group ?? '—'],
                                            ['Gender', (detailEnum as any).gender ?? '—'],
                                            ['Marital Status', (detailEnum as any).marital_status ?? '—'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex justify-between items-start gap-2 py-2">
                                                <span className="text-sm text-slate-500 shrink-0 w-28">{label}</span>
                                                <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contact & Location</p>
                                    <div className="divide-y divide-slate-50 border-t border-slate-50">
                                        {[
                                            ['Mobile', detailEnum.mobile],

                                            ['Email', (detailEnum as any).email ?? '—'],
                                            ['State', (detailEnum as any).state ?? '—'],
                                            ['District', (detailEnum as any).district ?? '—'],
                                            ['Area', (detailEnum as any).area ?? '—'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex justify-between items-start gap-2 py-2">
                                                <span className="text-sm text-slate-500 shrink-0 w-28">{label}</span>
                                                <span className="text-sm font-medium text-slate-800 text-right break-all">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">System Info</p>
                                    <div className="divide-y divide-slate-50 border-t border-slate-50">
                                        {[
                                            ['Registered', fmt(detailEnum.created_at)],
                                            ['Total Leads', (detailEnum as any).total_leads?.toString() || '0'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex justify-between items-start gap-2 py-2">
                                                <span className="text-sm text-slate-500 shrink-0 w-28">{label}</span>
                                                <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Quick Status Actions inside panel */}
                                <section>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Actions</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {detailEnum.status === 'pending' && (
                                            <button
                                                onClick={() => statusMut.mutate({ id: detailEnum.id, status: 'active' })}
                                                disabled={isMutating}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle size={13} /> Approve
                                            </button>
                                        )}
                                        {detailEnum.status === 'active' && (
                                            <button
                                                onClick={() => statusMut.mutate({ id: detailEnum.id, status: 'inactive' })}
                                                disabled={isMutating}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                            >
                                                <XCircle size={13} /> Deactivate
                                            </button>
                                        )}
                                        {detailEnum.status === 'inactive' && (
                                            <button
                                                onClick={() => statusMut.mutate({ id: detailEnum.id, status: 'active' })}
                                                disabled={isMutating}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle size={13} /> Reactivate
                                            </button>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
