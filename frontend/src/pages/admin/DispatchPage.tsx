import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Loader2, RefreshCw, Send, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface BillingItem {
    inventory_item_id: number;
    name: string;
    sku: string;
    quantity: number;
}

interface Lead {
    id: number;
    ulid: string;
    beneficiary_name: string;
    beneficiary_mobile: string;
    beneficiary_district: string;
    beneficiary_state: string;
    status: string;
    dispatch_id?: number | null;
    billing_items?: BillingItem[];
    survey_requirement?: {
        system_capacity_kw: number;
        panel_quantity: number;
        panel_model_make: string;
        inverter_model_make: string;
        wire_length_meters: number;
        earthing_kit_required: boolean;
        lightning_arrester_required: boolean;
        site_notes?: string;
    } | null;
}

interface DispatchForm {
    vehicle_number: string;
    driver_name: string;
    driver_mobile: string;
    receipt_number: string;
    notes: string;
}

const EMPTY_FORM: DispatchForm = { vehicle_number: '', driver_name: '', driver_mobile: '', receipt_number: '', notes: '' };

// Leads eligible for dispatch: DISBURSEMENT_VERIFIED
const DISPATCHABLE_STATUSES = ['DISBURSEMENT_VERIFIED'];
const IN_TRANSIT_STATUSES = ['DISPATCH_INITIATED'];

