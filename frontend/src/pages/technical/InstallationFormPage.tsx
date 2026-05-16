import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    MapPin, CheckCircle, Loader2, ArrowLeft, Camera, FileText,
    UploadCloud, X, AlertCircle, ClipboardList, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { useSettings } from '@/hooks/useSettings';

import type { Lead } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SlotState {
    file: File | null;
    preview: string | null;
}

const emptySlot = (): SlotState => ({ file: null, preview: null });

// ─── Document Slot Config ─────────────────────────────────────────────────────
const SLOTS = [
    {
        key: 'image_geo_material',
        label: 'Material at Site',
        desc: 'Geo-tagged photo of all solar materials delivered at site',
        accept: 'image/*',
        isPdf: false,
        hasMake: false,
        hasSerial: false,
    },
    {
        key: 'image_geo_panel_serial',
        label: 'Solar Panel — Serial Number',
        desc: 'Geo-tagged photo of panel serial number tag',
        accept: 'image/*',
        isPdf: false,
        hasMake: true,
        hasSerial: true,
        makeKey: 'make_panel',
        serialKey: 'serial_number_panel',
        makeLabel: 'Panel Make / Brand',
        serialLabel: 'Panel Serial Number',
    },
    {
        key: 'image_geo_erected_la',
        label: 'Erected Lightning Arrester (LA)',
        desc: 'Geo-tagged photo of installed LA structure',
        accept: 'image/*',
        isPdf: false,
        hasMake: false,
        hasSerial: true,
        serialKey: 'serial_number_la',
        serialLabel: 'LA Serial Number',
    },
    {
        key: 'image_geo_earthing',
        label: 'Earthing / Grounding',
        desc: 'Geo-tagged photo of earthing installation',
        accept: 'image/*',
        isPdf: false,
        hasMake: false,
        hasSerial: false,
    },
    {
        key: 'image_geo_inverter_serial',
        label: 'Inverter — Serial Number',
        desc: 'Geo-tagged photo of inverter serial number tag',
        accept: 'image/*',
        isPdf: false,
        hasMake: true,
        hasSerial: true,
        makeKey: 'make_inverter',
        serialKey: 'serial_number_inverter',
        makeLabel: 'Inverter Make / Brand',
        serialLabel: 'Inverter Serial Number',
    },
    {
        key: 'image_agreement_consumer',
        label: 'Consumer Agreement',
        desc: 'Signed consumer agreement document (image or PDF)',
        accept: 'image/*,application/pdf',
        isPdf: true,
        hasMake: false,
        hasSerial: false,
    },
    {
        key: 'image_loan_statement',
        label: 'Loan Statement',
        desc: 'Bank loan statement document (image or PDF)',
        accept: 'image/*,application/pdf',
        isPdf: true,
        hasMake: false,
        hasSerial: false,
    },
    {
        key: 'image_geo_consumer_inverter',
        label: 'Consumer with Inverter',
        desc: 'Geo-tagged photo of consumer standing next to installed inverter',
        accept: 'image/*',
        isPdf: false,
        hasMake: false,
        hasSerial: false,
    },
] as const;

