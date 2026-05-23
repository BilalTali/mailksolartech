import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Users, CheckCircle, XCircle, Clock, Phone,
    Eye, X, Plus, Shield, ShieldCheck, UserCheck, Edit, UserPlus2, Link2
} from 'lucide-react';
import api from '@/services/axios';
import { adminEnumeratorApi } from '@/services/enumerator.api';
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
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────
export default function AdminEnumeratorsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [detailEnum, setDetailEnum] = useState<User | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editEnum, setEditEnum] = useState<User | null>(null);
    const [assignEnum, setAssignEnum] = useState<User | null>(null);
    const [assignParentId, setAssignParentId] = useState<string>('');
    const [saSearch, setSaSearch] = useState('');
    
    const [createForm, setCreateForm] = useState({
        name: '', mobile: '', email: '',
        offer_point_threshold: 10,
    });

    const [editForm, setEditForm] = useState({
        name: '', mobile: '', email: '',
        offer_point_threshold: 10,
        status: 'active'
    });

    const qc = useQueryClient();

    const editMut = useMutation({
        mutationFn: ({ id, form }: { id: number; form: typeof editForm }) => 
            adminEnumeratorApi.update(id, form),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-enumerators'] });
            toast.success('Enumerator updated successfully');
            setEditEnum(null);
            if (detailEnum?.id === editEnum?.id) {
                setDetailEnum(null); // Close or refresh details
            }
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update enumerator.';
            toast.error(msg);
        }
    });

    // ── Fetch super agents for assign dropdown ──────────────────────────
    const { data: saData } = useQuery<any>({
        queryKey: ['admin-super-agents-list'],
        queryFn: () => api.get('/admin/super-agents', { params: { per_page: 100 } }).then(r => r.data),
    });
    const superAgents: any[] = saData?.data?.data ?? [];

    // ── Assign mutation ──────────────────────────────────────────────────
    const assignMut = useMutation({
        mutationFn: ({ id, parentId }: { id: number; parentId: number }) =>
            adminEnumeratorApi.assign(id, parentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-enumerators'] });
            toast.success('Enumerator assigned successfully.');
            setAssignEnum(null);
            setAssignParentId('');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to assign enumerator.';
            toast.error(msg);
        }
    });

    // ── Fetch enumerators ───────────────────────────────────────────────
    const { data, isLoading } = useQuery<ApiResponse<User[]>>({
        queryKey: ['admin-enumerators'],
        queryFn: () => adminEnumeratorApi.list(),
    });

    let enumerators: User[] = data?.data ?? [];
    
    // Client-side filtering
    if (search) {
        const s = search.toLowerCase();
        enumerators = enumerators.filter(e => 
            e.name.toLowerCase().includes(s) || 
            e.mobile.includes(s) || 
            (e.enumerator_id && e.enumerator_id.toLowerCase().includes(s))
        );
    }
    if (statusFilter) {
        enumerators = enumerators.filter(e => e.status === statusFilter);
    }

    // ── Status mutation ──────────────────────────────────────────────────
    const statusMut = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminEnumeratorApi.updateStatus(id, status),
        onSuccess: (_r, vars) => {
            qc.invalidateQueries({ queryKey: ['admin-enumerators'] });
            toast.success(`Enumerator ${vars.status === 'active' ? 'activated' : 'deactivated'} successfully`);
            if (detailEnum?.id === vars.id) {
                setDetailEnum((prev) => prev ? { ...prev, status: vars.status as any } : null);
            }
        },
        onError: () => toast.error('Failed to update enumerator status.'),
    });

    // ── Create mutation ──────────────────────────────────────────────────
    const createMut = useMutation({
        mutationFn: (data: typeof createForm) => adminEnumeratorApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-enumerators'] });
            toast.success('Enumerator created successfully. Leads from this enumerator will route directly to you (Admin).');
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

    const isMutating = statusMut.isPending || createMut.isPending || assignMut.isPending;

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Enumerators</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage all enumerators across the system. Create admin-level enumerators directly.
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
                                {['Enumerator ID', 'Name', 'Mobile', 'Created By', 'Status', 'Registered', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Loading…</td></tr>
                            ) : enumerators.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
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
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {enumr.enumerator_creator_role === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">
                                                    <Shield size={11} /> Admin Direct
                                                </span>
                                            ) : enumr.enumerator_creator_role === 'super_agent' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded font-medium border border-orange-200">
                                                    <ShieldCheck size={11} /> SA: {enumr.created_by?.name || 'Unknown'}
                                                </span>
                                            ) : enumr.enumerator_creator_role === 'agent' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                                                    <UserCheck size={11} /> Agent: {enumr.created_by?.name || 'Unknown'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium border border-purple-200 font-semibold">
                                                    <UserPlus2 size={11} /> Public (Unassigned)
                                                </span>
                                            )}
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
                                                <button
                                                    onClick={() => {
                                                        setEditEnum(enumr);
                                                        setEditForm({
                                                            name: enumr.name,
                                                            mobile: enumr.mobile,
                                                            email: enumr.email ?? '',
                                                            offer_point_threshold: enumr.offer_point_threshold ?? 10,
                                                            status: enumr.status
                                                        });
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 rounded-lg px-2 py-1 transition-colors bg-indigo-50/30"
                                                >
                                                    <Edit size={12} /> Edit
                                                </button>
                                                {(enumr.enumerator_creator_role !== 'super_agent' && enumr.enumerator_creator_role !== 'agent') && (
                                                    <button
                                                        onClick={() => {
                                                            setAssignEnum(enumr);
                                                            setAssignParentId('');
                                                        }}
                                                        disabled={isMutating}
                                                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-300 rounded-lg px-2 py-1 transition-colors bg-purple-50/30 disabled:opacity-50"
                                                    >
                                                        <UserPlus2 size={12} /> Assign
                                                    </button>
                                                )}
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
                                <Shield size={16} className="text-slate-600" />
                                Add Admin Enumerator
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
                                <strong>Note:</strong> Enumerators created here belong directly to the Admin pool. Any leads they submit will bypass normal agent verification and come straight to your dashboard.
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
                                    label="Mobile Number"
                                    value={createForm.mobile}
                                    onChange={(val) => setCreateForm({ ...createForm, mobile: val })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
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
                                <p className="text-xs text-slate-400 mt-1">First <strong>{createForm.offer_point_threshold}</strong> points this enumerator earns go to Admin. Set 0 to give all points directly to the enumerator.</p>
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
                                            ['Father\'s Name', detailEnum.father_name ?? '—'],
                                            ['DOB', detailEnum.dob ? fmt(detailEnum.dob) : '—'],
                                            ['Blood Group', detailEnum.blood_group ?? '—'],
                                            ['Gender', detailEnum.gender ?? '—'],
                                            ['Marital Status', detailEnum.marital_status ?? '—'],
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

                                            ['Email', detailEnum.email ?? '—'],
                                            ['State', detailEnum.state ?? '—'],
                                            ['District', detailEnum.district ?? '—'],
                                            ['Area', detailEnum.area ?? '—'],
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
                                            ['Total Leads', detailEnum.total_leads?.toString() || '0'],
                                            ['Created By', detailEnum.created_by?.name || 'Unknown'],
                                            ['Creator Role', detailEnum.enumerator_creator_role?.replace('_', ' ').toUpperCase() || '—'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex justify-between items-start gap-2 py-2">
                                                <span className="text-sm text-slate-500 shrink-0 w-28">{label}</span>
                                                <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editEnum && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Edit size={16} className="text-slate-600" />
                                Edit Enumerator
                            </h3>
                            <button
                                onClick={() => setEditEnum(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); editMut.mutate({ id: editEnum.id, form: editForm }); }} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm transition-shadow"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <MobileInput
                                    label="Mobile Number *"
                                    value={editForm.mobile}
                                    onChange={(val) => setEditForm({ ...editForm, mobile: val })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
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
                                    value={editForm.offer_point_threshold}
                                    onChange={e => setEditForm({ ...editForm, offer_point_threshold: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm transition-shadow"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm transition-shadow"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditEnum(null)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editMut.isPending || !editForm.name || editForm.mobile.length !== 10}
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {editMut.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {assignEnum && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus2 size={18} className="text-purple-600" />
                                Assign to Super Agent
                            </h3>
                            <button
                                onClick={() => { setAssignEnum(null); setSaSearch(''); }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 overflow-y-auto space-y-4">
                            <div className="bg-purple-50 border border-purple-100 text-purple-900 rounded-lg p-3 text-xs leading-relaxed">
                                You are assigning <strong>{assignEnum.name}</strong> ({assignEnum.mobile}) to a Super Agent. Future leads submitted by this enumerator will be managed by the selected Super Agent.
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={saSearch}
                                    onChange={(e) => setSaSearch(e.target.value)}
                                    placeholder="Search Super Agents by name, code..."
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-shadow"
                                />
                            </div>

                            {/* Super Agent List */}
                            <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                                {(() => {
                                    const filtered = superAgents.filter((sa: any) =>
                                        sa.name.toLowerCase().includes(saSearch.toLowerCase()) ||
                                        (sa.super_agent_code && sa.super_agent_code.toLowerCase().includes(saSearch.toLowerCase())) ||
                                        sa.mobile.includes(saSearch)
                                    );

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                No Super Agents found matching "{saSearch}"
                                            </div>
                                        );
                                    }

                                    return filtered.map((sa: any) => {
                                        const isSelected = assignParentId === sa.id.toString();
                                        return (
                                            <button
                                                key={sa.id}
                                                type="button"
                                                onClick={() => setAssignParentId(sa.id.toString())}
                                                className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-slate-50 ${
                                                    isSelected ? 'bg-purple-50 hover:bg-purple-50 border-l-4 border-purple-600 pl-3' : ''
                                                }`}
                                            >
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{sa.name}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                        <Phone size={10} /> {sa.mobile}
                                                    </p>
                                                </div>
                                                {sa.super_agent_code && (
                                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                                        isSelected ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {sa.super_agent_code}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50 shrink-0">
                            <button
                                type="button"
                                onClick={() => { setAssignEnum(null); setSaSearch(''); }}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => assignMut.mutate({ id: assignEnum.id, parentId: parseInt(assignParentId) })}
                                disabled={assignMut.isPending || !assignParentId}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-1.5"
                            >
                                {assignMut.isPending ? 'Assigning...' : (
                                    <>
                                        <Link2 size={16} />
                                        Confirm Assignment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
