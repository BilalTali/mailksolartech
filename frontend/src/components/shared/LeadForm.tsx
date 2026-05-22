import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    User, MapPin, Hash, Zap, IndianRupee,
    FileText, Upload, X, CheckCircle2, AlertCircle, ChevronDown,
    ArrowLeft, ArrowRight,
    Link as LinkIcon
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { leadsApi } from '@/services/leads.api';
import { superAgentApi } from '@/services/superAgent.api';
import { enumeratorApi } from '@/services/enumerator.api';
import { publicApi } from '@/services/public.api';
import { STATE_DISTRICTS, INDIAN_STATES } from '@/constants/locationData';
import MobileInput from '@/components/shared/MobileInput';
import { compressImage } from '@/utils/imageUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

type LeadFormRole = 'agent' | 'super_agent' | 'enumerator' | 'public';

interface FileUploadState {
    file: File | null;
    preview: string | null;
    name: string;
}






// Dynamic options will be fetched from publicApi.getCrmOptions()
const DEFAULT_OPTIONS = {
    discom_name: [{ value: 'JPDCL', label: 'JPDCL' }, { value: 'KPDCL', label: 'KPDCL' }],
    roof_size: [
        { value: 'less_100', label: 'Less than 100 sq ft' },
        { value: '100_200', label: '100 – 200 sq ft' },
        { value: '200_300', label: '200 – 300 sq ft' },
        { value: '300_plus', label: '300+ sq ft' },
    ]
};

// ─── Sub Component ─────────────────────────────────────────────────────────────

