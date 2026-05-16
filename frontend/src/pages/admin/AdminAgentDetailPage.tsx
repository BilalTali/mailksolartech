import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Users, Phone, Activity,
    CheckCircle, XCircle, UserX, Edit2, X, QrCode, BadgeCheck, Gift
} from 'lucide-react';
import { agentsApi } from '@/services/agents.api';
import { offersApi } from '@/services/offers.api';
import toast from 'react-hot-toast';
import type { User } from '@/types';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import DownloadJoiningLetterButton from '@/components/shared/DownloadJoiningLetterButton';
import QrCodePreview from '@/components/shared/QrCodePreview';
import QrScanHistory from '@/components/shared/QrScanHistory';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { OfferCard } from '@/components/shared/OfferCard';

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
};

function fmt(iso: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Tab = 'overview' | 'enumerators' | 'scans' | 'offers';

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminAgentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [tab, setTab] = useState<Tab>('overview');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', mobile: '', email: '', district: '', state: '', area: '',
        father_name: '', dob: '', blood_group: '', occupation: '', qualification: ''
    });

    // ── Fetch agent detail ──────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['admin-agent-detail', id],
        queryFn: () => agentsApi.getAdminAgent(Number(id)),
        enabled: !!id,
    });
    const agent = data?.data as User | undefined;

    // ── Status mutation ───────────────────────────────────────────────────────
    const statusMut = useMutation({
        mutationFn: (status: string) => agentsApi.updateAgentStatus(Number(id), status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-agent-detail', id] });
            toast.success('Status updated');
        },
        onError: () => toast.error('Failed to update status.'),
    });

    // ── Edit mutation ─────────────────────────────────────────────────────────
    const editMut = useMutation({
        mutationFn: (data: Record<string, unknown>) => agentsApi.updateAgent(Number(id), data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-agent-detail', id] });
            toast.success('Business Development Executive updated');
            setEditing(false);
        },
        onError: () => toast.error('Failed to update.'),
    });

    // ── Delete mutation ───────────────────────────────────────────────────────
    const deleteMut = useMutation({
        mutationFn: () => agentsApi.deleteAgent(Number(id)),
        onSuccess: () => {
            toast.success('Business Development Executive deleted');
            navigate('/admin/agents');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cannot delete.';
            toast.error(msg);
        },
    });

    // ── Fetch agent offers ─────────────────────────────────────────────
    const { data: offersData, isLoading: offersLoading } = useQuery({
        queryKey: ['admin-agent-offers', id],
        queryFn: () => offersApi.admin.getAgentOffers(Number(id)),
        enabled: !!id && tab === 'offers',
    });
    const offers = offersData?.data ?? [];

    const startEdit = () => {
        if (!agent) return;
        setEditForm({
            name: agent.name ?? '',
            mobile: agent.mobile ?? '',
            email: agent.email ?? '',

            district: agent.district ?? '',
            state: agent.state ?? '',
            area: agent.area ?? '',
            father_name: agent.father_name ?? '',
            dob: agent.dob ? agent.dob.split('T')[0] : '',
            blood_group: agent.blood_group ?? '',
            occupation: agent.occupation ?? '',
            qualification: agent.qualification ?? ''
        });
        setEditing(true);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center py-20 text-slate-400">Loading…</div>;
    }
    if (!agent) {
        return <div className="flex items-center justify-center py-20 text-slate-400">Business Development Executive not found.</div>;
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* ── Back + Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Link to="/admin/agents" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors">
                        <ArrowLeft size={16} /> Back to Executives
                    </Link>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm overflow-hidden">
                            {agent.profile_photo_url ? (
                                <img src={agent.profile_photo_url} alt={agent.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <Users size={30} />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{agent.name}</h1>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[agent.status]}`}>
                                    {agent.status === 'active' ? <BadgeCheck size={12} /> : <XCircle size={12} />}
                                    {agent.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs font-black text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-2 py-0.5 tracking-wider uppercase">
                                    ID: {agent.agent_id || 'PENDING'}
                                </span>
                                <span className="text-slate-400 text-xs font-medium">• Joined {fmt(agent.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 mr-2">
                        <DownloadJoiningLetterButton user={agent} variant="button" className="h-11" />
                        <DownloadIdCardButton userId={agent.id} variant="button" className="h-11" />
                    </div>

                    <button
                        onClick={startEdit}
                        className="h-11 px-5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Edit
                    </button>

                    {agent.status === 'active' ? (
                        <button
                            onClick={() => statusMut.mutate('inactive')}
                            disabled={statusMut.isPending}
                            className="h-11 px-5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <XCircle size={16} /> Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={() => statusMut.mutate('active')}
                            disabled={statusMut.isPending}
                            className="h-11 px-5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-bold hover:bg-green-100 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <CheckCircle size={16} /> Activate
                        </button>
                    )}

                    <button
                        onClick={() => { if (confirm('Delete this Business Development Executive? This cannot be undone.')) deleteMut.mutate(); }}
                        disabled={deleteMut.isPending}
                        className="h-11 px-5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50 flex items-center gap-2"
                    >
                        <UserX size={16} /> Delete
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1 w-fit">
                <button
                    onClick={() => setTab('overview')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Profile Overview
                </button>
                <button
                    onClick={() => setTab('enumerators')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'enumerators' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Team Enumerators
                </button>
                <button
                    onClick={() => setTab('scans')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'scans' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    QR Scan History
                </button>
                <button
                    onClick={() => setTab('offers')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'offers' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Incentive Offers
                </button>
            </div>

            {/* ── Content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    {tab === 'overview' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Personal */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><Users size={18} /></div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Personal Details</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DetailItem label="Full Legal Name" value={agent.name} />
                                    <DetailItem label="Father's Name" value={agent.father_name} />
                                    <DetailItem label="Date of Birth" value={fmt(agent.dob!)} />
                                    <DetailItem label="Blood Group" value={agent.blood_group} />
                                    <DetailItem label="Gender" value={agent.gender} />
                                    <DetailItem label="Marital Status" value={agent.marital_status} />
                                </div>
                            </section>

                            {/* Contact */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Phone size={18} /></div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Contact Matrix</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DetailItem label="Email" value={agent.email} />
                                    <DetailItem label="Mobile" value={agent.mobile} />

                                    <DetailItem label="Area" value={agent.area} />
                                    <DetailItem label="District" value={agent.district} />
                                    <DetailItem label="State" value={agent.state} />
                                </div>
                            </section>

                            {/* Professional */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Activity size={18} /></div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Professional Standing</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DetailItem label="Occupation" value={agent.occupation} />
                                    <DetailItem label="Qualification" value={agent.qualification} />
                                    <DetailItem label="Experience" value={agent.experience_years ? `${agent.experience_years} Years` : '—'} />
                                    <DetailItem label="Business Manager" value={agent.super_agent?.name || 'SELF MANAGED'} />
                                </div>
                            </section>
                        </div>
                    )}

                    {tab === 'enumerators' && (
                         <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Team Enumerators</h2>
                            </div>
                            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Enumerator tracking hub coming soon</p>
                            </div>
                         </div>
                    )}

                    {tab === 'scans' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <QrScanHistory userId={agent.id} role="agent" />
                        </div>
                    )}

                    {tab === 'offers' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        <Gift className="text-indigo-600" />
                                        Agent Offer Progress
                                    </h2>
                                </div>
                                
                                {offersLoading ? (
                                    <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                                ) : offers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {offers.map((offer: any) => (
                                            <OfferCard 
                                                key={offer.id} 
                                                offer={offer} 
                                                onRedeem={() => {}} 
                                                isRedeeming={false}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active offers for this agent</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* QR Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><QrCode size={18} /></div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dynamic QR</h3>
                        </div>
                        <QrCodePreview 
                            user={agent} 
                            isAdminView={true} 
                            onRegenerated={(u) => qc.setQueryData(['admin-agent-detail', id], { success: true, data: u })}
                        />
                    </div>

                    {/* Progress Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-6">Profile Maturity</h4>
                            <div className="flex items-end justify-between mb-3">
                                <span className="text-4xl font-black">{agent.profile_completion}%</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Synchronized</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
                                    style={{ width: `${agent.profile_completion}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setEditing(false)}>
                    <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Executive Profile</h2>
                                <p className="text-xs text-slate-400 font-medium">Update professional and personal standing</p>
                            </div>
                            <button onClick={() => setEditing(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <form
                            className="flex-1 px-8 py-8 space-y-8"
                            onSubmit={e => { e.preventDefault(); editMut.mutate(editForm); }}
                        >
                            <div className="grid grid-cols-1 gap-6">
                                <InputBlock label="Full Legal Name" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
                                <div className="grid grid-cols-1 gap-4">
                                    <InputBlock label="Mobile" value={editForm.mobile} type="tel" onChange={v => setEditForm(f => ({ ...f, mobile: v }))} />

                                </div>
                                <InputBlock label="Email Address" value={editForm.email} type="email" onChange={v => setEditForm(f => ({ ...f, email: v }))} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputBlock label="State" value={editForm.state} onChange={v => setEditForm(f => ({ ...f, state: v }))} />
                                    <InputBlock label="District" value={editForm.district} onChange={v => setEditForm(f => ({ ...f, district: v }))} />
                                </div>
                                <InputBlock label="Father's Name" value={editForm.father_name} onChange={v => setEditForm(f => ({ ...f, father_name: v }))} />
                            </div>
                            <button
                                type="submit"
                                disabled={editMut.isPending}
                                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
                            >
                                {editMut.isPending ? 'Synchronizing...' : 'Commit Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value?: string | null }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{label}</p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">
                <p className="font-bold text-slate-800 break-all">{value || '—'}</p>
            </div>
        </div>
    );
}

function InputBlock({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
            <input 
                type={type} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" 
            />
        </div>
    );
}