export default function DispatchPage() {
    const queryClient = useQueryClient();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [form, setForm] = useState<DispatchForm>(EMPTY_FORM);
    const [transitLead, setTransitLead] = useState<Lead | null>(null);

    const { data: leads = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-dispatch-leads'],
        queryFn: async () => {
            const res = await api.get('/admin/leads', {
                params: { status: 'DISBURSEMENT_VERIFIED,DISPATCH_INITIATED', per_page: 50 }
            });
            return Array.isArray(res.data.data) ? res.data.data : (res.data.data?.data ?? []);
        },
    });

    const dispatchMutation = useMutation({
        mutationFn: ({ ulid, data }: { ulid: string; data: DispatchForm }) =>
            api.post(`/admin/leads/${ulid}/dispatch`, data),
        onSuccess: () => {
            toast.success('Dispatch initiated ✅');
            setSelectedLead(null);
            setForm(EMPTY_FORM);
            queryClient.invalidateQueries({ queryKey: ['admin-dispatch-leads'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Dispatch failed'),
    });

    const transitMutation = useMutation({
        mutationFn: (ulid: string) => api.post(`/admin/leads/${ulid}/dispatch/transit`),
        onSuccess: () => {
            toast.success('Lead marked as In Transit');
            setTransitLead(null);
            queryClient.invalidateQueries({ queryKey: ['admin-dispatch-leads'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
    });

    const canDispatch = form.vehicle_number.trim() && form.driver_name.trim() && form.driver_mobile.trim();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Dispatch Management</h1>
                        <p className="text-sm text-slate-500">Initiate material dispatch for verified installations</p>
                    </div>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
            ) : leads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-600">No leads ready for dispatch</p>
                    <p className="text-sm text-slate-400">Leads appear here after disbursement is verified.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_auto] text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <div>Beneficiary</div><div>Location · Status</div><div className="text-right">Actions</div>
                    </div>
                    {leads.map((lead: Lead) => {
                        const needsDispatch = DISPATCHABLE_STATUSES.includes(lead.status);
                        const needsTransit = IN_TRANSIT_STATUSES.includes(lead.status);
                        return (
                            <div key={lead.id} className="grid grid-cols-[1fr_1fr_auto] items-center px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                                <div>
                                    <div className="font-bold text-slate-800">{lead.beneficiary_name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{lead.ulid.slice(-10)} · {lead.beneficiary_mobile}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-600">{lead.beneficiary_district}, {lead.beneficiary_state}</div>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide">
                                        {lead.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {needsDispatch && (
                                        <button id={`btn-dispatch-${lead.ulid}`} onClick={() => { setSelectedLead(lead); setForm(EMPTY_FORM); }}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 transition">
                                            <Send className="w-3.5 h-3.5" /> Dispatch
                                        </button>
                                    )}
                                    {needsTransit && (
                                        <button id={`btn-in-transit-${lead.ulid}`} onClick={() => setTransitLead(lead)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition">
                                            <Truck className="w-3.5 h-3.5" /> Mark In Transit
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Dispatch Form Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><Truck className="w-5 h-5 text-sky-600" /></div>
                            <div><h3 className="font-black text-slate-800">Initiate Dispatch</h3><p className="text-xs text-slate-500">{selectedLead.beneficiary_name}</p></div>
                        </div>

                        {/* Surveyor's Material Specification */}
                        {selectedLead.survey_requirement && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                    <Package className="w-3 h-3" />
                                    Surveyor's Material Specification
                                </h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                    <div className="text-[11px] flex flex-col">
                                        <span className="text-slate-400 font-bold uppercase tracking-tighter">System Size</span>
                                        <span className="text-slate-800 font-black">{selectedLead.survey_requirement.system_capacity_kw} kW</span>
                                    </div>
                                    <div className="text-[11px] flex flex-col">
                                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Panels</span>
                                        <span className="text-slate-800 font-black">{selectedLead.survey_requirement.panel_quantity}x {selectedLead.survey_requirement.panel_model_make}</span>
                                    </div>
                                    <div className="text-[11px] flex flex-col">
                                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Inverter</span>
                                        <span className="text-slate-800 font-black">{selectedLead.survey_requirement.inverter_model_make}</span>
                                    </div>
                                    <div className="text-[11px] flex flex-col">
                                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Wire</span>
                                        <span className="text-slate-800 font-black">{selectedLead.survey_requirement.wire_length_meters} Meters</span>
                                    </div>
                                    <div className="col-span-2 flex flex-wrap gap-2 pt-1 border-t border-amber-100 mt-1">
                                        {selectedLead.survey_requirement.earthing_kit_required && <span className="px-1.5 py-0.5 bg-white border border-amber-200 rounded text-[9px] font-black text-amber-700">EARTHING KIT</span>}
                                        {selectedLead.survey_requirement.lightning_arrester_required && <span className="px-1.5 py-0.5 bg-white border border-amber-200 rounded text-[9px] font-black text-amber-700">LA KIT</span>}
                                    </div>
                                </div>
                                {selectedLead.survey_requirement.site_notes && (
                                    <p className="text-[10px] text-amber-800 italic bg-amber-100/50 p-2 rounded-lg mt-2 border border-amber-200/50">
                                        <span className="font-bold not-italic mr-1">Note:</span> {selectedLead.survey_requirement.site_notes}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Pre-Allocated Bill of Materials Display */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Package className="w-3 h-3" />
                                Pre-Allocated Bill of Materials (Billing)
                            </h4>
                            {selectedLead.billing_items && selectedLead.billing_items.length > 0 ? (
                                <ul className="space-y-1.5 mt-2">
                                    {selectedLead.billing_items.map((item: BillingItem, i: number) => (
                                        <li key={i} className="text-[11px] text-slate-700 flex justify-between bg-white px-2 py-1.5 rounded shadow-sm border border-slate-100">
                                            <span className="truncate pr-2">{item.name}</span>
                                            <span className="font-bold shrink-0 whitespace-nowrap">Qty: {item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No billing data found. Using Surveyor specs as reference.</p>
                            )}
                        </div>

                        {/* Logistics Form Fields */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Truck className="w-3 h-3" />
                                Logistics Details
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'vehicle_number', label: 'Vehicle Number', placeholder: 'e.g. RJ14CD1234', required: true },
                                    { key: 'driver_name', label: 'Driver Name', placeholder: 'Full name', required: true },
                                    { key: 'driver_mobile', label: 'Driver Mobile', placeholder: '10-digit number', required: true },
                                    { key: 'receipt_number', label: 'Receipt Number', placeholder: 'Optional', required: false },
                                ].map(({ key, label, placeholder, required }) => (
                                    <div key={key} className={key === 'driver_name' ? 'col-span-2' : ''}>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
                                        <input
                                            id={`input-dispatch-${key}`}
                                            type="text"
                                            placeholder={placeholder}
                                            value={form[key as keyof DispatchForm]}
                                            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>
                                ))}
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Notes (optional)</label>
                                    <textarea 
                                        rows={2} 
                                        placeholder="Internal logistics notes..." 
                                        value={form.notes} 
                                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} 
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setSelectedLead(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition">Cancel</button>
                            <button 
                                id="btn-confirm-dispatch" 
                                onClick={() => dispatchMutation.mutate({ ulid: selectedLead.ulid, data: form })} 
                                disabled={!canDispatch || dispatchMutation.isPending}
                                className="flex-[2] py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {dispatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {dispatchMutation.isPending ? 'Processing...' : 'Confirm & Dispatch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* In Transit Confirm Modal */}
            {transitLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
                        <Truck className="w-12 h-12 text-amber-500 mx-auto" />
                        <h3 className="font-black text-slate-800">Mark as In Transit?</h3>
                        <p className="text-sm text-slate-500">{transitLead.beneficiary_name} — consumer will be notified.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setTransitLead(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm">Cancel</button>
                            <button id="btn-confirm-transit" onClick={() => transitMutation.mutate(transitLead.ulid)} disabled={transitMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition disabled:opacity-50">
                                {transitMutation.isPending ? 'Updating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