function FileUploadBox({
    label, accept, icon: Icon, value, onChange, capture
}: {
    label: string; accept?: string; icon: React.ElementType;
    value: FileUploadState; onChange: (v: FileUploadState) => void;
    capture?: 'user' | 'environment';
}) {
    const ref = useRef<HTMLInputElement>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0] ?? null;
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error(`File size for ${label} must be under 5MB.`);
            return;
        }

        // Compression for images
        if (file.type.startsWith('image/') && file.type !== 'image/gif') {
            setIsCompressing(true);
            try {
                file = await compressImage(file);
            } catch (err) {
                console.error('Compression failed', err);
                toast.error('Image processing failed. Using original.');
            } finally {
                setIsCompressing(false);
            }
        }

        const preview = file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : null;
        onChange({ file, preview, name: file.name });
    };

    const clear = () => {
        onChange({ file: null, preview: null, name: '' });
        if (ref.current) ref.current.value = '';
    };

    const id = `file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            ref.current?.click();
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
            <div
                id={id}
                role="button"
                tabIndex={0}
                onKeyDown={onKeyDown}
                aria-label={`Upload ${label}`}
                className={`relative overflow-hidden border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer min-h-[100px] flex flex-col items-center justify-center gap-2
                    ${value.file
                        ? 'border-green-400 bg-green-50'
                        : isCompressing
                            ? 'border-blue-300 bg-blue-50 cursor-wait'
                            : 'border-slate-200 bg-slate-50 hover:border-orange-400 hover:bg-orange-50'}`}
            >
                <input 
                    ref={ref} 
                    type="file" 
                    accept={accept} 
                    capture={capture as any}
                    className={`absolute inset-0 w-full h-full opacity-0 z-10 ${(value.file || isCompressing) ? 'pointer-events-none' : 'cursor-pointer'}`}
                    onChange={handleFile}
                    disabled={!!(value.file || isCompressing)}
                />
                {isCompressing ? (
                    <>
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold text-blue-600">Optimizing Image...</p>
                    </>
                ) : value.file ? (
                    <>
                        {value.preview
                            ? <img src={value.preview} alt="preview" className="max-h-16 rounded-lg object-contain" />
                            : <FileText className="w-8 h-8 text-green-500" />
                        }
                        <p className="text-xs font-semibold text-green-700 truncate max-w-full px-2">{value.name}</p>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clear(); }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200"
                        >
                            <X size={10} />
                        </button>
                    </>
                ) : (
                    <>
                        <Icon className="w-7 h-7 text-slate-400" />
                        <p className="text-xs text-slate-500">Click to upload <span className="font-semibold text-slate-600">{label}</span></p>
                        <p className="text-[10px] text-slate-400">JPG, PNG or PDF · Max 5MB</p>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface LeadFormProps {
    role: LeadFormRole;
    onSuccess?: (res: any) => void;
}


function Field({ label, name, value, onChange, type = 'text', placeholder = '', required = false, inputMode, autoComplete, pattern }: {
    label: string; name: string; value: string; onChange: (key: string, val: string) => void; type?: string; placeholder?: string; required?: boolean;
    inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
    autoComplete?: string;
    pattern?: string;
}) {
    const id = `field-${name}`;
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(name, e.target.value)}
                placeholder={placeholder}
                required={required}
                aria-required={required}
                inputMode={inputMode}
                autoComplete={autoComplete}
                pattern={pattern}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
        </div>
    );
}

function Select({ label, name, value, onChange, options, required = false, autoComplete }: {
    label: string; name: string; value: string; onChange: (key: string, val: string) => void; options: { value: string; label: string }[]; required?: boolean;
    autoComplete?: string;
}) {
    const id = `select-${name}`;
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={e => onChange(name, e.target.value)}
                    required={required}
                    aria-required={required}
                    autoComplete={autoComplete}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                >
                    <option value="">Select {label}</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}

function SuccessScreen({ role, onDone }: { role: LeadFormRole, onDone: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-20" />
                <CheckCircle2 size={48} className="text-green-600 relative z-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 font-display">Application Submitted!</h2>
            <p className="text-slate-600 max-w-md mb-8">
                Your application for the PM Surya Ghar Muft Bijli Yojana has been successfully recorded.
                {role === 'public' ? ' Our team will review your details and contact you shortly.' : ' It is now visible in your leads list for further processing.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                    onClick={onDone}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all transform hover:-translate-y-1"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
}

export default function LeadForm({ role, onSuccess }: LeadFormProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const backPath = role === 'super_agent' ? '/super-agent/leads' : role === 'agent' ? '/agent/leads' : role === 'enumerator' ? '/enumerator/leads' : '/';

    const [currentStep, setCurrentStep] = useState(1);
    const [form, setForm] = useState({
        beneficiary_name: '',
        beneficiary_mobile: '',
        beneficiary_email: '',
        beneficiary_state: '',
        beneficiary_district: '',
        beneficiary_address: '',
        beneficiary_pincode: '',
        consumer_number: '',
        discom_name: '',
        monthly_bill_amount: '',
        roof_size: '',
        system_capacity: '',
        query_message: '',
        referral_agent_id: '',
        beneficiary_bank_account: '',
        beneficiary_bank_ifsc: '',
        beneficiary_bank_branch: '',
        beneficiary_bank_name: '',
    });

    const [aadhaarFront, setAadhaarFront] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [aadhaarBack, setAadhaarBack] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [electricityBill, setElectricityBill] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [pan, setPan] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [photo, setPhoto] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [solarRoofPhoto, setSolarRoofPhoto] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [bankPassbook, setBankPassbook] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [consumerSignature, setConsumerSignature] = useState<FileUploadState>({ file: null, preview: null, name: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

    // B1: Lead Creation Workflow - Dynamic CRM Options State
    const { data: crmOptions } = useQuery({
        queryKey: ['crmPublicOptions'],
        queryFn: () => publicApi.getCrmOptions(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const getOptions = (category: string) => {
        const remote = crmOptions?.[category];
        if (remote && remote.length > 0) {
            return remote.map((opt: any) => ({ value: opt.value, label: opt.label }));
        }
        return DEFAULT_OPTIONS[category as keyof typeof DEFAULT_OPTIONS] || [];
    };

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    // URL Pre-fill for referral ID
    React.useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref && role === 'public') {
            set('referral_agent_id', ref.toUpperCase().trim());
        }
    }, [searchParams, role]);

    const mutation = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
            if (aadhaarFront.file) fd.append('aadhaar_front', aadhaarFront.file);
            if (aadhaarBack.file) fd.append('aadhaar_back', aadhaarBack.file);
            if (electricityBill.file) fd.append('electricity_bill', electricityBill.file);
            if (photo.file) fd.append('photo', photo.file);
            if (pan.file) fd.append('other', pan.file); // PAN stored as 'other'
            if (solarRoofPhoto.file) fd.append('solar_roof_photo', solarRoofPhoto.file);
            if (bankPassbook.file) fd.append('bank_passbook', bankPassbook.file);
            if (consumerSignature.file) fd.append('consumer_signature', consumerSignature.file);

            if (role === 'super_agent') return superAgentApi.createLead(fd);
            if (role === 'agent') return leadsApi.submitAgentLead(fd);
            if (role === 'enumerator') return enumeratorApi.storeLead(fd);

            return leadsApi.submitPublicLeadForm(fd);
        },
        onSuccess: (res) => {
            toast.success(res.message ?? 'Lead submitted successfully!');
            setIsSubmitted(true);
            if (onSuccess) {
                onSuccess(res);
            }
        },
        onError: (err: any) => {
            const errors = err.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors)[0] as string[];
                toast.error(first?.[0] ?? 'Validation error occurred.');
            } else {
                toast.error(err.response?.data?.message ?? err.message ?? 'Failed to submit lead.');
            }
        }
    });

    const formRef = useRef<HTMLDivElement>(null);

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!form.beneficiary_name) { toast.error('Full Name is required'); return false; }
            if (!form.beneficiary_mobile.match(/^[6-9]\d{9}$/)) { toast.error('Enter a valid 10-digit Indian mobile number'); return false; }
            return true;
        }
        if (step === 2) {
            if (!form.beneficiary_state) { toast.error('State is required'); return false; }
            if (!form.beneficiary_district) { toast.error('District is required'); return false; }
            if (!form.beneficiary_address) { toast.error('Full Address is required'); return false; }
            if (form.beneficiary_pincode.length !== 6) { toast.error('Pincode must be 6 digits'); return false; }
            return true;
        }
        if (step === 3) {
            if (!form.consumer_number) { toast.error('Consumer Number is required'); return false; }
            if (!form.discom_name) { toast.error('DISCOM is required'); return false; }
            if (!form.monthly_bill_amount) { toast.error('Monthly Bill is required'); return false; }
            if (!form.roof_size) { toast.error('Roof Size is required'); return false; }
            if (!form.system_capacity) { toast.error('System Capacity is required'); return false; }
            return true;
        }
        if (step === 4) {
            // Documents are required
            if (!aadhaarFront.file) { toast.error('Aadhaar Front is required'); return false; }
            if (!aadhaarBack.file) { toast.error('Aadhaar Back is required'); return false; }
            if (!electricityBill.file) { toast.error('Electricity bill is required'); return false; }
            if (!pan.file) { toast.error('PAN Card is required'); return false; }
            if (!photo.file) { toast.error('Beneficiary Photo is required'); return false; }
            if (!solarRoofPhoto.file) { toast.error('Solar Roof Photo is required'); return false; }
            if (!bankPassbook.file) { toast.error('Bank Passbook is required'); return false; }
            if (!consumerSignature.file) { toast.error('Consumer Signature is required'); return false; }
            return true;
        }
        return true;
    };

    const scrollToForm = () => {
        if (formRef.current) {
            const yOffset = -100; // Leave some space at top
            const y = formRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(s => s + 1);
            scrollToForm();
        }
    };

    const prevStep = () => {
        setCurrentStep(s => s - 1);
        scrollToForm();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(4)) {
            mutation.mutate();
        }
    };

    const steps = [
        { id: 1, title: 'Personal', icon: User },
        { id: 2, title: 'Location', icon: MapPin },
        { id: 3, title: 'Service', icon: Zap },
        { id: 4, title: 'Finalize', icon: FileText },
    ];

    if (isSubmitted) {
        return <SuccessScreen role={role} onDone={() => navigate(backPath)} />;
    }

    return (
        <div ref={formRef} className="max-w-4xl mx-auto px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(backPath)}
                        aria-label="Go Back"
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 font-display">Apply for Free Solar Electricity</h1>
                        <p className="text-sm text-slate-600 mt-0.5">Step {currentStep} of 4: {steps[currentStep - 1].title}</p>
                    </div>
                </div>

                {/* Progress Mini */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                    {steps.map((s) => (
                        <div
                            key={s.id}
                            className={`h-2 rounded-full transition-all duration-500 ${currentStep >= s.id ? 'bg-orange-500' : 'bg-slate-100'} ${currentStep === s.id ? 'w-8' : 'w-4'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop Stepper */}
            <div className="hidden md:flex items-center justify-between mb-10 px-4 relative">
                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                {steps.map((s) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${currentStep === s.id ? 'bg-orange-500 text-white scale-110 ring-4 ring-orange-100' : currentStep > s.id ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-orange-400'}`}>
                            {currentStep > s.id ? <CheckCircle2 size={24} /> : <s.icon size={22} />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStep === s.id ? 'text-orange-600' : 'text-slate-500'}`}>{s.title}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ───── Step 1: Beneficiary Info ───── */}
                {currentStep === 1 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-white flex items-center gap-2">
                            <User size={16} className="text-orange-500" aria-hidden="true" />
                            <h2 className="font-bold text-slate-700">Beneficiary Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Full Name" name="beneficiary_name" value={form.beneficiary_name} onChange={set} placeholder="Ramesh Kumar" required autoComplete="name" />
                            <MobileInput
                                label="Mobile Number"
                                required
                                value={form.beneficiary_mobile}
                                onChange={(val) => set('beneficiary_mobile', val)}
                                placeholder="98765 43210"
                            />
                            <div className="md:col-span-2">
                                <Field label="Email Address" name="beneficiary_email" value={form.beneficiary_email} onChange={set} type="email" placeholder="citizen@gmail.com" autoComplete="email" />
                            </div>

                            {role === 'public' && (
                                <div className="md:col-span-2 pt-4 border-t border-slate-50 mt-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="referral_agent_id" className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                                            <span>Agent Referral ID</span>
                                            <span className="text-[10px] font-normal text-slate-400 normal-case">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="referral_agent_id"
                                                type="text"
                                                value={form.referral_agent_id}
                                                onChange={e => set('referral_agent_id', e.target.value.replace(/\s+/g, '').toUpperCase())}
                                                placeholder="e.g. SM-2026-1042"
                                                maxLength={20}
                                                className="w-full border border-slate-200 rounded-xl px-10 py-2.5 text-sm text-slate-700 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                            />
                                            <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            If an Andleeb Surya agent gave you their ID, enter it here. Leave blank if you found us directly.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ───── Step 2: Address ───── */}
                {currentStep === 2 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" aria-hidden="true" />
                            <h2 className="font-bold text-slate-700">Address Details</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="State" name="beneficiary_state" value={form.beneficiary_state} onChange={set} required
                                options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                                autoComplete="address-level1"
                            />
                            <Select
                                label="District" name="beneficiary_district" value={form.beneficiary_district} onChange={set} required
                                options={(STATE_DISTRICTS[form.beneficiary_state] || []).map(d => ({ value: d, label: d }))}
                                autoComplete="address-level2"
                            />
                            <div className="md:col-span-2">
                                <Field label="Full Address" name="beneficiary_address" value={form.beneficiary_address} onChange={set} placeholder="House No, Street, Locality" required autoComplete="street-address" />
                            </div>
                            <Field label="Pincode" name="beneficiary_pincode" value={form.beneficiary_pincode} onChange={set} placeholder="302001" required inputMode="numeric" pattern="[0-9]{6}" autoComplete="postal-code" />
                        </div>
                    </div>
                )}

                {/* ───── Step 3: Technical Info ───── */}
                {currentStep === 3 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-white flex items-center gap-2">
                            <Zap size={16} className="text-green-500" aria-hidden="true" />
                            <h2 className="font-bold text-slate-700">Technical & Electricity Details</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Consumer Number" name="consumer_number" value={form.consumer_number} onChange={set} placeholder="CA-12345678" required />
                            <Select
                                label="DISCOM" name="discom_name" value={form.discom_name} onChange={set} required
                                options={getOptions('discom_name')}
                            />
                            <Field label="Monthly Bill (₹)" name="monthly_bill_amount" value={form.monthly_bill_amount} onChange={set} type="number" placeholder="2500" required inputMode="numeric" />
                            <Select
                                label="Roof Size (sq ft)" name="roof_size" value={form.roof_size} onChange={set} required
                                options={getOptions('roof_size')}
                            />
                            <div className="md:col-span-2">
                                <Select
                                    label="System Capacity (kW)" name="system_capacity" value={form.system_capacity} onChange={set} required
                                    options={getOptions('system_capacity')}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── Step 4: Documents & Finalize ───── */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white flex items-center gap-2">
                                <IndianRupee size={16} className="text-blue-500" aria-hidden="true" />
                                <h2 className="font-bold text-slate-700">Bank Details</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Bank Name" name="beneficiary_bank_name" value={form.beneficiary_bank_name} onChange={set} placeholder="State Bank of India" />
                                <Field label="Account Number" name="beneficiary_bank_account" value={form.beneficiary_bank_account} onChange={set} placeholder="1234567890" inputMode="numeric" />
                                <Field label="IFSC Code" name="beneficiary_bank_ifsc" value={form.beneficiary_bank_ifsc} onChange={set} placeholder="SBIN0001234" />
                                <Field label="Branch Name" name="beneficiary_bank_branch" value={form.beneficiary_bank_branch} onChange={set} placeholder="Main Branch, City" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white flex items-center gap-2">
                                <Upload size={16} className="text-purple-500" />
                                <h2 className="font-bold text-slate-700">Document Uploads</h2>
                                <span className="ml-1 text-xs text-danger font-semibold">All 8 documents are required</span>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="relative">
                                    <FileUploadBox label="Aadhaar Front" accept=".jpg,.jpeg,.png,.pdf" icon={Hash} value={aadhaarFront} onChange={setAadhaarFront} />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                                <div className="relative">
                                    <FileUploadBox label="Aadhaar Back" accept=".jpg,.jpeg,.png,.pdf" icon={Hash} value={aadhaarBack} onChange={setAadhaarBack} />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                                <div className="relative">
                                    <FileUploadBox label="Electricity Bill" accept=".jpg,.jpeg,.png,.pdf" icon={IndianRupee} value={electricityBill} onChange={setElectricityBill} />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                                <div className="relative">
                                    <FileUploadBox label="PAN Card" accept=".jpg,.jpeg,.png,.pdf" icon={FileText} value={pan} onChange={setPan} />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                                <div className="relative">
                                    <FileUploadBox label="Beneficiary Photo" accept=".jpg,.jpeg,.png" icon={User} value={photo} onChange={setPhoto} capture="user" />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                                <div className="relative">
                                    <FileUploadBox label="Solar Roof Photo" accept=".jpg,.jpeg,.png" icon={Zap} value={solarRoofPhoto} onChange={setSolarRoofPhoto} capture="environment" />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                                <div className="relative">
                                    <FileUploadBox label="Bank Passbook" accept=".jpg,.jpeg,.png,.pdf" icon={IndianRupee} value={bankPassbook} onChange={setBankPassbook} />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                                <div className="relative">
                                    <FileUploadBox label="Consumer Signature" accept=".jpg,.jpeg,.png,.pdf" icon={FileText} value={consumerSignature} onChange={setConsumerSignature} />
                                    <span className="absolute top-0 right-0 text-danger font-bold text-xs mt-1 mr-1">*</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-2">
                                <FileText size={16} className="text-slate-600" />
                                <h2 className="font-bold text-slate-700">Additional Notes</h2>
                            </div>
                            <div className="p-6">
                                <textarea
                                    value={form.query_message}
                                    onChange={e => set('query_message', e.target.value)}
                                    placeholder="Any specific requirements or context..."
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                            <p>Verify all details before final submission under PM Surya Ghar Muft Bijli Yojana guidelines.</p>
                        </div>
                    </div>
                )}

                {/* ───── Navigation Controls ───── */}
                <div className="flex flex-col sm:flex-row items-center gap-4 py-8">
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="w-full sm:w-auto px-8 py-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    ) : (
                        role !== 'public' && (
                            <button
                                type="button"
                                onClick={() => navigate(backPath)}
                                className="w-full sm:w-auto px-8 py-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all text-center"
                            >
                                Cancel
                            </button>
                        )
                    )}

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="w-full sm:flex-1 px-8 py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            Next Step <ArrowRight size={16} className="mt-0.5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-sm shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-60"
                        >
                            {mutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Submit Application
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
