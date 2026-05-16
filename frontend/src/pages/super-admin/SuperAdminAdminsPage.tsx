import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, Search, Edit, Trash2, 
    Shield, CheckCircle, XCircle, Mail, Phone,
    Settings2, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { ApiResponse, User, PaginatedResponse } from '@/types';

export default function SuperAdminAdminsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
    const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
    const [fundingAdmin, setFundingAdmin] = useState<User | null>(null);
    const [allowanceForm, setAllowanceForm] = useState({ category: 'meeting_allowance', amount: '', description: '' });

    const { data: adminsRes, isLoading } = useQuery({
        queryKey: ['super-admin', 'admins', search],
        queryFn: async () => {
            const res = await api.get<ApiResponse<PaginatedResponse<User>>>('/super-admin/admins', {
                params: { search, per_page: 10 }
            });
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/super-admin/admins', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            toast.success('Admin created successfully');
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to create admin');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => api.put(`/super-admin/admins/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            toast.success('Admin updated successfully');
            setEditingAdmin(null);
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update admin');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/super-admin/admins/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            toast.success('Admin deleted successfully');
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => api.put(`/super-admin/admins/${id}/status`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            toast.success('Status updated');
        }
    });

    const allowanceMutation = useMutation({
        mutationFn: (payload: any) => api.post('/admin/ledger/allowance', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            toast.success('Allowance credited successfully');
            setIsAllowanceModalOpen(false);
            setFundingAdmin(null);
            setAllowanceForm({ category: 'meeting_allowance', amount: '', description: '' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to credit allowance');
        }
    });

    const admins = adminsRes?.data?.data || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-primary" />
                        Platform Administrators
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Manage root-level administrators and their system permissions.</p>
                </div>
                <button 
                    onClick={() => { setEditingAdmin(null); setIsCreateModalOpen(true); }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    Add New Admin
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email or mobile..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Permissions</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                                    </tr>
                                ))
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Shield className="w-12 h-12 text-slate-200" />
                                            <p className="text-slate-400 font-bold">No administrators found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : admins.map((admin) => (
                                <tr key={admin.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">
                                                {admin.profile_photo_url ? (
                                                    <img src={admin.profile_photo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                ) : admin.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight">{admin.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">Added {new Date(admin.created_at || '').toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                {admin.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                {admin.mobile}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button 
                                            onClick={() => toggleStatusMutation.mutate(admin.id)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                                                admin.status === 'active' 
                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                            }`}
                                        >
                                            {admin.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {admin.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {admin.permissions?.includes('*') ? (
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black uppercase border border-primary/10">Full Access</span>
                                            ) : (
                                                admin.permissions?.slice(0, 2).map((p: string, idx: number) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase">{p.replace('_', ' ')}</span>
                                                ))
                                            )}
                                            {admin.permissions && admin.permissions.length > 2 && !admin.permissions.includes('*') && (
                                                <span className="text-[10px] text-slate-400 font-bold">+{admin.permissions.length - 2} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { setFundingAdmin(admin); setIsAllowanceModalOpen(true); }}
                                                className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center gap-1"
                                                title="Fund / Add Allowance"
                                            >
                                                <Plus className="w-4 h-4" /> <span className="text-[10px] font-bold">Fund</span>
                                            </button>
                                            <button 
                                                onClick={() => { setEditingAdmin(admin); setIsCreateModalOpen(true); }}
                                                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-primary hover:border-primary transition-all"
                                                title="Edit Admin"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => { if(window.confirm('Delete this admin?')) deleteMutation.mutate(admin.id); }}
                                                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-red-500 hover:border-red-500 transition-all"
                                                title="Delete Admin"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">Showing {admins.length} administrators</p>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                {editingAdmin ? 'Edit Administrator' : 'Create New Administrator'}
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <XCircle className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = Object.fromEntries(formData.entries());
                            if (editingAdmin) {
                                updateMutation.mutate({ id: editingAdmin.id, data });
                            } else {
                                createMutation.mutate(data);
                            }
                        }} className="p-8 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                <input name="name" defaultValue={editingAdmin?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                    <input name="email" type="email" defaultValue={editingAdmin?.email} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number</label>
                                    <input name="mobile" type="tel" defaultValue={editingAdmin?.mobile} required maxLength={10} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium" />
                                </div>
                            </div>
                            {!editingAdmin && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Initial Password</label>
                                    <input name="password" type="password" required minLength={8} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium" />
                                </div>
                            )}
                            <div className="pt-4 flex items-center gap-3">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Processing...' : editingAdmin ? 'Update Settings' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allowance Modal */}
            {isAllowanceModalOpen && fundingAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Fund Admin</h3>
                                <p className="text-xs text-slate-500 font-medium">Crediting {fundingAdmin.name}</p>
                            </div>
                            <button onClick={() => { setIsAllowanceModalOpen(false); setFundingAdmin(null); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <XCircle className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            allowanceMutation.mutate({ admin_id: fundingAdmin.id, ...allowanceForm, amount: Number(allowanceForm.amount) });
                        }} className="p-8 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Allowance Type</label>
                                <select 
                                    required 
                                    value={allowanceForm.category}
                                    onChange={e => setAllowanceForm({...allowanceForm, category: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                                >
                                    <option value="meeting_allowance">Meeting Allowance</option>
                                    <option value="branding">Branding / Marketing</option>
                                    <option value="travel">Travel Allowance</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    required 
                                    min="1"
                                    value={allowanceForm.amount}
                                    onChange={e => setAllowanceForm({...allowanceForm, amount: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" 
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes</label>
                                <textarea 
                                    required 
                                    rows={3}
                                    value={allowanceForm.description}
                                    onChange={e => setAllowanceForm({...allowanceForm, description: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" 
                                    placeholder="Reason for funding..."
                                />
                            </div>
                            <div className="pt-4 flex items-center gap-3">
                                <button type="button" onClick={() => { setIsAllowanceModalOpen(false); setFundingAdmin(null); }} className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={allowanceMutation.isPending}
                                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {allowanceMutation.isPending ? 'Processing...' : 'Transfer Funds'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                <Settings2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 font-medium">
                    <span className="font-bold">Pro Tip:</span> Use the permissions toggle to restrict administrators from sensitive actions like commission approval or site-wide settings.
                </p>
            </div>
        </div>
    );
}
