import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Star, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminSuperAgentApi } from '@/services/adminSuperAgent.api';
import type { User } from '@/types';
import { Link } from 'react-router-dom';
import MobileInput from '@/components/shared/MobileInput';
import { INDIAN_STATES, STATE_DISTRICTS } from '@/constants/locationData';

const STATUS_BADGE: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
};

export default function AdminSuperAgentsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', mobile: '', email: '', password: '',
        district: '', state: '', area: '',
    });
    const [createError, setCreateError] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-super-agents', search, statusFilter],
        queryFn: () => adminSuperAgentApi.getSuperAgents({
            search: search || undefined,
            status: statusFilter || undefined,
        }),
    });

    const togglePublicContactMutation = useMutation({
        mutationFn: (id: number) => adminSuperAgentApi.togglePublicContact(id),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['admin-super-agents'] });
            toast.success(res.message);
        },
        onError: () => toast.error('Failed to update public contact status.'),
    });

    const createMutation = useMutation({
        mutationFn: (formData: Record<string, unknown>) => adminSuperAgentApi.createSuperAgent(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-super-agents'] });
            toast.success('Business Development Manager created successfully');
            setShowCreate(false);
            setCreateForm({
                name: '', mobile: '', email: '', password: '',
                district: '', state: '', area: '',
            });
            setCreateError(null);
        },
        onError: (err: any) => {
            setCreateError(err.response?.data?.message || 'Failed to create BDM');
        }
    });

    const superAgents: (User & { is_public_contact?: boolean })[] = data?.data?.data ?? [];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Business Development Managers</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage your field supervisors</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                    <Plus size={16} /> Create Business Development Manager
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, SSM code, mobile..."
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
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['SSM Code', 'Name', 'Mobile', 'State', 'Executives', 'Status', 'Public Support', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Loading...</td></tr>
                            ) : superAgents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <Star size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-400">No super agents found. Create one to get started.</p>
                                    </td>
                                </tr>
                            ) : (
                                superAgents.map((sa) => (
                                    <tr key={sa.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-orange-700 bg-orange-50">
                                            {sa.super_agent_code}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800">{sa.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{sa.mobile}</td>
                                        <td className="px-4 py-3 text-slate-600">{sa.state ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Users size={14} className="text-slate-400" />
                                                <span className="font-medium">{sa.agent_count ?? 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[sa.status]}`}>
                                                {sa.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={sa.is_public_contact || false}
                                                        onChange={() => togglePublicContactMutation.mutate(sa.id)}
                                                        disabled={togglePublicContactMutation.isPending}
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                                                </label>
                                                {sa.is_public_contact && <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Visible</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/admin/super-agents/${sa.id}`}
                                                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                            >
                                                View / Manage →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Drawer Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
                    <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">Create Business Development Manager</h2>
                            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        </div>
                        <form
                            className="flex-1 px-6 py-4 space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                createMutation.mutate(createForm);
                            }}
                        >
                            {createError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{createError}</div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="input"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <MobileInput
                                        label="Mobile *"
                                        value={createForm.mobile}
                                        onChange={(val) => setCreateForm(prev => ({ ...prev, mobile: val }))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="input"
                                        placeholder="Email Address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                        className="input"
                                        placeholder="Min 6 characters"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                                        <select
                                            required
                                            value={createForm.state}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, state: e.target.value, district: '' }))}
                                            className="input select"
                                        >
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                                        <select
                                            required
                                            value={createForm.district}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, district: e.target.value }))}
                                            className="input select"
                                            disabled={!createForm.state}
                                        >
                                            <option value="">Select District</option>
                                            {createForm.state && STATE_DISTRICTS[createForm.state]?.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                                    <input
                                        type="text"
                                        value={createForm.area}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, area: e.target.value }))}
                                        className="input"
                                        placeholder="Tehsil / Block / Village"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                                ℹ️ SSM code is auto-generated. Business Development Manager status defaults to <strong>Active</strong>.
                            </p>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Business Development Manager'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