// ─── Slot Upload Card ─────────────────────────────────────────────────────────
function SlotCard({
    slot,
    index,
    slotState,
    textValues,
    onFile,
    onClear,
    onTextChange,
}: {
    slot: (typeof SLOTS)[number];
    index: number;
    slotState: SlotState;
    textValues: Record<string, string>;
    onFile: (key: string, file: File) => void;
    onClear: (key: string) => void;
    onTextChange: (key: string, value: string) => void;
}) {
    const isImage = slotState.file && slotState.file.type.startsWith('image/');
    const isDone = slotState.file !== null;

    return (
        <div
            className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                isDone
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:border-orange-300'
            }`}
            id={`slot-${slot.key}`}
        >
            {/* Header */}
            <div
                className={`flex items-center gap-3 px-4 py-3 border-b ${
                    isDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'
                }`}
            >
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm leading-tight">{slot.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{slot.desc}</div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Make input (if applicable) */}
                {'hasMake' in slot && slot.hasMake && (
                    <div className="mb-3">
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                            {slot.makeLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                            id={`input-${slot.makeKey}`}
                            type="text"
                            placeholder={`e.g. Waaree, Adani...`}
                            value={textValues[slot.makeKey as string] || ''}
                            onChange={(e) => onTextChange(slot.makeKey as string, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition"
                        />
                    </div>
                )}

                {/* Serial input (if applicable) */}
                {'hasSerial' in slot && slot.hasSerial && (
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                            {slot.serialLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                            id={`input-${slot.serialKey}`}
                            type="text"
                            placeholder="Serial No."
                            value={textValues[slot.serialKey as string] || ''}
                            onChange={(e) => onTextChange(slot.serialKey as string, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition"
                        />
                    </div>
                )}

                {/* File Upload */}
                {slotState.file ? (
                    <div className="relative group">
                        {isImage ? (
                            <div className="w-full h-40 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50">
                                <img
                                    src={slotState.preview!}
                                    alt={slot.label}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                                <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-blue-800 truncate">{slotState.file.name}</div>
                                    <div className="text-xs text-blue-600">{(slotState.file.size / 1024).toFixed(0)} KB</div>
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => onClear(slot.key)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                            title="Remove"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <label
                            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition"
                        >
                            <span className="text-white font-bold text-sm flex items-center gap-2">
                                <Camera className="w-4 h-4" /> Retake
                            </span>
                            <input
                                type="file"
                                accept={slot.accept}
                                capture={slot.isPdf ? undefined : 'environment'}
                                className="hidden"
                                onChange={(e) => { if (e.target.files?.[0]) onFile(slot.key, e.target.files[0]); }}
                            />
                        </label>
                    </div>
                ) : (
                    <label
                        className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all group"
                        htmlFor={`file-${slot.key}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center transition">
                            {slot.isPdf ? (
                                <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition" />
                            ) : (
                                <Camera className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition" />
                            )}
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold text-slate-600 group-hover:text-orange-600 transition">
                                {slot.isPdf ? 'Upload Image or PDF' : 'Take Photo'}
                            </div>
                            <div className="text-xs text-slate-400">Max 10 MB</div>
                        </div>
                        <input
                            id={`file-${slot.key}`}
                            type="file"
                            accept={slot.accept}
                            capture={slot.isPdf ? undefined : 'environment'}
                            className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) onFile(slot.key, e.target.files[0]); }}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InstallationFormPage() {
    const { ulid } = useParams<{ ulid: string }>();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const termsHtml = settings.technical_team_terms || 'I certify that all information and photos provided are accurate, captured on-site, and represent the actual installation.';

    // GPS
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationErrorCount, setLocationErrorCount] = useState(0);

    // Terms
    const [agreed, setAgreed] = useState(false);

    const [textValues, setTextValues] = useState<Record<string, string>>({
        make_panel: '',
        serial_number_panel: '',
        make_inverter: '',
        serial_number_inverter: '',
        serial_number_la: '',
    });

    // File slots — keyed by slot.key
    const initialSlots: Record<string, SlotState> = {};
    SLOTS.forEach((s) => { initialSlots[s.key] = emptySlot(); });
    const [slots, setSlots] = useState(initialSlots);

    // Fetch lead info
    const { data, isLoading } = useQuery({
        queryKey: ['technical-installation-form', ulid],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { lead: Lead } }>(
                `/technical/leads/${ulid}/checklist`
            );
            return res.data.data;
        },
        enabled: !!ulid,
    });

    const lead = data?.lead;

    // ── Computed progress ──────────────────────────────────────────────────────
    const imagesUploaded = Object.values(slots).filter((s) => s.file !== null).length;
    const totalImages = SLOTS.length; // 8
    const makesFilledCount = [textValues.make_panel, textValues.make_inverter].filter(Boolean).length;
    const serialsFilledCount = [textValues.serial_number_panel, textValues.serial_number_inverter, textValues.serial_number_la].filter(Boolean).length;

    const canSubmit =
        imagesUploaded === totalImages &&
        makesFilledCount === 2 &&
        serialsFilledCount === 3 &&
        location !== null &&
        agreed;

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleFile = (key: string, file: File) => {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        setSlots((prev) => ({ ...prev, [key]: { file, preview } }));
    };

    const handleClear = (key: string) => {
        setSlots((prev) => ({ ...prev, [key]: emptySlot() }));
    };

    const handleTextChange = (key: string, value: string) => {
        setTextValues((prev) => ({ ...prev, [key]: value }));
    };

    const getGeoLocation = () => {
        setLocating(true);
        if (!('geolocation' in navigator)) {
            toast.error('Geolocation not supported by this browser');
            setLocating(false);
            return;
        }

        const onSuccess = (pos: GeolocationPosition) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocating(false);
            setLocationErrorCount(0);
            toast.success('GPS location acquired');
        };

        const onError = (err: GeolocationPositionError) => {
            setLocationErrorCount(prev => prev + 1);
            setLocating(false);
            toast.error(`GPS Error: ${err.message}. Ensure you are in an open area.`);
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: 20000 });
    };

    const bypassLocation = () => {
        setLocation({ lat: 0, lng: 0 });
        toast.success('GPS Bypassed (Location set to 0,0)');
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const submitMutation = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            // Text fields
            Object.entries(textValues).forEach(([k, v]) => fd.append(k, v));
            // GPS
            fd.append('latitude', String(location!.lat));
            fd.append('longitude', String(location!.lng));
            // Terms
            fd.append('agreed_to_terms', '1');
            // Files
            SLOTS.forEach((slot) => {
                if (slots[slot.key].file) {
                    fd.append(slot.key, slots[slot.key].file!);
                }
            });

            const res = await api.post(`/technical/leads/${ulid}/installation`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Installation documents submitted successfully! ✅');
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
                <AlertCircle className="w-14 h-14 text-red-400" />
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
                        <ClipboardList className="w-5 h-5 text-orange-500" />
                        <h1 className="text-xl font-black text-slate-800">Installation Documentation</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {lead.beneficiary_name} · <span className="font-mono text-[11px]">{lead.ulid.slice(-8)}</span>
                    </p>
                </div>
                {/* Progress pill */}
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                    <span className="text-xs font-black text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">
                        {imagesUploaded}/{totalImages} photos
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {makesFilledCount}/2 makes · {serialsFilledCount}/3 serials
                    </span>
                </div>
            </div>

            {/* GPS Card */}
            <div className={`rounded-2xl border-2 p-4 transition-all ${location ? 'border-emerald-400 bg-emerald-50' : 'border-orange-300 bg-orange-50'}`}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <MapPin className={`w-4 h-4 ${location ? 'text-emerald-600' : 'text-orange-500'}`} />
                            GPS Location
                            <span className="text-red-500">*</span>
                            <span className="text-[10px] font-normal text-slate-500 ml-1">— required for all photos</span>
                        </div>
                        {location ? (
                            <div className="mt-1 text-xs font-mono text-emerald-700">
                                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                            </div>
                        ) : (
                            <div className="mt-1 text-xs text-orange-600">Tap to get current GPS coordinates before uploading</div>
                        )}
                    </div>
                    {location ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-xl text-emerald-700 font-bold text-xs">
                            <CheckCircle className="w-4 h-4" /> Captured
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <button
                                id="btn-get-gps"
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

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">8 Required Photos</span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Document Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SLOTS.map((slot, i) => (
                    <SlotCard
                        key={slot.key}
                        slot={slot}
                        index={i}
                        slotState={slots[slot.key]}
                        textValues={textValues}
                        onFile={handleFile}
                        onClear={handleClear}
                        onTextChange={handleTextChange}
                    />
                ))}
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
                        I agree and authorize this installation submission
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
                        <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Documents...</>
                    ) : (
                        <><UploadCloud className="w-5 h-5" /> Submit Installation Documents <ChevronRight className="w-5 h-5" /></>
                    )}
                </button>
                {!canSubmit && !submitMutation.isPending && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-600 font-bold flex flex-wrap justify-center gap-x-3 gap-y-1 shadow-sm">
                        {!location && <span>📍 GPS Coordinates Missing</span>}
                        {imagesUploaded < totalImages && <span>📷 {totalImages - imagesUploaded} Photos Missing</span>}
                        {makesFilledCount < 2 && <span>📝 Make/Model Details Missing</span>}
                        {serialsFilledCount < 3 && <span>🔢 Serial Numbers Missing</span>}
                        {!agreed && <span>☑️ Agreement Required</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
