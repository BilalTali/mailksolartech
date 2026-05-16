import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, UserX, UserCheck, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface Operator {
    id: number;
    name: string;
    email: string;
    mobile: string;
    status: 'active' | 'inactive';
    created_at: string;
}

interface CreateForm {
    name: string;
    email: string;
    mobile: string;
    password: string;
}

const defaultForm: CreateForm = { name: '', email: '', mobile: '', password: '' };

export default function AdminOperatorsPage() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateForm>(defaultForm);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-operators'],
        queryFn: () => api.get<{ data: Operator[] }>('/admin/operators').then(r => r.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateForm) => api.post('/admin/operators', payload),
        onSuccess: () => {
            toast.success('Operator created successfully.');
            queryClient.invalidateQueries({ queryKey: ['admin-operators'] });
            setForm(defaultForm);
            setShowForm(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create operator.');
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            api.put(`/admin/operators/${id}/status`, { status }),
        onSuccess: () => {
            toast.success('Operator status updated.');
            queryClient.invalidateQueries({ queryKey: ['admin-operators'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/operators/${id}`),
        onSuccess: () => {
            toast.success('Operator removed.');
            queryClient.invalidateQueries({ queryKey: ['admin-operators'] });
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-dark">Operators</h1>
                        <p className="text-sm text-neutral-500">Manage limited-access operator accounts who can view and update lead statuses.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Operator
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-dark mb-4">Create New Operator</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['name', 'email', 'mobile', 'password'] as const).map(field => (
                            <div key={field}>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                    {field.charAt(0).toUpperCase() + field.slice(1)}
                                </label>
                                <input
                                    type={field === 'password' ? 'password' : field === 'mobile' ? 'tel' : 'text'}
                                    value={form[field]}
                                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                                    {...(field === 'mobile' ? { pattern: "^[6-9]\\d{9}$", maxLength: 10 } : {})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder={field === 'password' ? 'Min 8 characters' : field === 'mobile' ? '10-digit mobile number' : ''}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 mt-5">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-neutral-600 rounded-xl border border-slate-200 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button
                            onClick={() => createMutation.mutate(form)}
                            disabled={createMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
                        >
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create Operator
                        </button>
                    </div>
                </div>
            )}

            {/* Operators List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !data?.length ? (
                    <div className="text-center py-16 text-neutral-400">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No operators yet</p>
                        <p className="text-sm">Create one to allow limited admin access for your team.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="text-left text-xs font-bold text-neutral-500 uppercase tracking-wider px-6 py-3">Name</th>
                                <th className="text-left text-xs font-bold text-neutral-500 uppercase tracking-wider px-6 py-3">Email</th>
                                <th className="text-left text-xs font-bold text-neutral-500 uppercase tracking-wider px-6 py-3">Mobile</th>
                                <th className="text-left text-xs font-bold text-neutral-500 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-xs font-bold text-neutral-500 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(op => (
                                <tr key={op.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-dark">{op.name}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">{op.email}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">{op.mobile}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${op.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                                            {op.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => statusMutation.mutate({ id: op.id, status: op.status === 'active' ? 'inactive' : 'active' })}
                                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                                                title={op.status === 'active' ? 'Deactivate' : 'Activate'}
                                            >
                                                {op.status === 'active' ? <UserX className="w-4 h-4 text-rose-500" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Remove this operator?')) deleteMutation.mutate(op.id); }}
                                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4 text-rose-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
