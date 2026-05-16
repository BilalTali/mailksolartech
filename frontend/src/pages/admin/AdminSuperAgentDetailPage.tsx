import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Users, Star, Phone, MapPin, Mail, Activity,
    CheckCircle, XCircle, UserX, Edit2, Save, X, Unlink, Calendar, QrCode, Gift
} from 'lucide-react';
import { adminSuperAgentApi } from '@/services/adminSuperAgent.api';
import { offersApi } from '@/services/offers.api';
import toast from 'react-hot-toast';
import type { User } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import QrCodePreview from '@/components/shared/QrCodePreview';
import QrScanHistory from '@/components/shared/QrScanHistory';

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
};
function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Tab = 'overview' | 'team' | 'log' | 'offers';

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminSuperAgentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [tab, setTab] = useState<Tab>('overview');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', mobile: '', email: '', district: '', state: '', area: '',
        father_name: '', dob: '', blood_group: ''
    });

    // ── Fetch super agent detail ──────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['admin-sa-detail', id],
        queryFn: () => adminSuperAgentApi.getSuperAgentDetail(Number(id)),
        enabled: !!id,
    });
    const sa = data?.data as (User & { stats?: Record<string, unknown>; managed_agents?: User[] }) | undefined;

    // ── Fetch team agents ─────────────────────────────────────────────────────
    const { data: teamData, isLoading: teamLoading } = useQuery({
        queryKey: ['admin-sa-team', id],
        queryFn: () => adminSuperAgentApi.getSuperAgentTeam(Number(id)),
        enabled: !!id && tab === 'team',
    });
    const teamAgents: User[] = teamData?.data ?? [];

    // ── Fetch team log ────────────────────────────────────────────────────────
    const { data: logData, isLoading: logLoading } = useQuery({
        queryKey: ['admin-sa-log', id],
        queryFn: () => adminSuperAgentApi.getTeamLog(Number(id)),
        enabled: !!id && tab === 'log',
    });
    const logs = logData?.data?.data ?? [];

    // ── Fetch SA offers ───────────────────────────────────────────────────
    const { data: offersData, isLoading: offersLoading } = useQuery({
        queryKey: ['admin-sa-offers', id],
        queryFn: () => offersApi.admin.getAgentOffers(Number(id)),
        enabled: !!id && tab === 'offers',
    });
    const offers = offersData?.data ?? [];

    // ── Status mutation ───────────────────────────────────────────────────────
    const statusMut = useMutation({
        mutationFn: (status: 'active' | 'inactive') => adminSuperAgentApi.updateSuperAgentStatus(Number(id), status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-sa-detail', id] });
            toast.success('Status updated');
        },
        onError: () => toast.error('Failed to update status.'),
    });

    // ── Edit mutation ─────────────────────────────────────────────────────────
    const editMut = useMutation({
        mutationFn: (data: Record<string, unknown>) => adminSuperAgentApi.updateSuperAgent(Number(id), data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-sa-detail', id] });
            toast.success('Business Development Manager updated');
            setEditing(false);
        },
        onError: () => toast.error('Failed to update.'),
    });

    // ── Unassign agent mutation ───────────────────────────────────────────────
    const unassignMut = useMutation({
        mutationFn: (agentId: number) => adminSuperAgentApi.unassignAgent(Number(id), agentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-sa-team', id] });
            qc.invalidateQueries({ queryKey: ['admin-sa-detail', id] });
            toast.success('Business Development Executive unassigned');
        },
        onError: () => toast.error('Failed to unassign agent.'),
    });

    // ── Delete mutation ───────────────────────────────────────────────────────
    const deleteMut = useMutation({
        mutationFn: () => adminSuperAgentApi.deleteSuperAgent(Number(id)),
        onSuccess: () => {
            toast.success('Business Development Manager deleted');
            navigate('/admin/super-agents');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cannot delete.';
            toast.error(msg);
        },
    });

    const startEdit = () => {
        if (!sa) return;
        setEditForm({
            name: sa.name ?? '',
            mobile: sa.mobile ?? '',
            email: sa.email ?? '',

            district: sa.district ?? '',
            state: sa.state ?? '',
            area: sa.area ?? '',
            father_name: (sa as any).father_name ?? '',
            dob: (sa as any).dob ? (sa as any).dob.split('T')[0] : '',
            blood_group: (sa as any).blood_group ?? '',
        });
        setEditing(true);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center py-20 text-slate-400">Loading…</div>;
    }
    if (!sa) {
        return <div className="flex items-center justify-center py-20 text-slate-400">Business Development Manager not found.</div>;
    }

    const stats = sa.stats as any;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* ── Back + Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link to="/admin/super-agents" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
                        <ArrowLeft size={15} /> Back to Business Development Managers
                    </Link>
                    <h1 className="text-xl font-bold text-slate-800">{sa.name}</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-0.5">
                            {sa.super_agent_code}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[sa.status]}`}>
                            {sa.status === 'active' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                            {sa.status}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={startEdit}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                    <DownloadIdCardButton userId={sa.id} variant="button" className="!bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50" />
                    {sa.status === 'active' ? (
                        <button
                            onClick={() => statusMut.mutate('inactive')}
                            disabled={statusMut.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            <XCircle size={14} /> Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={() => statusMut.mutate('active')}
                            disabled={statusMut.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle size={14} /> Activate
                        </button>
                    )}
                    <button
                        onClick={() => { if (confirm('Delete this Business Development Manager? This cannot be undone.')) deleteMut.mutate(); }}
                        disabled={deleteMut.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <UserX size={14} /> Delete
                    </button>
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Team Size', value: sa.agent_count ?? 0, icon: <Users size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
                    {
                        label: 'Business Development Executive Payouts',
                        value: formatCurrency(
                            Number(stats?.commissions?.agent_pending ?? 0) +
                            Number(stats?.commissions?.agent_approved ?? 0) +
                            Number(stats?.commissions?.agent_paid ?? 0)
                        ),
                        icon: <Activity size={18} className="text-orange-500" />,
                        bg: 'bg-orange-50'
                    },
                    {
                        label: 'SA Overrides',
                        value: formatCurrency(
                            Number(stats?.commissions?.override_pending ?? 0) +
                            Number(stats?.commissions?.override_approved ?? 0) +
                            Number(stats?.commissions?.override_paid ?? 0)
                        ),
                        icon: <Star size={18} className="text-yellow-500" />,
                        bg: 'bg-yellow-50'
                    },
                    {
                        label: 'Total Commission',
                        value: formatCurrency(
                            Number(stats?.commissions?.agent_pending ?? 0) + Number(stats?.commissions?.override_pending ?? 0) +
                            Number(stats?.commissions?.agent_approved ?? 0) + Number(stats?.commissions?.override_approved ?? 0) +
                            Number(stats?.commissions?.agent_paid ?? 0) + Number(stats?.commissions?.override_paid ?? 0)
                        ),
                        icon: <CheckCircle size={18} className="text-green-500" />,
                        bg: 'bg-green-50'
                    },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>{card.icon}</div>
                        <div>
                            <p className="text-xs text-slate-500">{card.label}</p>
                            <p className="text-lg font-bold text-slate-800">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-slate-200">
                {([
                    ['overview', 'Overview'],
                    ['team', `Team (${sa.agent_count ?? 0})`],
                    ['log', 'Assignment Log'],
                    ['offers', 'Incentive Offers'],
                ] as [Tab, string][]).map(([key, lbl]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {lbl}
                    </button>
                ))}
            </div>

            {/* ══════════ TAB: OVERVIEW ══════════ */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Profile card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700">Profile</h3>
                        {([
                            [<Phone size={13} />, 'Mobile', sa.mobile],

                            [<Mail size={13} />, 'Email', sa.email ?? '—'],
                            [<Users size={13} />, 'Father\'s Name', (sa as any).father_name ?? '—'],
                            [<Calendar size={13} />, 'Date of Birth', (sa as any).dob ? fmt((sa as any).dob) : '—'],
                            [<Activity size={13} />, 'Blood Group', (sa as any).blood_group ?? '—'],
                            [<MapPin size={13} />, 'State', sa.state ?? '—'],
                            [<MapPin size={13} />, 'District', sa.district ?? '—'],
                            [<MapPin size={13} />, 'Area', sa.area ?? '—'],
                            [<Calendar size={13} />, 'Joined', fmt(sa.created_at)],
                            [<Activity size={13} />, 'Last Login', sa.last_login_at ? fmt(sa.last_login_at) : 'Never'],
                        ] as [React.ReactNode, string, string][]).map(([icon, lbl, val]) => (
                            <div key={lbl} className="flex gap-3 items-start py-1.5 border-b border-slate-50 last:border-0">
                                <span className="text-slate-400 shrink-0 mt-0.5">{icon}</span>
                                <span className="text-sm text-slate-500 w-24 shrink-0">{lbl}</span>
                                <span className="text-sm font-medium text-slate-800 break-all">{val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Managed states card */}
                    <div className="space-y-5">
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Managed States</h3>
                            {(Array.isArray(sa.managed_states) && sa.managed_states.length > 0)
                                ? (
                                    <div className="flex flex-wrap gap-2">
                                        {sa.managed_states.map((s: string) => (
                                            <span key={s} className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs font-medium">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No specific states assigned</p>
                                )
                            }
                        </div>

                        {/* QR Verification Card */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <QrCode size={16} className="text-orange-500" />
                                Dynamic QR Verification
                            </h3>
                            <QrCodePreview
                                user={sa}
                                isAdminView={true}
                                onRegenerated={(updated) => {
                                    qc.setQueryData(['admin-sa-detail', id], { ...data, data: updated });
                                    qc.invalidateQueries({ queryKey: ['admin-super-agents'] });
                                }}
                            />
                            <div className="mt-4">
                                <QrScanHistory userId={sa.id} role="super_agent" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ TAB: TEAM ══════════ */}
            {tab === 'team' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {['Business Development Executive ID', 'Name', 'Mobile', 'Location', 'Status', 'Total Leads', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {teamLoading ? (
                                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading team…</td></tr>
                                ) : teamAgents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10">
                                            <Users size={28} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-slate-400 text-sm">No agents in this team yet.</p>
                                        </td>
                                    </tr>
                                ) : teamAgents.map(agent => (
                                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            {agent.agent_id
                                                ? <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{agent.agent_id}</span>
                                                : <span className="text-xs text-slate-400 italic">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{agent.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{agent.mobile}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {[agent.district, agent.state].filter(Boolean).join(', ') || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[agent.status] ?? ''}`}>
                                                {agent.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 font-medium">
                                            {(agent as User & { total_leads?: number }).total_leads ?? 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Unassign ${agent.name} from this super agent?`))
                                                        unassignMut.mutate(agent.id);
                                                }}
                                                disabled={unassignMut.isPending}
                                                className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                                            >
                                                <Unlink size={11} /> Unassign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════ TAB: ASSIGNMENT LOG ══════════ */}
            {tab === 'log' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {['Business Development Executive', 'Action', 'Assigned By', 'Date', 'Notes'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logLoading ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading log…</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">No assignment history yet.</td></tr>
                                ) : (logs as unknown as { id: number; agent?: User; unassigned_at?: string | null; assignedBy?: User; assigned_at: string; notes?: string | null }[]).map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {(log.agent as User | undefined)?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${(log.unassigned_at as string | null) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {(log.unassigned_at as string | null) ? 'Unassigned' : 'Assigned'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {(log.assignedBy as User | undefined)?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {fmt(log.assigned_at as string)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {(log.notes as string | null) ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════ EDIT MODAL ══════════ */}
            {editing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setEditing(false)}>
                    <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-lg font-bold text-slate-800">Edit Business Development Manager</h2>
                            <button onClick={() => setEditing(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form
                            className="flex-1 px-6 py-5 space-y-4"
                            onSubmit={e => { e.preventDefault(); editMut.mutate(editForm as Record<string, unknown>); }}
                        >
                            {([
                                ['name', 'Full Name', 'text'],
                                ['mobile', 'Mobile', 'tel'],
                                ['email', 'Email', 'email'],

                                ['father_name', 'Father\'s Name', 'text'],
                                ['dob', 'Date of Birth', 'date'],
                                ['blood_group', 'Blood Group', 'text'],
                                ['state', 'State', 'text'],
                                ['district', 'District', 'text'],
                                ['area', 'Area', 'text'],
                            ] as [keyof typeof editForm, string, string][]).map(([field, lbl, type]) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{lbl}</label>
                                    <input
                                        type={type}
                                        value={editForm[field]}
                                        onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                                        className="input"
                                        placeholder={lbl}
                                    />
                                </div>
                            ))}
                            <button
                                type="submit"
                                disabled={editMut.isPending}
                                className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={16} /> {editMut.isPending ? 'Saving…' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {tab === 'offers' && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Gift className="text-orange-500" size={20} />
                            Business Manager Offer Progress
                        </h2>
                    </div>

                    {offersLoading ? (
                        <div className="py-10 text-center text-slate-400">Loading offers…</div>
                    ) : offers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {offers.map((offer: any) => (
                                <div key={offer.id} className="scale-95 origin-top-left">
                                    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800">{offer.title}</h4>
                                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">
                                                {offer.offer_type}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                                <span>Progress</span>
                                                <span>{offer.my_unredeemed_points} / {offer.target_points} Pts</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-orange-500 rounded-full" 
                                                    style={{ width: `${Math.min(100, (offer.my_unredeemed_points / offer.target_points) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Redeemed: {offer.my_redemption_count}
                                            </span>
                                            {offer.can_redeem && (
                                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    READY TO REDEEM
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium italic">No active offers for this manager</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
