import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface InventoryItem {
    id: number;
    name: string;
    make?: string;
    sku?: string;
    category: string;
    unit: string;
    description?: string;
    current_stock: number;
    base_price: number;
    is_active: boolean;
}

interface ItemForm {
    name: string;
    make: string;
    sku: string;
    category: string;
    unit: string;
    description: string;
    current_stock: number;
    base_price: number;
    is_active: boolean;
}

const EMPTY_FORM: ItemForm = { name: '', make: '', sku: '', category: '', unit: 'nos', description: '', current_stock: 0, base_price: 0, is_active: true };

const CATEGORIES = ['Solar Panel', 'Inverter', 'Wiring & Cables', 'Earthing', 'Lightning Arrester', 'Net Meter', 'Structure', 'Other'];
const UNITS = ['nos', 'kg', 'meters', 'sets', 'pairs', 'liters'];

interface PendingReversion {
    id: number;
    lead_id: number;
    inventory_item_id: number;
    quantity: number;
    consumed_quantity: number;
    reverted_quantity: number;
    serial_number?: string;
    lead: {
        ulid: string;
        beneficiary_name: string;
    };
    inventory_item: {
        name: string;
        sku: string;
        unit: string;
    };
}

export default function InventoryManagementPage() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'catalogue' | 'returns'>('catalogue');
    const [formModal, setFormModal] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
    const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Catalogue Query
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['sa-inventory'],
        queryFn: async () => {
            const res = await api.get<{ data: InventoryItem[] }>('/super-admin/inventory-items');
            return res.data.data;
        },
    });

    // Pending Returns Query
    const { data: returns = [], isLoading: isLoadingReturns } = useQuery({
        queryKey: ['sa-inventory-returns'],
        queryFn: async () => {
            const res = await api.get<{ data: PendingReversion[] }>('/super-admin/inventory/reversions/pending');
            return res.data.data;
        },
        enabled: tab === 'returns',
    });

    const confirmReturnMutation = useMutation({
        mutationFn: (id: number) => api.post(`/super-admin/inventory/reversions/${id}/confirm`),
        onSuccess: () => {
            toast.success('Material restocked successfully! 📦');
            queryClient.invalidateQueries({ queryKey: ['sa-inventory-returns'] });
            queryClient.invalidateQueries({ queryKey: ['sa-inventory'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Confirmation failed'),
    });

    const openCreate = () => { 
        setForm(EMPTY_FORM); 
        setFormModal({ open: true, item: null }); 
    };
    // ... (rest of helper functions remain same)

    const openEdit = (item: InventoryItem) => {
        setForm({ 
            name: item.name, 
            make: item.make || '',
            sku: item.sku || '', 
            category: item.category, 
            unit: item.unit, 
            description: item.description || '', 
            current_stock: item.current_stock ?? 0, 
            base_price: item.base_price ?? 0, 
            is_active: item.is_active 
        });
        setFormModal({ open: true, item });
    };

    const saveMutation = useMutation({
        mutationFn: () => formModal.item
            ? api.put(`/super-admin/inventory-items/${formModal.item.id}`, form)
            : api.post('/super-admin/inventory-items', form),
        onSuccess: () => {
            toast.success(formModal.item ? 'Item updated ✅' : 'Item created ✅');
            setFormModal({ open: false, item: null });
            queryClient.invalidateQueries({ queryKey: ['sa-inventory'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Save failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/super-admin/inventory-items/${id}`),
        onSuccess: () => {
            toast.success('Item deleted');
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Delete failed'),
    });

    // Group by category
    const grouped = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><Package className="w-5 h-5 text-teal-600" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Inventory Management</h1>
                        <p className="text-sm text-slate-500">Manage solar installation items catalogue</p>
                    </div>
                </div>
                {tab === 'catalogue' && (
                    <button id="btn-add-inventory" onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition shadow-md shadow-teal-200">
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setTab('catalogue')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${tab === 'catalogue' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Item Catalogue
                </button>
                <button
                    id="tab-pending-returns"
                    onClick={() => setTab('returns')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${tab === 'returns' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Pending Returns
                    {returns.length > 0 && <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">{returns.length}</span>}
                </button>
            </div>

            {tab === 'catalogue' ? (
                isLoading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="font-bold text-slate-600">No inventory items</p>
                        <button onClick={openCreate} className="mt-3 text-sm text-teal-600 font-bold hover:underline">Add your first item →</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([category, catItems]) => (
                            <div key={category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="px-5 py-3 bg-teal-50 border-b border-teal-100">
                                    <span className="text-xs font-black uppercase tracking-widest text-teal-700">{category}</span>
                                    <span className="ml-2 text-[10px] text-teal-500">{catItems.length} item(s)</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {catItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{item.name}</span>
                                                    {item.make && <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-bold uppercase">{item.make}</span>}
                                                    {!item.is_active && <span className="px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-500 rounded font-bold">INACTIVE</span>}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                    {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                                                    <span>Unit: {item.unit}</span>
                                                    <span className={`font-bold ${item.current_stock > 0 ? 'text-teal-600' : 'text-red-500'}`}>Stock: {item.current_stock}</span>
                                                    <span>Rate: ₹{item.base_price}</span>
                                                    {item.description && <span className="truncate max-w-xs">{item.description}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button id={`btn-edit-inv-${item.id}`} onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition" title="Edit">
                                                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                                                </button>
                                                <button id={`btn-delete-inv-${item.id}`} onClick={() => setDeleteId(item.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* Pending Returns View */
                <div className="space-y-4">
                    {isLoadingReturns ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
                    ) : returns.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-600">No pending returns</p>
                            <p className="text-sm text-slate-400 mt-1">All materials from site are fully accounted for.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                            {returns.map((ret) => (
                                <div key={ret.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Plus className="w-5 h-5 rotate-45" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-800">{ret.inventory_item.name}</span>
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full">
                                                    {ret.reverted_quantity} {ret.inventory_item.unit}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                                <span className="font-bold text-slate-700">From Lead: {ret.lead.beneficiary_name}</span>
                                                <span>·</span>
                                                <span className="font-mono text-slate-400">({ret.lead.ulid.slice(-8)})</span>
                                                {ret.serial_number && (
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">SN: {ret.serial_number}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        id={`btn-confirm-return-${ret.id}`}
                                        onClick={() => confirmReturnMutation.mutate(ret.id)}
                                        disabled={confirmReturnMutation.isPending}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-100"
                                    >
                                        {confirmReturnMutation.isPending ? 'Verifying...' : 'Verify & Restock'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {formModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><Package className="w-5 h-5 text-teal-600" /></div>
                                <h3 className="font-black text-slate-800">{formModal.item ? 'Edit Item' : 'Add Inventory Item'}</h3>
                            </div>
                            <button onClick={() => setFormModal({ open: false, item: null })} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4 text-slate-600" /></button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Item Name <span className="text-red-500">*</span></label>
                                <input id="input-inv-name" type="text" placeholder="e.g. Monocrystalline Solar Panel" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Make / Brand (optional)</label>
                                <input id="input-inv-make" type="text" placeholder="e.g. Waaree, Adani, Luminous..." value={form.make} onChange={(e) => setForm((p: any) => ({ ...p, make: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Category <span className="text-red-500">*</span></label>
                                    <select id="input-inv-category" value={form.category} onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                                        <option value="">Select...</option>
                                        {CATEGORIES.map((c: any) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Unit <span className="text-red-500">*</span></label>
                                    <select id="input-inv-unit" value={form.unit} onChange={(e) => setForm((p: any) => ({ ...p, unit: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                                        {UNITS.map((u: any) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">SKU (optional)</label>
                                <input type="text" placeholder="e.g. SOL-PANEL-400W" value={form.sku} onChange={(e) => setForm((p: any) => ({ ...p, sku: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Current Stock <span className="text-red-500">*</span></label>
                                    <input type="number" min="0" value={form.current_stock} onChange={(e) => setForm((p: any) => ({ ...p, current_stock: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Base Price (₹) <span className="text-red-500">*</span></label>
                                    <input type="number" min="0" step="0.01" value={form.base_price} onChange={(e) => setForm((p: any) => ({ ...p, base_price: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Description (optional)</label>
                                <textarea rows={2} placeholder="Brief description..." value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p: any) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-teal-600" />
                                <span className="text-sm font-bold text-slate-700">Active (visible in selection lists)</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setFormModal({ open: false, item: null })} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
                            <button id="btn-save-inventory" onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || !form.category || !form.unit || saveMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition disabled:opacity-50">
                                {saveMutation.isPending ? 'Saving...' : formModal.item ? 'Save Changes' : 'Create Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
                        <Trash2 className="w-12 h-12 text-red-400 mx-auto" />
                        <h3 className="font-black text-slate-800">Delete Item?</h3>
                        <p className="text-sm text-slate-500">This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
                            <button id="btn-confirm-delete-inv" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition disabled:opacity-50">
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
