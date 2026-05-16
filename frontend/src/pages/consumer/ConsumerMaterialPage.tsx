import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageOpen, Truck, CheckCircle2, Loader2, FileText, Camera, MapPin, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

export default function ConsumerMaterialPage() {
    const queryClient = useQueryClient();

    // Site Verification Form State
    const [geoPhoto, setGeoPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['consumer-dashboard'],
        queryFn: async () => {
            const res = await api.get('/consumer/dashboard');
            return res.data.data;
        },
    });

    const acknowledgeMutation = useMutation({
        mutationFn: () => api.post('/consumer/acknowledge-material'),
        onSuccess: () => {
            toast.success('Material receipt acknowledged!');
            queryClient.invalidateQueries({ queryKey: ['consumer-dashboard'] });
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || 'Failed to acknowledge material');
        }
    });

    const verifyMutation = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append('geo_photo_with_material', geoPhoto!);
            fd.append('latitude', String(location!.lat));
            fd.append('longitude', String(location!.lng));
            fd.append('agreed_to_terms', '1');

            const res = await api.post('/consumer/verify-installer-material', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Site verification successful! ✅');
            queryClient.invalidateQueries({ queryKey: ['consumer-dashboard'] });
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error || 'Verification failed';
            toast.error(msg);
        },
    });

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
            toast.error('Geolocation not supported');
            setLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocating(false);
                toast.success('GPS location acquired');
            },
            (err) => {
                setLocating(false);
                toast.error(`Location error: ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const canSubmitVerify = geoPhoto && location && agreed;

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    const lead = dashboard?.lead;
    const isDispatched = ['DISPATCH_INITIATED', 'IN_TRANSIT'].includes(lead?.status || '');
    
    // Check if the system needs consumer site verification (Step 19)
    const needsSiteVerification = lead?.status === 'MATERIAL_RECEIVED_BY_INSTALLER';
    
    const isSiteVerified = [
        'MATERIAL_VERIFIED_BY_CONSUMER', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', 
        'SOLAR_INSTALLED', 'INSTALLATION_COMPLETED', 'INSTALLATION_VERIFIED', 
        'POD_INSPECTION_INITIATED', 'POD_SUCCESSFUL', 'PROJECT_COMMISSIONING', 
        'SUBSIDY_REQUEST', 'SUBSIDY_DISBURSED', 'LEAD_COMPLETED'
    ].includes(lead?.status || '');

    const isReceived = isSiteVerified || [
        'DELIVERED', 'MATERIAL_DISPATCHED_TO_INSTALLER'
    ].includes(lead?.status || '');

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-slate-800">Material Delivery</h1>
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-4">
                    {needsSiteVerification ? (
                        <div className="w-full text-left space-y-6">
                            <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-4 pb-4">
                                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 mb-2">
                                    <Camera className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Verify Materials at Site</h2>
                                <p className="text-slate-500 text-sm">
                                    The installer has marked the materials as received at your location. Please provide a photo and GPS location to verify.
                                </p>
                            </div>

                            {/* GPS Card */}
                            <div className={`rounded-2xl border-2 p-4 transition-all ${location ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                            <MapPin className={`w-4 h-4 ${location ? 'text-emerald-600' : 'text-slate-400'}`} />
                                            GPS Location
                                        </div>
                                    </div>
                                    {location ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-xl text-emerald-700 font-bold text-xs">
                                            <CheckCircle2 className="w-4 h-4" /> Captured
                                        </div>
                                    ) : (
                                        <button
                                            onClick={getGeoLocation}
                                            disabled={locating}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition shrink-0"
                                        >
                                            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                            Get GPS
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Photo */}
                            <div>
                                {photoPreview ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-48">
                                        <img src={photoPreview} alt="Site preview" className="w-full h-full object-cover" />
                                        <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer font-bold transition">
                                            <Camera className="w-5 h-5 mr-2" /> Retake
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 transition cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                            <Camera className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600" />
                                        </div>
                                        <span className="font-bold text-slate-600 text-xs group-hover:text-indigo-600">Capture Photo with Material</span>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                                    </label>
                                )}
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-bold text-slate-700">
                                    I confirm these materials have arrived at my site
                                </span>
                            </label>

                            <button
                                onClick={() => verifyMutation.mutate()}
                                disabled={!canSubmitVerify || verifyMutation.isPending}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black hover:shadow-lg hover:shadow-indigo-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                            >
                                {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                Submit Verification
                            </button>
                        </div>
                    ) : isSiteVerified ? (
                        <>
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-2">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">Materials Verified</h2>
                            <p className="text-slate-500 text-sm">
                                You have successfully verified the materials at your site. Installation will proceed shortly.
                            </p>
                        </>
                    ) : isReceived ? (
                        <>
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mb-2">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">Initial Delivery Confirmed</h2>
                            <p className="text-slate-500 text-sm">
                                You have acknowledged the initial delivery. Waiting for installer to arrive and receive materials.
                            </p>
                        </>
                    ) : isDispatched ? (
                        <>
                            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2 animate-bounce">
                                <Truck className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">Material is on the way!</h2>
                            <p className="text-slate-500 text-sm">
                                Your solar system components have been dispatched. Once they arrive at your location, please verify the components and click the button below to acknowledge receipt.
                            </p>
                            
                            <div className="w-full pt-6">
                                <button
                                    onClick={() => acknowledgeMutation.mutate()}
                                    disabled={acknowledgeMutation.isPending}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-black hover:shadow-lg hover:shadow-emerald-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {acknowledgeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageOpen className="w-5 h-5" />}
                                    Acknowledge Material Receipt
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">Pending Dispatch</h2>
                            <p className="text-slate-500 text-sm">
                                Your application is currently processing. We will notify you once the materials have been dispatched from our warehouse.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Surveyor Requirements (What to expect) */}
            {lead?.survey_requirement && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="px-6 py-5 border-b border-slate-100 bg-orange-50/50 flex items-center justify-between">
                        <h3 className="font-black text-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-orange-500" />
                            Your System Specifications
                        </h3>
                        <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full text-orange-600 border border-orange-200 shadow-sm uppercase tracking-widest">Survey Verified</span>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity</p>
                                <p className="text-base font-black text-slate-800">{lead.survey_requirement.system_capacity_kw} kW</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panels</p>
                                <p className="text-base font-black text-slate-800">{lead.survey_requirement.panel_quantity} qty</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inverter</p>
                                <p className="text-base font-black text-slate-800 line-clamp-1">{lead.survey_requirement.inverter_model_make}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DC Wire</p>
                                <p className="text-base font-black text-slate-800">{lead.survey_requirement.wire_length_meters}m</p>
                            </div>
                        </div>

                        {lead.survey_requirement.additional_accessories && lead.survey_requirement.additional_accessories.length > 0 && (
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <p className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2">
                                    <PackageOpen className="w-4 h-4 text-indigo-500" />
                                    Other Hardware to be Delivered:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {lead.survey_requirement.additional_accessories.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100">
                                            <span className="text-sm font-bold text-slate-600">{item.item}</span>
                                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">Qty: {item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {dashboard?.inventory && dashboard.inventory.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-black text-slate-800 flex items-center gap-2">
                            <PackageOpen className="w-5 h-5 text-indigo-500" />
                            Dispatch Details
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {dashboard.inventory.map((item: any) => (
                            <div key={item.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    <p className="text-xs text-slate-500">Qty: {item.quantity} | Dispatched: {item.dispatched_at}</p>
                                </div>
                                {item.serial_number && (
                                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        SN: {item.serial_number}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
