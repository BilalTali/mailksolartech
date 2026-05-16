import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Search, Users, Plus, UserPlus, Info
} from 'lucide-react';
import { superAgentApi } from '@/services/superAgent.api';
import type { User } from '@/types';
import toast from 'react-hot-toast';
import { INDIAN_STATES, STATE_DISTRICTS } from '@/constants/locationData';
import MobileInput from '@/components/shared/MobileInput';


export default function SuperAgentTeamPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', mobile: '', password: '',
        state: '', district: '', area: ''
    });

    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['sa-team', search, statusFilter],
        queryFn: () => superAgentApi.getMyTeam({ search: search || undefined, status: statusFilter || undefined }),
    });

    const createAgentMut = useMutation({
        mutationFn: (fd: FormData) => superAgentApi.createAgent(fd),
        onSuccess: () => {
            toast.success('Business Development Executive added to your team');
            setIsAddModalOpen(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['sa-team'] });
        },
        onError: (err: any) => {
            const errData = err.response?.data;
            if (errData?.errors) {
                const firstError = Object.values(errData.errors as Record<string, string[]>)[0]?.[0];
                toast.error(firstError || 'Validation failed.');
            } else {
                toast.error(errData?.message || 'Failed to add executive');
            }
        }
    });

    const resetForm = () => {
        setFormData({
            name: '', email: '', mobile: '', password: '',
            state: '', district: '', area: ''
        });
    };

    const agents: User[] = data?.data?.data ?? [];

    const handleAddExecutive = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createAgentMut.mutate(formData as any);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Team Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage Business Development Executives assigned to your supervision</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-orange-200">
                        {data?.data?.total ?? 0} Executives
                    </span>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        <Plus size={16} /> Add Executive
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, agent ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-72"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Business Development Executive Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-400">Loading team...</div>
            ) : agents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <Users size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-500">No agents in your team</p>
                    <p className="text-sm text-slate-400 mt-1">Contact admin to assign agents to your team.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                        <div key={agent.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-slate-800">{agent.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{agent.agent_id}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${agent.status === 'active' ? 'bg-green-100 text-green-700' :
                                    agent.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {agent.status}
                                </span>
                            </div>
                            <div className="space-y-1 text-xs text-slate-500">
                                <p>📱 {agent.mobile}</p>
                                <p>📍 {agent.district}, {agent.state}</p>
                            </div>
                            <Link
                                to={`/super-agent/team/${agent.id}`}
                                className="mt-4 block text-center text-sm font-medium text-orange-600 hover:text-orange-700 py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                            >
                                View Details
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Executive Modal Drawer */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-in fade-in">
                    <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col animate-in slide-in-from-right">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 text-white rounded-lg shadow-sm">
                                    <UserPlus size={16} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Add Executive</h2>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
                        </div>
                        <form
                            className="flex-1 px-6 py-4 space-y-4"
                            onSubmit={handleAddExecutive}
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div>
                                    <MobileInput
                                        label="Mobile *"
                                        value={formData.mobile}
                                        onChange={(val) => setFormData(prev => ({ ...prev, mobile: val }))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Email Address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Min 6 characters"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                                        <select
                                            required
                                            value={formData.state}
                                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value, district: '' }))}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        >
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                                        <select
                                            required
                                            value={formData.district}
                                            onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                            disabled={!formData.state}
                                        >
                                            <option value="">Select District</option>
                                            {formData.state && STATE_DISTRICTS[formData.state]?.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                                    <input
                                        type="text"
                                        value={formData.area}
                                        onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Tehsil / Block / Village"
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-6">
                                <p className="text-xs text-slate-500 flex gap-2">
                                    <Info size={16} className="shrink-0 text-indigo-400" />
                                    Executive status defaults to <strong>Pending</strong> until approved. ID is auto-generated upon approval.
                                </p>
                            </div>
                            <div className="mt-8">
                                <button
                                    type="submit"
                                    disabled={createAgentMut.isPending}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {createAgentMut.isPending ? 'Provisioning...' : 'Add Business Development Executive'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
