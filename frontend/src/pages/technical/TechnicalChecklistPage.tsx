import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    ArrowLeft, CheckCircle2, Loader2, AlertCircle, Package,
    PackageCheck, RotateCcw, ClipboardList, ShieldCheck, Info,
    MapPin, ChevronRight, Minus, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface DispatchedItem {
    id: number;
    name: string;
    quantity: number;
    serial_number: string | null;
    dispatched_at: string | null;
}

interface SurveySpec {
    system_capacity_kw: string;
    panel_quantity: number;
    panel_model_make: string;
    inverter_model_make: string;
    wire_length_meters: string;
    earthing_kit_required: boolean;
    lightning_arrester_required: boolean;
    additional_accessories: { item: string; qty: string }[];
    site_notes: string | null;
}

interface LeadData {
    id: number;
    ulid: string;
    beneficiary_name: string;
    beneficiary_district: string;
    beneficiary_state: string;
    status: string;
    survey_requirement: SurveySpec | null;
    dispatched_items: DispatchedItem[];
}

export default function TechnicalChecklistPage() {
    const { ulid } = useParams<{ ulid: string }>();
    const navigate = useNavigate();

    // Per-item: how many consumed vs returned
    const [reconciliation, setReconciliation] = useState<Record<number, { consumed: number; reverted: number }>>({});
    const [notes, setNotes] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationErrorCount, setLocationErrorCount] = useState(0);

    // Annexure B Fields (Optional)
    const [inverterRating, setInverterRating] = useState('');
    const [remoteMonitoringConfigured, setRemoteMonitoringConfigured] = useState(false);
    const [dcdbRating, setDcdbRating] = useState('');
    const [acdbRating, setAcdbRating] = useState('');
    const [dcWireType, setDcWireType] = useState('');
    const [dcWireSize, setDcWireSize] = useState('');
    const [acWireType, setAcWireType] = useState('');
    const [acWireSize, setAcWireSize] = useState('');
    const [earthWireType, setEarthWireType] = useState('');
    const [earthWireSize, setEarthWireSize] = useState('');

    // Fetch lead checklist data
    const { data: lead, isLoading } = useQuery<LeadData>({
        queryKey: ['technical-checklist', ulid],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { lead: LeadData } }>(
                `/technical/leads/${ulid}/checklist`
            );
            const l = res.data.data.lead as any;
            // Build initial reconciliation — all consumed, none reverted
            const items: DispatchedItem[] = l.dispatched_items || [];
            const init: Record<number, { consumed: number; reverted: number }> = {};
            items.forEach((item) => {
                init[item.id] = { consumed: item.quantity, reverted: 0 };
            });
            setReconciliation(init);
            return l as LeadData;
        },
        enabled: !!ulid,
    });

    const getGps = () => {
        setLocating(true);
        const optionsHigh = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
        const optionsLow = { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 };

        const onSuccess = (pos: GeolocationPosition) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocating(false);
            setLocationErrorCount(0);
            toast.success('GPS location captured');
        };

        const onError = (err: GeolocationPositionError) => {
            const newCount = locationErrorCount + 1;
            setLocationErrorCount(newCount);
            setLocating(false);
            
            let msg = err.message;
            if (err.code === 1) msg = "Permission denied. Check browser settings.";
            if (err.code === 2) msg = "Position unavailable. GPS signal weak.";
            if (err.code === 3) msg = "Location request timed out.";

            if (err.code === 3 && optionsHigh.enableHighAccuracy) {
                toast.loading('High-accuracy failed, trying standard GPS...', { duration: 2000 });
                navigator.geolocation.getCurrentPosition(onSuccess, (err2) => {
                    toast.error(`GPS Error: ${err2.message}. Use bypass if indoors.`);
                }, optionsLow);
            } else {
                toast.error(`GPS Error: ${msg}. ${newCount >= 2 ? 'Use Bypass if you cannot get a fix.' : ''}`);
            }
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, optionsHigh);
    };

    const bypassGps = () => {
        setLocation({ lat: 0, lng: 0 });
        toast.success('GPS Bypassed (0,0)');
    };

    const adjustItem = (id: number, field: 'consumed' | 'reverted', delta: number) => {
        setReconciliation((prev) => {
            const cur = prev[id] || { consumed: 0, reverted: 0 };
            const item = lead?.dispatched_items.find((i) => i.id === id);
            if (!item) return prev;

            let newConsumed = cur.consumed;
            let newReverted = cur.reverted;

            if (field === 'consumed') {
                newConsumed = Math.max(0, Math.min(item.quantity, cur.consumed + delta));
                newReverted = item.quantity - newConsumed;
            } else {
                newReverted = Math.max(0, Math.min(item.quantity, cur.reverted + delta));
                newConsumed = item.quantity - newReverted;
            }

            return { ...prev, [id]: { consumed: newConsumed, reverted: newReverted } };
        });
    };

    const totalReverted = Object.values(reconciliation).reduce((s, r) => s + r.reverted, 0);

    const submitMutation = useMutation({
        mutationFn: async () => {
            // Use the existing installation endpoint — send reconciliation + notes
            const fd = new FormData();
            fd.append('inventory_reconciliation', JSON.stringify(reconciliation));
            fd.append('notes', notes);
            fd.append('latitude', String(location?.lat || 0));
            fd.append('longitude', String(location?.lng || 0));
            fd.append('agreed_to_terms', '1');
            fd.append('checklist_only', '1'); // flag to skip photo requirements

            // Annexure B fields
            fd.append('inverter_rating', inverterRating);
            fd.append('remote_monitoring_configured', remoteMonitoringConfigured ? '1' : '0');
            fd.append('dcdb_rating', dcdbRating);
            fd.append('acdb_rating', acdbRating);
            fd.append('dc_wire_type', dcWireType);
            fd.append('dc_wire_size', dcWireSize);
            fd.append('ac_wire_type', acWireType);
            fd.append('ac_wire_size', acWireSize);
            fd.append('earth_wire_type', earthWireType);
            fd.append('earth_wire_size', earthWireSize);
            const res = await api.post(`/technical/leads/${ulid}/installation`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Inventory checklist submitted ✅');
            navigate('/technical/leads');
        },
        onError: (err: any) => {
            // If backend rejects the checklist-only route, fall through gracefully
            const msg = err?.response?.data?.message || err?.response?.data?.error || 'Submission failed';
            toast.error(msg);
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
                <AlertCircle className="w-14 h-14 text-red-400" />
                <p className="font-bold text-lg text-slate-700">Lead not found or access denied</p>
                <button onClick={() => navigate('/technical/leads')} className="flex items-center gap-2 text-sm text-orange-600 font-bold hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Back to Leads
                </button>
            </div>
        );
    }

    const hasItems = lead.dispatched_items && lead.dispatched_items.length > 0;
    const canSubmit = agreed && hasItems;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/technical/leads')} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition shrink-0">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-orange-500" />
                        <h1 className="text-xl font-black text-slate-800">Material Checklist</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {lead.beneficiary_name} · <span className="font-mono text-[11px]">{lead.ulid.slice(-8)}</span>
                        {totalReverted > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                <RotateCcw className="w-3 h-3" /> {totalReverted} items to return
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-800">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold mb-0.5">What is this checklist?</p>
                    <p className="text-xs leading-relaxed">Verify what materials were delivered, mark how many were <strong>used</strong> in the installation, and flag any <strong>unused/surplus items</strong> to be returned to the warehouse.</p>
                </div>
            </div>

            {/* Surveyor Spec — What was ORDERED */}
            {lead.survey_requirement && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-indigo-50 flex items-center justify-between">
                        <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Surveyor's Material Order
                        </h2>
                        <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">Survey Verified</span>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {[
                                { label: 'Capacity', value: `${lead.survey_requirement.system_capacity_kw} kW` },
                                { label: 'Panels', value: `${lead.survey_requirement.panel_quantity} units` },
                                { label: 'Panel Model', value: lead.survey_requirement.panel_model_make },
                                { label: 'Inverter', value: lead.survey_requirement.inverter_model_make },
                                { label: 'DC Wire', value: `${lead.survey_requirement.wire_length_meters} m` },
                                { label: 'Earthing Kit', value: lead.survey_requirement.earthing_kit_required ? '✓ Required' : '✗ Not needed' },
                                { label: 'LA', value: lead.survey_requirement.lightning_arrester_required ? '✓ Required' : '✗ Not needed' },
                            ].map((s, i) => (
                                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{s.value}</p>
                                </div>
                            ))}
                        </div>
                        {lead.survey_requirement.additional_accessories.length > 0 && (
                            <div className="border-t border-slate-100 pt-3">
                                <p className="text-xs font-bold text-slate-500 mb-2">Additional Accessories Ordered:</p>
                                <div className="flex flex-wrap gap-2">
                                    {lead.survey_requirement.additional_accessories.map((acc, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                                            <Package className="w-3 h-3" /> {acc.item} <span className="font-black">×{acc.qty}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dispatched Items — What was actually DELIVERED */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-emerald-50 flex items-center justify-between">
                    <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-emerald-600" /> Delivered Items — Mark Usage
                    </h2>
                    <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                        {lead.dispatched_items.length} items
                    </span>
                </div>

                {!hasItems ? (
                    <div className="p-8 text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-600 text-sm">No dispatched items recorded</p>
                        <p className="text-xs mt-1">The admin may not have logged inventory items for this dispatch.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {lead.dispatched_items.map((item) => {
                            const rec = reconciliation[item.id] || { consumed: item.quantity, reverted: 0 };
                            const allUsed = rec.reverted === 0;
                            const someReturn = rec.reverted > 0;

                            return (
                                <div key={item.id} className={`p-5 transition-colors ${someReturn ? 'bg-orange-50/40' : ''}`}>
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div>
                                            <p className="font-black text-slate-800">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-500">Total Delivered: <span className="font-black text-slate-700">{item.quantity}</span></span>
                                                {item.serial_number && (
                                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">SN: {item.serial_number}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                            allUsed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                        }`}>
                                            {allUsed ? <CheckCircle2 className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                                            {allUsed ? 'All Used' : `${rec.reverted} to return`}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Consumed */}
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Used in Installation</p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => adjustItem(item.id, 'consumed', -1)}
                                                    disabled={rec.consumed <= 0}
                                                    className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition disabled:opacity-30"
                                                >
                                                    <Minus className="w-3.5 h-3.5 text-emerald-700" />
                                                </button>
                                                <span className="flex-1 text-center text-xl font-black text-emerald-800">{rec.consumed}</span>
                                                <button
                                                    onClick={() => adjustItem(item.id, 'consumed', 1)}
                                                    disabled={rec.consumed >= item.quantity}
                                                    className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition disabled:opacity-30"
                                                >
                                                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reverted */}
                                        <div className={`border rounded-xl p-3 ${rec.reverted > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${rec.reverted > 0 ? 'text-orange-700' : 'text-slate-400'}`}>
                                                To Return / Unused
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => adjustItem(item.id, 'reverted', -1)}
                                                    disabled={rec.reverted <= 0}
                                                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition disabled:opacity-30 ${rec.reverted > 0 ? 'bg-white border-orange-200 hover:bg-orange-100' : 'bg-white border-slate-200'}`}
                                                >
                                                    <Minus className={`w-3.5 h-3.5 ${rec.reverted > 0 ? 'text-orange-700' : 'text-slate-400'}`} />
                                                </button>
                                                <span className={`flex-1 text-center text-xl font-black ${rec.reverted > 0 ? 'text-orange-700' : 'text-slate-300'}`}>{rec.reverted}</span>
                                                <button
                                                    onClick={() => adjustItem(item.id, 'reverted', 1)}
                                                    disabled={rec.reverted >= item.quantity}
                                                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition disabled:opacity-30 ${rec.reverted > 0 ? 'bg-white border-orange-200 hover:bg-orange-100' : 'bg-white border-slate-200'}`}
                                                >
                                                    <Plus className={`w-3.5 h-3.5 ${rec.reverted > 0 ? 'text-orange-700' : 'text-slate-400'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Summary */}
            {totalReverted > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-4">
                    <RotateCcw className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-black text-orange-800 text-sm">Items to Return to Warehouse</p>
                        <p className="text-xs text-orange-700 mt-1">
                            {Object.entries(reconciliation)
                                .filter(([, r]) => r.reverted > 0)
                                .map(([id, r]) => {
                                    const item = lead.dispatched_items.find((i) => i.id === Number(id));
                                    return item ? `${item.name} ×${r.reverted}` : null;
                                })
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                        <p className="text-[10px] text-orange-600 mt-2 font-bold">Please ensure these are packed and returned to the admin with this submission reference.</p>
                    </div>
                </div>
            )}

            {/* Annexure B - Technical Details */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-indigo-50 flex items-center justify-between">
                    <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> Technical Details (Annexure B) - Optional
                    </h2>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inverter Rating</label>
                            <input
                                type="text"
                                value={inverterRating}
                                onChange={(e) => setInverterRating(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm"
                                placeholder="e.g. 5kW"
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 w-full p-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                                <input 
                                    type="checkbox" 
                                    checked={remoteMonitoringConfigured} 
                                    onChange={(e) => setRemoteMonitoringConfigured(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-bold text-slate-700 text-[11px]">Remote Monitoring Configured?</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">DCDB Rating</label>
                            <input
                                type="text"
                                value={dcdbRating}
                                onChange={(e) => setDcdbRating(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm"
                                placeholder="e.g. 2 In 2 Out"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ACDB Rating</label>
                            <input
                                type="text"
                                value={acdbRating}
                                onChange={(e) => setAcdbRating(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm"
                                placeholder="e.g. 3 Phase"
                            />
                        </div>
                        
                        {/* Wires */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">DC Wire Type & Size</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={dcWireType}
                                    onChange={(e) => setDcWireType(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    placeholder="Type"
                                />
                                <input
                                    type="text"
                                    value={dcWireSize}
                                    onChange={(e) => setDcWireSize(e.target.value)}
                                    className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    placeholder="Size"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">AC Wire Type & Size</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={acWireType}
                                    onChange={(e) => setAcWireType(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    placeholder="Type"
                                />
                                <input
                                    type="text"
                                    value={acWireSize}
                                    onChange={(e) => setAcWireSize(e.target.value)}
                                    className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    placeholder="Size"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Earth Wire Type & Size</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={earthWireType}
                                    onChange={(e) => setEarthWireType(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    placeholder="Type"
                                />
                                <input
                                    type="text"
                                    value={earthWireSize}
                                    onChange={(e) => setEarthWireSize(e.target.value)}
                                    className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    placeholder="Size"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <label className="block text-sm font-black text-slate-700 mb-2">Notes / Remarks (optional)</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any issues with materials, site conditions, or items to flag..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                />
            </div>

            {/* GPS (optional but recommended) */}
            <div className={`rounded-2xl border-2 p-4 transition-all ${location ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <MapPin className={`w-4 h-4 ${location ? 'text-emerald-600' : 'text-slate-400'}`} />
                            GPS Location <span className="text-xs font-normal text-slate-400">(recommended)</span>
                        </div>
                        {location && (
                            <p className="text-xs font-mono text-emerald-700 mt-1">
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                        )}
                    </div>
                    {location ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-xl text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" /> Captured
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={getGps}
                                disabled={locating}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition disabled:opacity-60 shrink-0"
                            >
                                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                {locating ? 'Locating...' : 'Get GPS'}
                            </button>
                            {locationErrorCount > 0 && !locating && (
                                <button
                                    onClick={bypassGps}
                                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                >
                                    Bypass GPS
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Agreement */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer shrink-0"
                    />
                    <span className="text-sm font-bold text-slate-700">
                        I confirm that the quantities above are accurate and reflect the actual materials used at the installation site. Any unused items listed will be returned to the warehouse.
                    </span>
                </label>
            </div>

            {/* Submit */}
            <div className="sticky bottom-4">
                <button
                    onClick={() => submitMutation.mutate()}
                    disabled={!canSubmit || submitMutation.isPending}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-base hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-orange-200 disabled:shadow-none"
                >
                    {submitMutation.isPending
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                        : <><ClipboardList className="w-5 h-5" /> Submit Inventory Checklist <ChevronRight className="w-5 h-5" /></>
                    }
                </button>
                {!canSubmit && !submitMutation.isPending && (
                    <div className="mt-2 bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-600 font-bold flex flex-wrap justify-center gap-x-3 gap-y-1">
                        {!hasItems && <span>📦 No dispatched items to reconcile</span>}
                        {!agreed && <span>☑️ Agreement required</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
