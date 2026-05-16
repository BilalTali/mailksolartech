import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, CheckCircle, Loader2, ArrowLeft, Camera, UploadCloud, ChevronRight, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { useSettings } from '@/hooks/useSettings';
import type { Lead } from '@/types';

export default function SurveyorFormPage() {
    const { ulid } = useParams<{ ulid: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { settings } = useSettings();
    const termsHtml = settings.technical_team_terms || 'I certify that all information provided is accurate and based on physical site measurements.';

    // Form State — initialised empty, then overwritten by useEffect once lead loads
    const [systemCapacityKw, setSystemCapacityKw] = useState('');
    const [panelQuantity, setPanelQuantity] = useState('');
    const [panelModelMake, setPanelModelMake] = useState('');
    const [inverterModelMake, setInverterModelMake] = useState('');
    const [wireLengthMeters, setWireLengthMeters] = useState('');
    const [earthingKitRequired, setEarthingKitRequired] = useState(true);
    const [lightningArresterRequired, setLightningArresterRequired] = useState(true);
    const [prefilled, setPrefilled] = useState(false);

    const [additionalItems, setAdditionalItems] = useState<{ item: string; qty: string }[]>([
        { item: '', qty: '' }
    ]);
    const [siteNotes, setSiteNotes] = useState('');

    // Media & GPS
    const [geoPhoto, setGeoPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationErrorCount, setLocationErrorCount] = useState(0);
    const [agreed, setAgreed] = useState(false);

    // Fetch lead info
    const { data: lead, isLoading } = useQuery({
        queryKey: ['lead-survey', ulid],
        queryFn: async () => {
            const res = await api.get<{ leads: Lead[] }>('/technical/leads');
            return res.data.leads.find(l => l.ulid === ulid);
        },
        enabled: !!ulid,
    });

    // Pre-fill form from admin-set survey_requirement OR base lead data once lead data arrives
    useEffect(() => {
        if (!lead) return;

        const sr = (lead as any)?.survey_requirement;
        
        // 1. System Capacity (kW)
        if (sr?.system_capacity_kw) {
            setSystemCapacityKw(String(sr.system_capacity_kw));
        } else if (lead.system_capacity) {
            // Extract numeric part (e.g., "3" from "3kw")
            const numeric = lead.system_capacity.replace(/[^0-9.]/g, '');
            if (numeric) setSystemCapacityKw(numeric);
        }

        // 2. Panel Make/Model
        if (sr?.panel_model_make) {
            setPanelModelMake(sr.panel_model_make);
        } else if ((lead as any).system_item) {
            setPanelModelMake((lead as any).system_item);
        }

        // 3. Inverter Make/Model
        if (sr?.inverter_model_make) {
            setInverterModelMake(sr.inverter_model_make);
        } else if ((lead as any).system_make) {
            setInverterModelMake((lead as any).system_make);
        }

        // 4. Other fields from SR
        if (sr) {
            if (sr.panel_quantity)      setPanelQuantity(String(sr.panel_quantity));
            if (sr.wire_length_meters)  setWireLengthMeters(String(sr.wire_length_meters));
            if (sr.site_notes)          setSiteNotes(sr.site_notes);
            if (Array.isArray(sr.additional_accessories) && sr.additional_accessories.length > 0) {
                setAdditionalItems(sr.additional_accessories);
            }
            setPrefilled(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lead]);

    const handleAddItem = () => setAdditionalItems([...additionalItems, { item: '', qty: '' }]);
    const handleRemoveItem = (index: number) => setAdditionalItems(additionalItems.filter((_, i) => i !== index));
    const handleUpdateItem = (index: number, field: 'item' | 'qty', value: string) => {
        const newItems = [...additionalItems];
        newItems[index][field] = value;
        setAdditionalItems(newItems);
    };

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setGeoPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const getGeoLocation = () => {
        setLocating(true);
        if (!('geolocation' in navigator)) {
            toast.error('Geolocation not supported by this browser');
            setLocating(false);
            return;
        }

        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            toast.error('Geolocation requires a secure connection (HTTPS)');
            setLocating(false);
            return;
        }

        const optionsHigh = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
        const optionsLow = { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 };

        const onSuccess = (pos: GeolocationPosition) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocating(false);
            setLocationErrorCount(0);
            toast.success('GPS location acquired');
        };

        const onError = (err: GeolocationPositionError) => {
            const newCount = locationErrorCount + 1;
            setLocationErrorCount(newCount);
            setLocating(false);

            let errorMessage = err.message;
            if (err.code === 1) errorMessage = "Permission denied. Please enable location access in your browser settings.";
            if (err.code === 2) errorMessage = "Position unavailable. GPS signal might be weak or blocked.";
            if (err.code === 3) errorMessage = "Location request timed out.";

            if (err.code === 3 && optionsHigh.enableHighAccuracy) {
                toast.loading('High-accuracy GPS failed, trying standard mode...', { duration: 2000 });
                navigator.geolocation.getCurrentPosition(onSuccess, (err2) => {
                    toast.error(`GPS Error: ${err2.message}. Try moving to a window or use "Bypass GPS".`);
                }, optionsLow);
            } else {
                toast.error(`GPS Error: ${errorMessage}. ${newCount >= 2 ? 'Use "Bypass GPS" to continue.' : ''}`);
            }
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, optionsHigh);
    };

    const bypassLocation = () => {
        setLocation({ lat: 0, lng: 0 });
        toast.success('GPS Bypassed (Location set to 0,0)');
    };

    const canSubmit = 
        systemCapacityKw && panelQuantity && panelModelMake && 
        inverterModelMake && wireLengthMeters && geoPhoto && 
        location && agreed;

    const submitMutation = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append('system_capacity_kw', systemCapacityKw);
            fd.append('panel_quantity', panelQuantity);
            fd.append('panel_model_make', panelModelMake);
            fd.append('inverter_model_make', inverterModelMake);
            fd.append('wire_length_meters', wireLengthMeters);
            fd.append('earthing_kit_required', earthingKitRequired ? '1' : '0');
            fd.append('lightning_arrester_required', lightningArresterRequired ? '1' : '0');
            
            // Filter out empty items before sending
            const filteredItems = additionalItems.filter(i => i.item.trim() !== '');
            fd.append('additional_accessories', JSON.stringify(filteredItems));
            
            fd.append('site_notes', siteNotes);
            fd.append('geo_photo', geoPhoto!);
            fd.append('latitude', String(location!.lat));
            fd.append('longitude', String(location!.lng));
            fd.append('agreed_to_terms', '1');

            const res = await api.post(`/technical/leads/${ulid}/survey`, fd);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Site survey submitted successfully! ✅');
            queryClient.invalidateQueries({ queryKey: ['technical-assigned-leads'] });
            navigate('/technical/leads');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error || 'Submission failed';
            toast.error(msg);
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
                <p className="font-bold text-lg text-slate-700">Lead not found or access denied</p>
                <button onClick={() => navigate('/technical/leads')} className="flex items-center gap-2 text-sm text-indigo-600 font-bold hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Back to Leads
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/technical/leads')}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition shrink-0"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-500" />
                        <h1 className="text-xl font-black text-slate-800">Pre-Installation Site Survey</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {lead.beneficiary_name} · <span className="font-mono text-[11px]">{lead.ulid.slice(-8)}</span>
                    </p>
                </div>
            </div>

            {/* Pre-filled banner */}
            {prefilled && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-800 font-medium">
                        <span className="font-black">Spec pre-filled by Admin.</span> Please verify the values below and adjust if needed before submitting.
                    </p>
                </div>
            )}

            {/* GPS Card */}
            <div className={`rounded-2xl border-2 p-4 transition-all ${location ? 'border-emerald-400 bg-emerald-50' : 'border-indigo-200 bg-indigo-50'}`}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <MapPin className={`w-4 h-4 ${location ? 'text-emerald-600' : 'text-indigo-500'}`} />
                            GPS Location
                            <span className="text-red-500">*</span>
                        </div>
                        {location ? (
                            <div className="mt-1 text-xs font-mono text-emerald-700">
                                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                            </div>
                        ) : (
                            <div className="mt-1 text-xs text-indigo-600">Tap to get current GPS coordinates</div>
                        )}
                    </div>
                    {location ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-xl text-emerald-700 font-bold text-xs">
                            <CheckCircle className="w-4 h-4" /> Captured
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={getGeoLocation}
                                disabled={locating}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition disabled:opacity-60 shadow-md shadow-indigo-200 shrink-0"
                            >
                                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                {locating ? 'Locating...' : 'Get GPS'}
                            </button>
                            {locationErrorCount > 0 && !locating && (
                                <button
                                    onClick={bypassLocation}
                                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                >
                                    Bypass GPS (If indoors)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">System Capacity (kW) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            step="0.1"
                            value={systemCapacityKw}
                            onChange={(e) => setSystemCapacityKw(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="e.g. 3.0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Panel Quantity <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            value={panelQuantity}
                            onChange={(e) => setPanelQuantity(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="e.g. 6"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Panel Make/Model <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={panelModelMake}
                            onChange={(e) => setPanelModelMake(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="e.g. Waaree 540W"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Inverter Make/Model <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={inverterModelMake}
                            onChange={(e) => setInverterModelMake(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="e.g. Growatt 3kW"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Wire Length (Meters) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            value={wireLengthMeters}
                            onChange={(e) => setWireLengthMeters(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="e.g. 30"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input 
                            type="checkbox" 
                            checked={earthingKitRequired} 
                            onChange={(e) => setEarthingKitRequired(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-700 text-sm">Earthing Kit Required</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input 
                            type="checkbox" 
                            checked={lightningArresterRequired} 
                            onChange={(e) => setLightningArresterRequired(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-700 text-sm">Lightning Arrester Required</span>
                    </label>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-slate-700">Additional Hardware / Items Needed</label>
                        <button 
                            type="button" 
                            onClick={handleAddItem}
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg"
                        >
                            + Add Item
                        </button>
                    </div>
                    <div className="space-y-3">
                        {additionalItems.map((item, idx) => (
                            <div key={idx} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                                <input
                                    type="text"
                                    value={item.item}
                                    onChange={(e) => handleUpdateItem(idx, 'item', e.target.value)}
                                    placeholder="e.g. Extra 4mm DC Cable"
                                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm"
                                />
                                <input
                                    type="text"
                                    value={item.qty}
                                    onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                                    placeholder="Qty"
                                    className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm text-center"
                                />
                                {additionalItems.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Site Notes / Observations</label>
                    <textarea
                        value={siteNotes}
                        onChange={(e) => setSiteNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition resize-none text-sm"
                        placeholder="Any specific instructions for dispatch or installation..."
                    />
                </div>
            </div>

            {/* Photo Capture */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-500" />
                    Geo-tagged Site Photo <span className="text-red-500">*</span>
                </div>
                {photoPreview ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-64">
                        <img src={photoPreview} alt="Site preview" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer font-bold transition">
                            <Camera className="w-5 h-5 mr-2" /> Retake Photo
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                        </label>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 transition cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition">
                            <Camera className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600" />
                        </div>
                        <span className="font-bold text-slate-600 text-sm group-hover:text-indigo-600">Tap to Capture Photo</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                    </label>
                )}
            </div>

            {/* Terms & Submit */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 space-y-4">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">✦</span>
                    Declaration
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 italic leading-relaxed">
                    {termsHtml}
                </div>
                <label className="flex items-center gap-3 cursor-pointer group" htmlFor="agreed-terms">
                    <input
                        id="agreed-terms"
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition">
                        I agree and authorize this survey submission
                    </span>
                </label>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-4 space-y-2">
                <button
                    onClick={() => submitMutation.mutate()}
                    disabled={!canSubmit || submitMutation.isPending}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl font-black text-base tracking-wide hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-indigo-300 disabled:shadow-none"
                >
                    {submitMutation.isPending ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                    ) : (
                        <><UploadCloud className="w-5 h-5" /> Submit Survey Data <ChevronRight className="w-5 h-5" /></>
                    )}
                </button>
                {!canSubmit && !submitMutation.isPending && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-600 font-bold flex flex-wrap justify-center gap-x-3 gap-y-1 shadow-sm animate-in fade-in slide-in-from-bottom-1">
                        {!location && <span>📍 GPS Coordinates Missing</span>}
                        {!geoPhoto && <span>📷 Site Photo Required</span>}
                        {(!systemCapacityKw || !panelQuantity) && <span>📝 Capacity & Quantity Required</span>}
                        {(!panelModelMake || !inverterModelMake) && <span>🏗️ Panel & Inverter Models Required</span>}
                        {!wireLengthMeters && <span>⚡ Wire Length Required</span>}
                        {!agreed && <span>☑️ Agreement Required</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
