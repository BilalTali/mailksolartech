import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, CheckCircle, Loader2, ArrowLeft, Camera, UploadCloud, ChevronRight, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { useSettings } from '@/hooks/useSettings';
import type { Lead } from '@/types';

export default function MaterialReceiptPage() {
    const { ulid } = useParams<{ ulid: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { settings } = useSettings();
    const termsHtml = settings.technical_team_terms || 'I certify that the materials listed have been received at the installation site in the condition specified.';

    // Form State
    const [condition, setCondition] = useState<'good' | 'damaged' | 'missing_items'>('good');
    const [notes, setNotes] = useState('');
    
    // Media & GPS
    const [geoPhoto1, setGeoPhoto1] = useState<File | null>(null);
    const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
    const [geoPhoto2, setGeoPhoto2] = useState<File | null>(null);
    const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
    
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationErrorCount, setLocationErrorCount] = useState(0);
    const [agreed, setAgreed] = useState(false);

    // Fetch lead info
    const { data: lead, isLoading } = useQuery({
        queryKey: ['lead-receipt', ulid],
        queryFn: async () => {
            const res = await api.get<{ leads: Lead[] }>('/technical/leads');
            return res.data.leads.find(l => l.ulid === ulid);
        },
        enabled: !!ulid,
    });

    const handlePhoto1 = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setGeoPhoto1(file);
            setPhoto1Preview(URL.createObjectURL(file));
        }
    };

    const handlePhoto2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setGeoPhoto2(file);
            setPhoto2Preview(URL.createObjectURL(file));
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
            setLocationErrorCount(prev => prev + 1);
            if (err.code === 3 && optionsHigh.enableHighAccuracy) {
                navigator.geolocation.getCurrentPosition(onSuccess, (err2) => {
                    setLocating(false);
                    toast.error(`GPS Error: ${err2.message}. Please check your location settings.`);
                }, optionsLow);
            } else {
                setLocating(false);
                toast.error(`GPS Error: ${err.message}`);
            }
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, optionsHigh);
    };

    const bypassLocation = () => {
        setLocation({ lat: 0, lng: 0 });
        toast.success('GPS Bypassed (Location set to 0,0)');
    };

    const canSubmit = 
        condition && 
        (condition === 'good' || notes.trim() !== '') &&
        geoPhoto1 && geoPhoto2 && 
        location && agreed;

    const submitMutation = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append('condition', condition);
            if (notes) {
                fd.append('missing_or_damaged_notes', notes);
            }
            fd.append('geo_photo_1', geoPhoto1!);
            fd.append('geo_photo_2', geoPhoto2!);
            fd.append('latitude', String(location!.lat));
            fd.append('longitude', String(location!.lng));
            fd.append('agreed_to_terms', '1');

            const res = await api.post(`/technical/leads/${ulid}/receipt`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Material receipt confirmed successfully! ✅');
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
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
                <p className="font-bold text-lg text-slate-700">Lead not found or access denied</p>
                <button onClick={() => navigate('/technical/leads')} className="flex items-center gap-2 text-sm text-orange-600 font-bold hover:underline">
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
                        <PackageCheck className="w-5 h-5 text-orange-500" />
                        <h1 className="text-xl font-black text-slate-800">Material Receipt</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {lead.beneficiary_name} · <span className="font-mono text-[11px]">{lead.ulid.slice(-8)}</span>
                    </p>
                </div>
            </div>

            {/* Surveyor Requirements Summary */}
            {lead.survey_requirement && (
                <div className="bg-white rounded-2xl border-l-4 border-orange-500 border-y border-r border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                            <PackageCheck className="text-orange-500 w-5 h-5" />
                            Surveyor's Material List
                        </h2>
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded uppercase">Reference Only</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Capacity</p>
                            <p className="text-sm font-black text-slate-800">{lead.survey_requirement.system_capacity_kw} kW</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Panels</p>
                            <p className="text-sm font-black text-slate-800">{lead.survey_requirement.panel_quantity} qty</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Inverter</p>
                            <p className="text-sm font-black text-slate-800 line-clamp-1">{lead.survey_requirement.inverter_model_make}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Wire</p>
                            <p className="text-sm font-black text-slate-800">{lead.survey_requirement.wire_length_meters}m</p>
                        </div>
                    </div>

                    {lead.survey_requirement.additional_accessories && lead.survey_requirement.additional_accessories.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Additional Items Required:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {lead.survey_requirement.additional_accessories.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 px-3 bg-orange-50/50 rounded-lg border border-orange-100/50">
                                        <span className="text-xs font-bold text-slate-700">{item.item}</span>
                                        <span className="text-xs font-black text-orange-600 bg-white px-2 py-0.5 rounded shadow-sm">{item.qty}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* GPS Card */}
            <div className={`rounded-2xl border-2 p-4 transition-all ${location ? 'border-emerald-400 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <MapPin className={`w-4 h-4 ${location ? 'text-emerald-600' : 'text-orange-500'}`} />
                            GPS Location
                            <span className="text-red-500">*</span>
                        </div>
                        {location ? (
                            <div className="mt-1 text-xs font-mono text-emerald-700">
                                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                            </div>
                        ) : (
                            <div className="mt-1 text-xs text-orange-600">Tap to get current GPS coordinates</div>
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
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition disabled:opacity-60 shadow-md shadow-orange-200 shrink-0"
                            >
                                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                {locating ? 'Locating...' : 'Get GPS'}
                            </button>
                            {locationErrorCount > 0 && !locating && (
                                <button
                                    onClick={bypassLocation}
                                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                >
                                    Bypass GPS (Dev/Error)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Material Condition <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button 
                            type="button"
                            onClick={() => setCondition('good')}
                            className={`p-3 border-2 rounded-xl text-sm font-bold transition-all ${condition === 'good' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                        >
                            <span className="flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/> Good Condition</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setCondition('damaged')}
                            className={`p-3 border-2 rounded-xl text-sm font-bold transition-all ${condition === 'damaged' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-rose-300'}`}
                        >
                            Damaged
                        </button>
                        <button 
                            type="button"
                            onClick={() => setCondition('missing_items')}
                            className={`p-3 border-2 rounded-xl text-sm font-bold transition-all ${condition === 'missing_items' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-amber-300'}`}
                        >
                            Missing Items
                        </button>
                    </div>
                </div>

                {condition !== 'good' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Details of Damage / Missing Items <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 transition resize-none"
                            placeholder="Please explain what is damaged or missing..."
                        />
                    </div>
                )}
            </div>

            {/* Photo Capture */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-orange-500" />
                    Site Verification Photos <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Photo 1 */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Photo 1 (Solar Panels & Inverter)</label>
                        {photo1Preview ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-48">
                                <img src={photo1Preview} alt="Site preview 1" className="w-full h-full object-cover" />
                                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer font-bold transition">
                                    <Camera className="w-5 h-5 mr-2" /> Retake
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto1} />
                                </label>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-orange-50 hover:border-orange-400 transition cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                    <Camera className="w-5 h-5 text-orange-400 group-hover:text-orange-600" />
                                </div>
                                <span className="font-bold text-slate-600 text-xs group-hover:text-orange-600">Capture Photo 1</span>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto1} />
                            </label>
                        )}
                    </div>

                    {/* Photo 2 */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Photo 2 (Balance of System / Wire)</label>
                        {photo2Preview ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-48">
                                <img src={photo2Preview} alt="Site preview 2" className="w-full h-full object-cover" />
                                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer font-bold transition">
                                    <Camera className="w-5 h-5 mr-2" /> Retake
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto2} />
                                </label>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-orange-50 hover:border-orange-400 transition cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                    <Camera className="w-5 h-5 text-orange-400 group-hover:text-orange-600" />
                                </div>
                                <span className="font-bold text-slate-600 text-xs group-hover:text-orange-600">Capture Photo 2</span>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto2} />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* Terms & Submit */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 space-y-4">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">✦</span>
                    Declaration
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-xs text-orange-900 italic leading-relaxed">
                    {termsHtml}
                </div>
                <label className="flex items-center gap-3 cursor-pointer group" htmlFor="agreed-terms">
                    <input
                        id="agreed-terms"
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition">
                        I agree and authorize this receipt submission
                    </span>
                </label>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-4 space-y-2">
                <button
                    onClick={() => submitMutation.mutate()}
                    disabled={!canSubmit || submitMutation.isPending}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-base tracking-wide hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-orange-300 disabled:shadow-none"
                >
                    {submitMutation.isPending ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                    ) : (
                        <><UploadCloud className="w-5 h-5" /> Submit Material Receipt <ChevronRight className="w-5 h-5" /></>
                    )}
                </button>
                {!canSubmit && !submitMutation.isPending && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-600 font-bold flex flex-wrap justify-center gap-x-3 gap-y-1 shadow-sm animate-in fade-in slide-in-from-bottom-1">
                        {!location && <span>📍 GPS Coordinates Missing</span>}
                        {(!geoPhoto1 || !geoPhoto2) && <span>📷 2 Site Photos Required</span>}
                        {condition !== 'good' && !notes.trim() && <span>📝 Damage/Missing Notes Required</span>}
                        {!agreed && <span>☑️ Agreement Required</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
