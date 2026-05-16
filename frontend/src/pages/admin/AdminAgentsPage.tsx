import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Search, Users, CheckCircle, XCircle, Clock, Phone, MapPin,
    ChevronLeft, ChevronRight, X, UserCheck, UserX, Link2, Unlink,
    Edit2, Save, QrCode
} from 'lucide-react';
import { agentsApi } from '@/services/agents.api';
import { adminSuperAgentApi } from '@/services/adminSuperAgent.api';
import toast from 'react-hot-toast';
import type { User, PaginatedResponse, ApiResponse } from '@/types';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import QrCodePreview from '@/components/shared/QrCodePreview';
import QrScanHistory from '@/components/shared/QrScanHistory';
import MobileInput from '@/components/shared/MobileInput';
import { INDIAN_STATES, STATE_DISTRICTS } from '@/constants/locationData';
import { List } from 'react-window';

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
export default function AdminAgentsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [detailAgent, setDetailAgent] = useState<User | null>(null);
    const [selectedSA, setSelectedSA] = useState<number | ''>('');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', mobile: '', email: '', district: '', state: '', area: '',
        father_name: '', dob: '', blood_group: ''
    });

    const qc = useQueryClient();

    // ── Fetch agents ────────────────────────────────────────────────────
    const { data, isLoading } = useQuery<ApiResponse<PaginatedResponse<User>>>({
        queryKey: ['admin-agents', search, statusFilter, page],
        queryFn: () => agentsApi.getAdminAgents({
            search: search || undefined,
            status: statusFilter || undefined,
            page,
            per_page: 100, // Higher per-page for virtualization
        }),
    });

    // ── Fetch super agents (for dropdown) ───────────────────────────────
    const { data: saData } = useQuery({
        queryKey: ['admin-super-agents-list'],
        queryFn: () => adminSuperAgentApi.getSuperAgents({ per_page: 100, status: 'active' }),
        staleTime: 30_000,
    });
    // @ts-ignore: Temporary fix for saData structure
    const superAgents: User[] = (saData?.data?.data as unknown as User[]) ?? [];

    const agents: User[] = data?.data?.data ?? [];
    const lastPage = data?.data?.last_page ?? 1;
    const total = data?.data?.total ?? 0;

    // ── Status mutation ──────────────────────────────────────────────────
    const statusMut = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            agentsApi.updateAgentStatus(id, status),
        onSuccess: (_r, vars) => {
            qc.invalidateQueries({ queryKey: ['admin-agents'] });
            toast.success(`Business Development Executive ${vars.status === 'active' ? 'approved' : 'status updated'} successfully`);
            if (detailAgent?.id === vars.id) setDetailAgent(null);
        },
        onError: () => toast.error('Failed to update agent status.'),
    });

    // ── Assign mutation ──────────────────────────────────────────────────
    const assignMut = useMutation({
        mutationFn: ({ superAgentId, agentId }: { superAgentId: number; agentId: number }) =>
            adminSuperAgentApi.assignAgent(superAgentId, agentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-agents'] });
            toast.success('Business Development Executive assigned to Business Development Manager successfully');
            setDetailAgent(null);
            setSelectedSA('');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? 'Assignment failed.';
            toast.error(msg);
        },
    });

    // ── Unassign mutation ────────────────────────────────────────────────
    const unassignMut = useMutation({
        mutationFn: ({ superAgentId, agentId }: { superAgentId: number; agentId: number }) =>
            adminSuperAgentApi.unassignAgent(superAgentId, agentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-agents'] });
            toast.success('Business Development Executive unassigned from Business Development Manager');
            setDetailAgent(null);
        },
        onError: () => toast.error('Failed to unassign agent.'),
    });

    // ── Edit mutation ────────────────────────────────────────────────────
    const editMut = useMutation({
        mutationFn: (data: Record<string, unknown>) => agentsApi.updateAgent(detailAgent!.id, data),
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: ['admin-agents'] });
            toast.success('Agent updated');
            setDetailAgent(res.data);
            setEditing(false);
        },
        onError: () => toast.error('Failed to update agent.'),
    });

    const startEdit = () => {
        if (!detailAgent) return;
        setEditForm({
            name: detailAgent.name ?? '',
            mobile: detailAgent.mobile ?? '',
            email: detailAgent.email ?? '',

            district: detailAgent.district ?? '',
            state: detailAgent.state ?? '',
            area: detailAgent.area ?? '',
            father_name: (detailAgent as any).father_name ?? '',
            dob: (detailAgent as any).dob ? (detailAgent as any).dob.split('T')[0] : '',
            blood_group: (detailAgent as any).blood_group ?? ''
        });
        setEditing(true);
    };

    const isMutating = statusMut.isPending || assignMut.isPending || unassignMut.isPending;

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Business Development Executives</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage agent registrations, approvals &amp; super-agent assignments
                        {total > 0 && <span className="ml-1 text-slate-400">({total} total)</span>}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, agent ID…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-72"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                                {['Business Development Executive ID', 'Name', 'Mobile', 'Location', 'Business Development Manager', 'Status', 'Registered', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={8} className="text-center py-12 text-slate-400">Loading Business Development Executives…</td></tr>
                            ) : agents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12">
                                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-400 text-sm">No Business Development Executives found{search || statusFilter ? ' matching your filters' : ''}.</p>
                                    </td>
                                </tr>
                            ) : (
                                <tr className="contents">
                                    <td colSpan={8} className="p-0">
                                        <List<object>
                                            style={{ height: 600, width: '100%' }}
                                            rowCount={agents.length}
                                            rowHeight={60}
                                            rowProps={{}}
                                            rowComponent={({ index, style }: { index: number, style: React.CSSProperties }) => {
                                                const agent = agents[index];
                                                return (
                                                    <div 
                                                        style={{...style, display: 'flex', borderBottom: '1px solid #f1f5f9'}}
                                                        className="hover:bg-slate-50 cursor-pointer transition-colors group px-4 py-3 items-center"
                                                        onClick={() => navigate(`/admin/agents/${agent.id}`)}
                                                    >
                                                        <div className="w-[150px] shrink-0">
                                                            {agent.agent_id
                                                                ? <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{agent.agent_id}</span>
                                                                : <span className="text-xs text-slate-400 italic">Pending</span>
                                                            }
                                                        </div>
                                                        <div className="w-[200px] shrink-0 font-medium text-slate-800 truncate">{agent.name}</div>
                                                        <div className="w-[150px] shrink-0 text-slate-600 truncate flex items-center gap-1">
                                                            <Phone size={12} className="text-slate-400" />
                                                            {agent.mobile}
                                                        </div>
                                                        <div className="w-[250px] shrink-0 text-slate-600 truncate flex items-center gap-1">
                                                            <MapPin size={12} className="text-slate-400" />
                                                            {[agent.district, agent.state].filter(Boolean).join(', ') || '—'}
                                                        </div>
                                                        <div className="w-[200px] shrink-0">
                                                            {agent.super_agent ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 font-bold uppercase tracking-tight">
                                                                    {agent.super_agent.name}
                                                                </span>
                                                            ) : <span className="text-xs text-slate-400 italic">Unassigned</span>}
                                                        </div>
                                                        <div className="w-[120px] shrink-0">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${STATUS_BADGE[agent.status]}`}>
                                                                {STATUS_ICON[agent.status]}
                                                                {agent.status}
                                                            </span>
                                                        </div>
                                                        <div className="w-[120px] shrink-0 text-slate-500 text-[10px] whitespace-nowrap">
                                                            {fmt(agent.created_at)}
                                                        </div>
                                                        <div className="flex-1 flex justify-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDetailAgent(agent); setSelectedSA(''); }}
                                                                className="text-xs text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 transition-colors"
                                                            >
                                                                VIEW
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Page {page} of {lastPage}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Business Development Executive Detail Side Panel
            ══════════════════════════════════════════════════════════════ */}
            {detailAgent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setDetailAgent(null)}>
                    <div
                        className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Panel Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit' : 'Business Development Executive'} Details</h2>
                            <div className="flex items-center gap-2">
                                {!editing && (
                                    <button onClick={startEdit} className="p-2 text-slate-400 hover:text-orange-500 transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                <button onClick={() => { setDetailAgent(null); setEditing(false); }} className="p-2 text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {editing ? (
                                <form
                                    className="px-6 py-5 space-y-4"
                                    onSubmit={e => { e.preventDefault(); editMut.mutate(editForm as Record<string, unknown>); }}
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                                            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" required />
                                        </div>
                                        <div className="col-span-2">
                                            <MobileInput
                                                label="Mobile"
                                                value={editForm.mobile}
                                                onChange={(val) => setEditForm({ ...editForm, mobile: val })}
                                                required
                                            />

                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                                            <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                        </div>

                                        {/* iCard Specific Fields */}
                                        <div className="col-span-2 pt-2 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-3">iCard Required Information</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Father's Name</label>
                                            <input type="text" value={editForm.father_name} onChange={e => setEditForm({ ...editForm, father_name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="S/o or D/o Name" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date of Birth</label>
                                            <input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Blood Group</label>
                                            <select value={editForm.blood_group} onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                                                <option value="">Select...</option>
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                            </select>
                                        </div>

                                        <div className="col-span-2 pt-2 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Location Details</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">State</label>
                                            <select
                                                value={editForm.state}
                                                onChange={e => setEditForm({ ...editForm, state: e.target.value, district: '' })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            >
                                                <option value="">Select State</option>
                                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">District</label>
                                            <select
                                                value={editForm.district}
                                                onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                disabled={!editForm.state}
                                            >
                                                <option value="">Select District</option>
                                                {editForm.state && STATE_DISTRICTS[editForm.state]?.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Area</label>
                                            <input type="text" value={editForm.area} onChange={e => setEditForm({ ...editForm, area: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                                        <button type="submit" disabled={editMut.isPending} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                            <Save size={16} /> {editMut.isPending ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="px-6 py-5 space-y-6">
                                    {/* Avatar + status */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                            {detailAgent.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-base leading-snug">{detailAgent.name}</p>
                                            {detailAgent.agent_id && (
                                                <p className="font-mono text-xs text-blue-700">{detailAgent.agent_id}</p>
                                            )}
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize mt-1 ${STATUS_BADGE[detailAgent.status]}`}>
                                                {STATUS_ICON[detailAgent.status]}
                                                {detailAgent.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info rows */}
                                    <div className="divide-y divide-slate-50">
                                        {([
                                            ['Mobile', detailAgent.mobile],

                                            ['Email', detailAgent.email ?? '—'],
                                            ['Father\'s Name', (detailAgent as any).father_name ?? '—'],
                                            ['DOB', (detailAgent as any).dob ? fmt((detailAgent as any).dob) : '—'],
                                            ['Blood Group', (detailAgent as any).blood_group ?? '—'],
                                            ['State', detailAgent.state ?? '—'],
                                            ['District', detailAgent.district ?? '—'],
                                            ['Area', detailAgent.area ?? '—'],
                                            ['Occupation', detailAgent.occupation ?? '—'],
                                            ['Registered', fmt(detailAgent.created_at)],
                                            ['Last Login', detailAgent.last_login_at ? fmt(detailAgent.last_login_at) : 'Never'],
                                        ] as [string, string][]).map(([label, value]) => (
                                            <div key={label} className="flex justify-between items-start gap-2 py-2">
                                                <span className="text-sm text-slate-500 shrink-0 w-28">{label}</span>
                                                <span className="text-sm font-medium text-slate-800 text-right break-all">{value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── Business Development Manager Assignment Section ── */}
                                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                                            <Link2 size={14} className="text-orange-500" />
                                            <span className="text-sm font-semibold text-slate-700">Business Development Manager Assignment</span>
                                        </div>

                                        <div className="px-4 py-4 space-y-4">
                                            {/* Current assignment */}
                                            {detailAgent.super_agent ? (
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-0.5">Currently assigned to</p>
                                                        <p className="font-semibold text-slate-800 text-sm">{detailAgent.super_agent.name}</p>
                                                        <p className="font-mono text-xs text-orange-600">{detailAgent.super_agent.super_agent_code}</p>
                                                        <p className="text-xs text-slate-500">{detailAgent.super_agent.mobile}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => unassignMut.mutate({
                                                            superAgentId: detailAgent.super_agent_id!,
                                                            agentId: detailAgent.id,
                                                        })}
                                                        disabled={isMutating}
                                                        className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 shrink-0"
                                                    >
                                                        <Unlink size={12} />
                                                        {unassignMut.isPending ? 'Removing…' : 'Unassign'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-500 italic">Not assigned to any Business Development Manager</p>
                                            )}

                                            {/* Assign / Reassign */}
                                            <div>
                                                <p className="text-xs font-medium text-slate-600 mb-2">
                                                    {detailAgent.super_agent ? 'Reassign to another Business Development Manager' : 'Assign to a Business Development Manager'}
                                                </p>
                                                {detailAgent.status !== 'active' && (
                                                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                                        ⚠️ Business Development Executive must be <strong>Active</strong> before assigning to a Business Development Manager.
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <select
                                                        value={selectedSA}
                                                        onChange={e => setSelectedSA(e.target.value ? Number(e.target.value) : '')}
                                                        disabled={detailAgent.status !== 'active' || superAgents.length === 0}
                                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                                                    >
                                                        <option value="">Select Business Development Manager…</option>
                                                        {superAgents.map(sa => (
                                                            <option key={sa.id} value={sa.id}>
                                                                {sa.name} ({sa.super_agent_code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            if (!selectedSA) return;
                                                            assignMut.mutate({ superAgentId: selectedSA as number, agentId: detailAgent.id });
                                                        }}
                                                        disabled={!selectedSA || isMutating || detailAgent.status !== 'active'}
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                                    >
                                                        <UserCheck size={13} />
                                                        {assignMut.isPending ? 'Assigning…' : 'Assign'}
                                                    </button>
                                                </div>
                                                {superAgents.length === 0 && detailAgent.status === 'active' && (
                                                    <p className="text-xs text-slate-400 mt-1">No active Business Development Managers available to assign.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── QR Code & Verification ── */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <QrCode size={16} className="text-orange-500" />
                                            Verification System
                                        </h3>
                                        <QrCodePreview
                                            user={detailAgent}
                                            isAdminView={true}
                                            onRegenerated={(updated) => {
                                                setDetailAgent(updated);
                                                qc.invalidateQueries({ queryKey: ['admin-agents'] });
                                            }}
                                        />
                                        <div className="mt-4">
                                            <QrScanHistory
                                                userId={detailAgent.id}
                                                role="agent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky action buttons */}
                        <div className="px-6 py-4 border-t border-slate-100 flex flex-col gap-3 sticky bottom-0 bg-white">
                            {!editing && (
                                <>
                                    {detailAgent.status === 'pending' && (
                                        <button
                                            onClick={() => statusMut.mutate({ id: detailAgent.id, status: 'active' })}
                                            disabled={isMutating}
                                            className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle size={16} />
                                            {statusMut.isPending ? 'Approving…' : 'Approve Business Development Executive'}
                                        </button>
                                    )}
                                    {detailAgent.status === 'active' && (
                                        <button
                                            onClick={() => statusMut.mutate({ id: detailAgent.id, status: 'inactive' })}
                                            disabled={isMutating}
                                            className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <UserX size={16} />
                                            {statusMut.isPending ? 'Deactivating…' : 'Deactivate Business Development Executive'}
                                        </button>
                                    )}
                                    {detailAgent.status === 'inactive' && (
                                        <button
                                            onClick={() => statusMut.mutate({ id: detailAgent.id, status: 'active' })}
                                            disabled={isMutating}
                                            className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle size={16} />
                                            {statusMut.isPending ? 'Reactivating…' : 'Reactivate Business Development Executive'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDetailAgent(null)}
                                        className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <DownloadIdCardButton userId={detailAgent.id} variant="button" className="w-full" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
