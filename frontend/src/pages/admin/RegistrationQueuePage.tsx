import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle, User, Calendar, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface Lead {
    id: number;
    ulid: string;
    beneficiary_name: string;
    beneficiary_mobile: string;
    beneficiary_district: string;
    beneficiary_state: string;
    status: string;
    created_at: string;
    assigned_agent?: { name: string };
    created_by_super_agent?: { name: string };
}

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    base_price: number;
    current_stock: number;
    unit: string;
}

interface RejectModalState {
    lead: Lead | null;
    reason: string;
}

interface RegisterModalState {
    lead: Lead | null;
    bill_serial: string;
    bill_date: string;
    system_item: string;
    system_make: string;
    notes: string;
    items: { id: number; quantity: number }[];
}

export default function RegistrationQueuePage() {
    const queryClient = useQueryClient();
    const [rejectModal, setRejectModal] = useState<RejectModalState>({ lead: null, reason: '' });
    const [registerModal, setRegisterModal] = useState<RegisterModalState>({ 
        lead: null, bill_serial: '', bill_date: new Date().toISOString().split('T')[0], 
        system_item: '', system_make: '', notes: '', items: [] 
    });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-registration-queue'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { data: Lead[] } }>('/admin/queue/registration');
            return res.data.data;
        },
    });
    const leads = data?.data ?? [];

    const { data: inventoryRes } = useQuery({
        queryKey: ['admin-inventory-items'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: InventoryItem[] }>('/admin/inventory-items');
            return res.data.data;
        },
    });
    const inventoryItems = inventoryRes ?? [];

    const registerMutation = useMutation({
        mutationFn: async (data: any) => api.post(`/admin/leads/${data.ulid}/register`, data.payload),
        onSuccess: () => {
            toast.success('Bill generated ✅ — Lead now awaits MNRE registration number');
            setRegisterModal({ lead: null, bill_serial: '', bill_date: new Date().toISOString().split('T')[0], system_item: '', system_make: '', notes: '', items: [] });
            queryClient.invalidateQueries({ queryKey: ['admin-registration-queue'] });
            queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to register'),
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ ulid, reason }: { ulid: string; reason: string }) =>
            api.post(`/admin/leads/${ulid}/register/reject`, { reason }),
        onSuccess: () => {
            toast.success('Lead marked as invalid');
            setRejectModal({ lead: null, reason: '' });
            queryClient.invalidateQueries({ queryKey: ['admin-registration-queue'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to reject'),
    });

    const calculateTotal = () => {
        let total = 0;
        registerModal.items.forEach(item => {
            const inv = inventoryItems.find(i => i.id === item.id);
            if (inv) total += inv.base_price * item.quantity;
        });
        const gst = total * 0.05;
        return { base: total, gst, total: total + gst };
    };
    const totals = calculateTotal();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Registration Queue</h1>
                        <p className="text-sm text-slate-500">Leads awaiting MNRE registration — Status: NEW</p>
                    </div>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : leads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-600">Queue is empty</p>
                    <p className="text-sm text-slate-400">No leads pending MNRE registration.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <div>Beneficiary</div>
                        <div>Agent / BDM</div>
                        <div>Location</div>
                        <div className="text-right">Actions</div>
                    </div>
                    {leads.map((lead) => (
                        <div key={lead.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 items-center px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                            <div>
                                <div className="font-bold text-slate-800">{lead.beneficiary_name}</div>
                                <div className="text-xs text-slate-500 font-mono">{lead.ulid.slice(-10)} · {lead.beneficiary_mobile}</div>
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                    <Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString('en-IN')}
                                </div>
                            </div>
                            <div>
                                {lead.assigned_agent && (
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <User className="w-3.5 h-3.5 text-slate-400" /> {lead.assigned_agent.name}
                                    </div>
                                )}
                                {lead.created_by_super_agent && (
                                    <div className="text-xs text-slate-400 mt-0.5">BDM: {lead.created_by_super_agent.name}</div>
                                )}
                            </div>
                            <div className="text-sm text-slate-600">{lead.beneficiary_district}, {lead.beneficiary_state}</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setRegisterModal({ lead, bill_serial: '', bill_date: new Date().toISOString().split('T')[0], system_item: '', system_make: '', notes: '', items: [] })}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" /> Register & Bill
                                </button>
                                <button
                                    onClick={() => setRejectModal({ lead, reason: '' })}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 transition"
                                >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Register & Bill Modal */}
            {registerModal.lead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-6 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-black text-slate-800 text-xl">Generate Bill & Complete Docs</h3>
                                <p className="text-xs text-slate-500">Lead: {registerModal.lead.beneficiary_name}</p>
                                <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg mt-1 font-semibold">📄 After submitting, Bills & Agreement will auto-appear in lead documents. Submit MNRE reg. number next.</p>
                            </div>
                            <button onClick={() => setRegisterModal((p) => ({ ...p, lead: null }))} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Bill / Invoice Serial *</label>
                                <input 
                                    type="text" 
                                    value={registerModal.bill_serial} 
                                    onChange={(e) => setRegisterModal(p => ({...p, bill_serial: e.target.value}))} 
                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none" 
                                    placeholder="INV-2026-001" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Bill Date *</label>
                                <input 
                                    type="date" 
                                    value={registerModal.bill_date} 
                                    onChange={(e) => setRegisterModal(p => ({...p, bill_date: e.target.value}))} 
                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">System Item *</label>
                                <input 
                                    type="text" 
                                    value={registerModal.system_item} 
                                    onChange={(e) => setRegisterModal(p => ({...p, system_item: e.target.value}))} 
                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none" 
                                    placeholder="e.g. 3kW Grid Tie Solar System" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">System Make</label>
                                <input 
                                    type="text" 
                                    value={registerModal.system_make} 
                                    onChange={(e) => setRegisterModal(p => ({...p, system_make: e.target.value}))} 
                                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none" 
                                    placeholder="e.g. Waaree, Vikram" 
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-slate-600">Inventory Items (Bill of Materials) *</label>
                                <button 
                                    onClick={() => setRegisterModal(p => ({ ...p, items: [...p.items, { id: 0, quantity: 1 }] }))} 
                                    className="flex items-center gap-1 text-xs text-emerald-600 font-bold hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md"
                                >
                                    <Plus className="w-3 h-3" /> Add Item
                                </button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {registerModal.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                        <select 
                                            value={item.id} 
                                            onChange={(e) => {
                                                const newItems = [...registerModal.items];
                                                newItems[idx].id = parseInt(e.target.value);
                                                setRegisterModal(p => ({ ...p, items: newItems }));
                                            }}
                                            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        >
                                            <option value={0}>Select Inventory Item</option>
                                            {inventoryItems.map(inv => (
                                                <option key={inv.id} value={inv.id} disabled={inv.current_stock <= 0}>
                                                    {inv.name} ({inv.current_stock} in stock) - ₹{inv.base_price}
                                                </option>
                                            ))}
                                        </select>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={item.quantity} 
                                            onChange={(e) => {
                                                const newItems = [...registerModal.items];
                                                newItems[idx].quantity = parseInt(e.target.value);
                                                setRegisterModal(p => ({ ...p, items: newItems }));
                                            }}
                                            className="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        />
                                        <button 
                                            onClick={() => {
                                                const newItems = [...registerModal.items];
                                                newItems.splice(idx, 1);
                                                setRegisterModal(p => ({ ...p, items: newItems }));
                                            }}
                                            className="text-red-500 hover:text-red-700 p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">Base Amount:</span>
                                <span className="font-mono font-bold">₹{totals.base.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">GST (5%):</span>
                                <span className="font-mono font-bold">₹{totals.gst.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-base border-t border-slate-200 pt-2 mt-2 font-black text-emerald-700">
                                <span>Total Amount:</span>
                                <span>₹{totals.total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Additional Notes</label>
                            <input 
                                type="text" 
                                value={registerModal.notes} 
                                onChange={(e) => setRegisterModal(p => ({...p, notes: e.target.value}))} 
                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none" 
                                placeholder="Any registration notes..." 
                            />
                        </div>

                        <button
                            onClick={() => {
                                const payload = {
                                    bill_serial: registerModal.bill_serial,
                                    bill_date: registerModal.bill_date,
                                    system_item: registerModal.system_item,
                                    system_make: registerModal.system_make,
                                    notes: registerModal.notes,
                                    items: registerModal.items.filter(i => i.id !== 0 && i.quantity > 0)
                                };
                                registerMutation.mutate({ ulid: registerModal.lead!.ulid, payload });
                            }}
                            disabled={registerMutation.isPending || !registerModal.bill_serial || !registerModal.system_item || registerModal.items.filter(i => i.id !== 0).length === 0}
                            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            {registerMutation.isPending ? 'Processing...' : 'Confirm Bill Generation & Complete Docs'}
                        </button>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.lead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800">Reject Lead</h3>
                                <p className="text-xs text-slate-500">{rejectModal.lead.beneficiary_name}</p>
                            </div>
                        </div>
                        <textarea
                            placeholder="Enter rejection reason (required)..."
                            rows={3}
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setRejectModal({ lead: null, reason: '' })} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition">
                                Cancel
                            </button>
                            <button
                                onClick={() => rejectMutation.mutate({ ulid: rejectModal.lead!.ulid, reason: rejectModal.reason })}
                                disabled={!rejectModal.reason.trim() || rejectMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
