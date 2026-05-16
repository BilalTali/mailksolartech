import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Package, Loader2, CheckCircle2, AlertTriangle, 
    Camera, MapPin, History, PackageOpen, Truck 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminInventoryApi } from '@/services/adminInventory.api';

interface AdminStockItem {
    id: number;
    inventory_item: {
        name: string;
        make?: string;
        sku?: string;
        unit: string;
        category: string;
    };
    current_stock: number;
    total_received: number;
    total_consumed: number;
    total_reverted: number;
}

interface IncomingDispatch {
    id: number;
    super_admin: { name: string };
    status: string;
    driver_name: string;
    driver_phone: string;
    vehicle_number: string;
    expected_delivery_date: string;
    dispatched_at: string;
    notes?: string;
    items: Array<{
        id: number;
        inventory_item: { name: string; unit: string };
        dispatched_quantity: number;
    }>;
}

export default function AdminInventoryLedgerPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'my-stock' | 'incoming'>('my-stock');
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; dispatch: IncomingDispatch | null }>({ open: false, dispatch: null });
    const [receiptForm, setReceiptForm] = useState<{
        items: Array<{ dispatch_item_id: number; received_quantity: number; condition: string; notes: string }>;
        geo_photo: File | null;
        latitude: number;
        longitude: number;
        notes: string;
    }>({ items: [], geo_photo: null, latitude: 0, longitude: 0, notes: '' });

    // Queries
    const { data: myStock = [], isLoading: isLoadingStock } = useQuery({
        queryKey: ['admin-my-stock'],
        queryFn: async () => {
            const res = await adminInventoryApi.getMyStock();
            return res.data.data;
        }
    });

    const { data: incoming = [], isLoading: isLoadingIncoming } = useQuery({
        queryKey: ['admin-incoming-stock'],
        queryFn: async () => {
            const res = await adminInventoryApi.getIncoming();
            return res.data.data;
        }
    });

    // Mutations
    const confirmMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => adminInventoryApi.confirmReceipt(id, data),
        onSuccess: (res: any) => {
            toast.success(res.data.message);
            setConfirmModal({ open: false, dispatch: null });
            queryClient.invalidateQueries({ queryKey: ['admin-my-stock'] });
            queryClient.invalidateQueries({ queryKey: ['admin-incoming-stock'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Confirmation failed')
    });

    const openConfirmModal = (dispatch: IncomingDispatch) => {
        setReceiptForm({
            items: dispatch.items.map(i => ({
                dispatch_item_id: i.id,
                received_quantity: i.dispatched_quantity,
                condition: 'good',
                notes: ''
            })),
            geo_photo: null,
            latitude: 0,
            longitude: 0,
            notes: ''
        });
        setConfirmModal({ open: true, dispatch });
        
        // Get Geo
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setReceiptForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Stock Ledger</h1>
                        <p className="text-sm text-slate-500">Track your personal warehouse inventory & receipts</p>
                    </div>
                </div>
            </div>

            {/* Premium Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('my-stock')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'my-stock' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                    <PackageOpen className="w-4 h-4" /> My Warehouse
                </button>
                <button
                    onClick={() => setActiveTab('incoming')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all relative ${activeTab === 'incoming' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                    <Truck className="w-4 h-4" /> Incoming Dispatches
                    {incoming.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] animate-bounce">
                            {incoming.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'my-stock' ? (
                isLoadingStock ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                ) : myStock.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <PackageOpen className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-bold text-slate-700">Your warehouse is empty</h3>
                        <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Once Super Admin dispatches stock and you confirm receipt, items will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myStock.map((item: AdminStockItem) => (
                            <div key={item.id} className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Package className="w-16 h-16" />
                                </div>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg mb-2 inline-block">
                                            {item.inventory_item.category}
                                        </span>
                                        <h3 className="font-black text-slate-800 text-lg leading-tight">{item.inventory_item.name}</h3>
                                        <p className="text-[11px] text-slate-400 font-mono mt-1">{item.inventory_item.sku || 'NO-SKU'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-indigo-600">{item.current_stock}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.inventory_item.unit}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-50">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total In</p>
                                        <p className="text-sm font-bold text-slate-700">{item.total_received}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Used</p>
                                        <p className="text-sm font-bold text-slate-700">{item.total_consumed}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Returns</p>
                                        <p className="text-sm font-bold text-emerald-600">{item.total_reverted}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* Incoming Dispatches */
                isLoadingIncoming ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                ) : incoming.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center shadow-sm">
                        <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="font-bold text-slate-700">No incoming dispatches</h3>
                        <p className="text-sm text-slate-400 mt-1">Pending shipments from Super Admin will show here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {incoming.map((dispatch: IncomingDispatch) => (
                            <div key={dispatch.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-wider">Pending Confirmation</span>
                                        <span className="text-[11px] text-slate-400 font-medium">Dispatched {new Date(dispatch.dispatched_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-black text-slate-800">Dispatch from {dispatch.super_admin.name}</h4>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Truck className="w-3.5 h-3.5" />
                                            <span>{dispatch.vehicle_number} ({dispatch.driver_name})</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <History className="w-3.5 h-3.5" />
                                            <span>Expected: {new Date(dispatch.expected_delivery_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {dispatch.items.map(item => (
                                            <span key={item.id} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                                                {item.dispatched_quantity} × {item.inventory_item.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => openConfirmModal(dispatch)}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 shrink-0"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Confirm Receipt
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Receipt Confirmation Modal */}
            {confirmModal.open && confirmModal.dispatch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
                        <div className="p-8 bg-indigo-600 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Truck className="w-32 h-32" /></div>
                            <h3 className="text-2xl font-black mb-1">Confirm Stock Receipt</h3>
                            <p className="text-indigo-100 text-sm opacity-80">Verify all items and conditions before confirming.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                {confirmModal.dispatch.items.map((item, idx) => (
                                    <div key={item.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-bold text-slate-800">{item.inventory_item.name}</span>
                                            <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md uppercase">
                                                Expected: {item.dispatched_quantity} {item.inventory_item.unit}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Received Qty</label>
                                                <input
                                                    type="number"
                                                    value={receiptForm.items[idx]?.received_quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...receiptForm.items];
                                                        newItems[idx].received_quantity = parseInt(e.target.value) || 0;
                                                        setReceiptForm({ ...receiptForm, items: newItems });
                                                    }}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Condition</label>
                                                <select
                                                    value={receiptForm.items[idx]?.condition}
                                                    onChange={(e) => {
                                                        const newItems = [...receiptForm.items];
                                                        newItems[idx].condition = e.target.value;
                                                        setReceiptForm({ ...receiptForm, items: newItems });
                                                    }}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                >
                                                    <option value="good">Good Condition</option>
                                                    <option value="damaged">Damaged</option>
                                                    <option value="missing">Missing</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Geo-tagged Proof <span className="text-rose-500">*</span></label>
                                        <div className={`relative h-40 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 overflow-hidden ${receiptForm.geo_photo ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setReceiptForm({ ...receiptForm, geo_photo: e.target.files?.[0] || null })}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            {receiptForm.geo_photo ? (
                                                <div className="text-center">
                                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                                                    <p className="text-xs font-bold text-emerald-700">{receiptForm.geo_photo.name}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Camera className="w-8 h-8 text-slate-300" />
                                                    <p className="text-xs font-bold text-slate-400">Click to upload site photo</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl">
                                        <MapPin className="w-5 h-5 text-indigo-600" />
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Location Tagged</p>
                                            <p className="text-[10px] font-bold text-slate-600">{receiptForm.latitude.toFixed(4)}, {receiptForm.longitude.toFixed(4)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Final Notes</label>
                                        <textarea
                                            value={receiptForm.notes}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                                            rows={5}
                                            placeholder="Mention any damaged serial numbers or logistics issues..."
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                        />
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold text-amber-700 leading-tight">By confirming, you acknowledge that items with 'Good' condition are added to your ledger and you take full responsibility for them.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setConfirmModal({ open: false, dispatch: null })}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => confirmMutation.mutate({ id: confirmModal.dispatch!.id, data: receiptForm })}
                                    disabled={!receiptForm.geo_photo || confirmMutation.isPending}
                                    className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
                                >
                                    {confirmMutation.isPending ? 'Processing...' : 'Confirm Receipt & Update Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
