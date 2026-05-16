import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Package, Loader2, Plus, ArrowUpRight, Truck, Users, 
    History, AlertCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { superAdminStockApi } from '@/services/superAdminStock.api';

interface StockDispatch {
    id: number;
    admin: { name: string; mobile: string };
    status: string;
    driver_name: string;
    vehicle_number: string;
    dispatched_at: string;
    items: Array<{
        inventory_item: { name: string };
        dispatched_quantity: number;
    }>;
}

export default function SuperAdminStockDispatchPage() {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form, setForm] = useState({
        admin_id: '',
        driver_name: '',
        driver_phone: '',
        vehicle_number: '',
        expected_delivery_date: '',
        notes: '',
        items: [{ inventory_item_id: '', quantity: 1 }]
    });

    // Queries
    const { data: dispatchesRes, isLoading: isLoadingDispatches } = useQuery({
        queryKey: ['sa-stock-dispatches'],
        queryFn: () => superAdminStockApi.getDispatches()
    });
    const dispatches = dispatchesRes?.data?.data?.data || [];

    const { data: formDataRes } = useQuery({
        queryKey: ['sa-stock-form-data'],
        queryFn: () => superAdminStockApi.getFormData(),
        enabled: isCreateModalOpen
    });
    const { admins = [], inventory = [] } = formDataRes?.data?.data || {};

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => superAdminStockApi.createDispatch(data),
        onSuccess: () => {
            toast.success('Stock dispatched to Admin successfully! 🚚');
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sa-stock-dispatches'] });
            setForm({
                admin_id: '',
                driver_name: '',
                driver_phone: '',
                vehicle_number: '',
                expected_delivery_date: '',
                notes: '',
                items: [{ inventory_item_id: '', quantity: 1 }]
            });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Dispatch failed')
    });

    const addItem = () => setForm({ ...form, items: [...form.items, { inventory_item_id: '', quantity: 1 }] });
    const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

    const handleItemChange = (idx: number, field: string, value: any) => {
        const newItems = [...form.items];
        (newItems[idx] as any)[field] = value;
        setForm({ ...form, items: newItems });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                        <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Stock Logistics</h1>
                        <p className="text-sm text-slate-500">Dispatch hardware from global warehouse to Admin locations</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                >
                    <Plus className="w-4 h-4" /> New Dispatch
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <History className="w-4 h-4" /> Recent Shipment History
                    </h3>
                    {isLoadingDispatches ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-900" /></div>
                    ) : dispatches.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center shadow-sm">
                            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="font-bold text-slate-600">No shipments found</p>
                            <button onClick={() => setIsCreateModalOpen(true)} className="text-sm text-indigo-600 font-bold mt-2 hover:underline">Start your first dispatch →</button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                            {dispatches.map((d: StockDispatch) => (
                                <div key={d.id} className="p-6 hover:bg-slate-50 transition group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800">{d.admin.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{d.admin.mobile}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                d.status === 'RECEIVED_BY_ADMIN' ? 'bg-emerald-100 text-emerald-700' :
                                                d.status === 'PARTIALLY_RECEIVED' ? 'bg-amber-100 text-amber-700' :
                                                'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {d.status.replace(/_/g, ' ')}
                                            </span>
                                            <p className="text-[11px] text-slate-400 mt-1">{new Date(d.dispatched_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {d.items.map((i, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                                                {i.dispatched_quantity} × {i.inventory_item.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4 text-[11px] text-slate-500">
                                        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {d.vehicle_number}</span>
                                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {d.driver_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Package className="w-32 h-32" /></div>
                        <h3 className="text-xl font-black mb-4 relative z-10">Stock Overview</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5">
                                <span className="text-xs font-bold opacity-60">Total Dispatches</span>
                                <span className="text-2xl font-black">{dispatches.length}</span>
                            </div>
                            <p className="text-[10px] opacity-60 leading-relaxed uppercase tracking-widest font-black">
                                Super Admin acts as the source of truth for all hardware. Once dispatched, stock is deducted from global warehouse.
                            </p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                            <div>
                                <h4 className="text-xs font-black text-indigo-900 uppercase mb-1">Logistics Note</h4>
                                <p className="text-[11px] text-indigo-700 leading-relaxed">
                                    Ensure driver phone numbers are correct. Admins will receive a notification to verify the items upon arrival.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Dispatch Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
                        <div className="p-8 bg-slate-900 text-white relative">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-2xl font-black">Prepare Shipment</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"><X className="w-4 h-4" /></button>
                            </div>
                            <p className="text-slate-400 text-sm">Select an Admin and hardware to dispatch from global warehouse.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Target Admin (Recipient)</label>
                                    <select
                                        value={form.admin_id}
                                        onChange={(e) => setForm({ ...form, admin_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                                    >
                                        <option value="">Select an Admin...</option>
                                        {admins.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.mobile})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Driver Name</label>
                                    <input
                                        type="text"
                                        placeholder="Full name"
                                        value={form.driver_name}
                                        onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Driver Phone</label>
                                    <input
                                        type="text"
                                        placeholder="Contact number"
                                        value={form.driver_phone}
                                        onChange={(e) => setForm({ ...form, driver_phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Vehicle Number</label>
                                    <input
                                        type="text"
                                        placeholder="Plate number"
                                        value={form.vehicle_number}
                                        onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Expected Arrival</label>
                                    <input
                                        type="date"
                                        value={form.expected_delivery_date}
                                        onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase">Items to Dispatch</label>
                                    <button onClick={addItem} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Add More +</button>
                                </div>
                                {form.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex-1">
                                            <select
                                                value={item.inventory_item_id}
                                                onChange={(e) => handleItemChange(idx, 'inventory_item_id', e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                                            >
                                                <option value="">Select hardware...</option>
                                                {inventory.map((inv: any) => (
                                                    <option key={inv.id} value={inv.id} disabled={inv.current_stock <= 0}>
                                                        {inv.name} ({inv.current_stock} avail.)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                                            />
                                        </div>
                                        {form.items.length > 1 && (
                                            <button onClick={() => removeItem(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => createMutation.mutate(form)}
                                    disabled={!form.admin_id || !form.driver_name || createMutation.isPending}
                                    className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition shadow-xl disabled:opacity-50"
                                >
                                    {createMutation.isPending ? 'Processing Dispatch...' : 'Dispatch Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
