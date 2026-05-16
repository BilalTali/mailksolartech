import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Sun, CheckCircle, User, Mail, MapPin, CreditCard,
    Briefcase, FileText, Upload, X, Hash, Image as ImageIcon,
} from 'lucide-react';
import { enumeratorApi } from '@/services/enumerator.api';
import { STATE_DISTRICTS, INDIAN_STATES } from '@/constants/locationData';
import SEOHead from '@/components/shared/SEOHead';
import MobileInput from '@/components/shared/MobileInput';
import { useSettings } from '@/hooks/useSettings';
import { compressImage } from '@/utils/imageUtils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    name: z.string().min(2, 'Full name is required'),
    mobile: z
        .string()
        .length(10, 'Must be exactly 10 digits')
        .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),

    email: z.string().email('Invalid email address').or(z.literal('')).optional(),
    state: z.string().min(1, 'Please select your state'),
    district: z.string().min(1, 'District is required'),
    area: z.string().min(1, 'Area / locality is required'),
    aadhaar_number: z
        .string()
        .length(12, 'Aadhaar must be exactly 12 digits')
        .regex(/^\d{12}$/, 'Aadhaar must contain only digits'),
    occupation: z.string().min(2, 'Occupation is required'),
    education_level: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── File Upload Helper ───────────────────────────────────────────────────────

interface FileState {
    file: File | null;
    name: string;
    preview: string | null;
}

const emptyFile = (): FileState => ({ file: null, name: '', preview: null });

function DocUpload({
    label, required, accept, value, onChange, icon: Icon, capture
}: {
    label: string; required?: boolean; accept?: string;
    value: FileState; onChange: (v: FileState) => void;
    icon: React.ElementType; capture?: 'user' | 'environment';
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

        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        onChange({ file, name: file.name, preview });
    };

    const clear = () => {
        onChange(emptyFile());
        if (ref.current) ref.current.value = '';
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="label">
                {label} {required && <span className="text-danger"> *</span>}
            </label>
            <div
                onClick={() => !value.file && !isCompressing && ref.current?.click()}
                className={`relative overflow-hidden border-2 border-dashed rounded-xl p-3 text-center transition-all min-h-[90px]
                    flex flex-col items-center justify-center gap-1.5
                    ${value.file
                        ? 'border-success bg-success/5'
                        : isCompressing
                            ? 'border-sky-300 bg-sky-50 cursor-wait'
                            : 'border-gray-200 bg-neutral-50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer'}`}
            >
                <input 
                    ref={ref} 
                    type="file" 
                    accept={accept} 
                    capture={capture as any}
                    className={`absolute inset-0 w-full h-full opacity-0 z-10 ${(value.file || isCompressing) ? 'pointer-events-none' : 'cursor-pointer'}`}
                    onChange={handleFile} 
                />
                {isCompressing ? (
                    <>
                        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold text-sky-600">Optimizing...</p>
                    </>
                ) : value.file ? (
                    <>
                        {value.preview
                            ? <img src={value.preview} alt="preview" className="max-h-12 rounded object-contain" />
                            : <FileText className="w-7 h-7 text-success" />
                        }
                        <p className="text-xs font-semibold text-success truncate max-w-full px-2">{value.name}</p>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clear(); }}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200"
                        >
                            <X size={10} />
                        </button>
                    </>
                ) : (
                    <>
                        <Icon className="w-6 h-6 text-neutral-400" />
                        <p className="text-xs text-neutral-500">Click to upload <span className="font-semibold">{label}</span></p>
                        <p className="text-[10px] text-neutral-400">JPG, PNG or PDF · Max 2MB</p>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EnumeratorRegisterPage() {
    const [submitted, setSubmitted] = useState(false);
    const [referenceId, setReferenceId] = useState('');
    const [step, setStep] = useState(1); // 1 = Info, 2 = Documents
    const { companyName } = useSettings();

    // File states for Section 6
    const [profilePhoto, setProfilePhoto] = useState<FileState>(emptyFile());
    const [aadhaarDoc, setAadhaarDoc] = useState<FileState>(emptyFile());
    const [panDoc, setPanDoc] = useState<FileState>(emptyFile());
    const [educationCert, setEducationCert] = useState<FileState>(emptyFile());
    const [resume, setResume] = useState<FileState>(emptyFile());
    const [mouSigned, setMouSigned] = useState<FileState>(emptyFile());

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', state: '', district: '' },
    });

    const watchedState = watch('state');
    const mobilVal = watch('mobile');


    const registerMutation = useMutation({
        mutationFn: (data: FormData) => {
            // Build FormData for file upload support
            const fd = new FormData();
            Object.entries(data).forEach(([k, v]) => {
                if (v !== undefined && v !== '') fd.append(k, String(v));
            });
            if (profilePhoto.file) fd.append('profile_photo', profilePhoto.file);
            if (aadhaarDoc.file) fd.append('aadhaar_document', aadhaarDoc.file);
            if (panDoc.file) fd.append('pan_document', panDoc.file);
            if (educationCert.file) fd.append('education_cert', educationCert.file);
            if (resume.file) fd.append('resume', resume.file);
            if (mouSigned.file) fd.append('mou_signed', mouSigned.file);
            return enumeratorApi.publicRegister(fd);
        },
        onSuccess: (res) => {
            if (!res.success) { toast.error(res.message || 'Registration failed.'); return; }
            setReferenceId(res.data?.reference ?? '');
            setSubmitted(true);
        },
        onError: (err: unknown) => {
            const errData = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
            if (errData?.errors) {
                const firstError = Object.values(errData.errors)[0]?.[0];
                toast.error(firstError || 'Validation failed.');
            } else {
                toast.error(errData?.message || 'Registration failed. Please try again.');
            }
        },
    });

    const advanceToDocuments = () => {
        handleSubmit(() => setStep(2))();
    };

    const submitFinal = handleSubmit((d) => {
        if (!profilePhoto.file) { toast.error('Profile photo is required'); return; }
        if (!aadhaarDoc.file) { toast.error('Aadhaar card scan is required'); return; }
        registerMutation.mutate(d);
    });

    // ── Success screen ──────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg text-center relative z-10">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md">
                            <Sun className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-display font-bold text-2xl text-primary">{companyName}</span>
                    </div>

                    <div className="card shadow-xl">
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                                <CheckCircle className="w-9 h-9 text-success" />
                            </div>
                            <h1 className="font-display font-bold text-2xl text-dark">Application Submitted!</h1>
                            <p className="text-neutral-600 text-sm leading-relaxed max-w-sm">
                                Thank you for applying to become a {companyName} Enumerator. Our team will review your application and contact you on your registered mobile number.
                            </p>
                            {referenceId && (
                                <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 w-full">
                                    <p className="text-xs text-neutral-500 mb-1">Your Reference ID</p>
                                    <p className="font-mono font-bold text-primary text-lg tracking-wider">{referenceId}</p>
                                    <p className="text-xs text-neutral-500 mt-1">Save this for future correspondence</p>
                                </div>
                            )}
                            <div className="bg-accent/5 border border-accent/20 rounded-xl px-5 py-3 w-full text-left">
                                <p className="text-xs font-semibold text-accent-dark mb-1">What happens next?</p>
                                <ol className="text-xs text-neutral-600 space-y-1 list-decimal list-inside">
                                    <li>Admin reviews your application (1-2 business days)</li>
                                    <li>You receive an approval notification on your mobile</li>
                                    <li>A one-time password setup link will be sent to you</li>
                                    <li>Log in and start your site surveys!</li>
                                </ol>
                            </div>
                            <Link to="/enumerator/login" className="btn-primary w-full py-3 text-center mt-2">
                                Go to Enumerator Login
                            </Link>
                        </div>
                    </div>

                    <p className="text-center mt-4">
                        <Link to="/" className="text-sm text-neutral-600 hover:text-primary">← Back to Home</Link>
                    </p>
                </div>
            </div>
        );
    }

    // ── Registration form ───────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10 relative overflow-hidden">
            {/* Ambient effects */}
            <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
            <div className="fixed top-20 right-10 w-96 h-96 bg-sky-200/20 blur-[100px] rounded-full pointer-events-none" />
            
            <SEOHead title={`Enumerator Registration | ${companyName}`} description={`Join ${companyName} as an Enumerator and help with solar registrations.`} />
            <div className="w-full max-w-2xl relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md">
                            <Sun className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-display font-bold text-2xl text-primary">{companyName}</span>
                    </div>
                    <h1 className="font-display font-bold text-2xl text-dark mt-3">Enumerator Registration</h1>
                    <p className="text-neutral-600 text-sm mt-1">Join us to conduct site surveys and assist beneficiaries with PM Surya Ghar</p>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${step === s ? 'bg-primary text-white ring-2 ring-primary/30' :
                                        step > s ? 'bg-success text-white' : 'bg-gray-100 text-neutral-400'}`}>
                                    {step > s ? '✓' : s}
                                </div>
                                <span className={`text-xs font-medium ${step === s ? 'text-primary' : 'text-neutral-400'}`}>
                                    {s === 1 ? 'Personal Info' : 'Documents'}
                                </span>
                                {s < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-premium border border-slate-100 relative">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 to-sky-400 rounded-t-[2rem]" />
                    
                    {/* ── STEP 1: Personal Info ─────────────────────────────────────── */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            {/* Personal Info */}
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Personal Information</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="sm:col-span-2">
                                        <label className="label">Full Name <span className="text-danger">*</span></label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <input
                                                className={`input pl-9 ${errors.name ? 'input-error' : ''}`}
                                                placeholder="As per Aadhaar card"
                                                {...register('name')}
                                            />
                                        </div>
                                        {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
                                    </div>

                                    {/* Mobile — MobileInput (Section 3) */}
                                    <div>
                                        <MobileInput
                                            label="Mobile Number"
                                            required
                                            value={mobilVal ?? ''}
                                            onChange={(val) => setValue('mobile', val, { shouldValidate: true })}
                                            error={errors.mobile?.message}
                                        />
                                    </div>



                                    {/* Email */}
                                    <div className="sm:col-span-2">
                                        <label className="label">Email Address <span className="text-neutral-400 text-xs">(optional)</span></label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <input
                                                type="email"
                                                className={`input pl-9 ${errors.email ? 'input-error' : ''}`}
                                                placeholder="your@email.com"
                                                {...register('email')}
                                            />
                                        </div>
                                        {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Location */}
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Location</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* State */}
                                    <div>
                                        <label className="label">State <span className="text-danger">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <select
                                                className={`input pl-9 ${errors.state ? 'input-error' : ''}`}
                                                {...register('state')}
                                                onChange={e => { register('state').onChange(e); setValue('district', ''); }}
                                            >
                                                <option value="">Select state</option>
                                                {INDIAN_STATES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.state && <p className="text-danger text-xs mt-1">{errors.state.message}</p>}
                                    </div>

                                    {/* District */}
                                    <div>
                                        <label className="label">District <span className="text-danger">*</span></label>
                                        <select
                                            className={`input ${errors.district ? 'input-error' : ''}`}
                                            {...register('district')}
                                            disabled={!watchedState}
                                        >
                                            <option value="">Select district</option>
                                            {(STATE_DISTRICTS[watchedState] || []).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        {errors.district && <p className="text-danger text-xs mt-1">{errors.district.message}</p>}
                                    </div>

                                    {/* Area */}
                                    <div className="sm:col-span-2">
                                        <label className="label">Area / Locality <span className="text-danger">*</span></label>
                                        <input
                                            className={`input ${errors.area ? 'input-error' : ''}`}
                                            placeholder="Village / Town / Colony name"
                                            {...register('area')}
                                        />
                                        {errors.area && <p className="text-danger text-xs mt-1">{errors.area.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Identity & Occupation */}
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Identity & Occupation</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Aadhaar */}
                                    <div>
                                        <label className="label">Aadhaar Number <span className="text-danger">*</span></label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <input
                                                className={`input pl-9 ${errors.aadhaar_number ? 'input-error' : ''}`}
                                                placeholder="12-digit Aadhaar number"
                                                maxLength={12}
                                                pattern="\d{12}"
                                                {...register('aadhaar_number')}
                                            />
                                        </div>
                                        {errors.aadhaar_number && <p className="text-danger text-xs mt-1">{errors.aadhaar_number.message}</p>}
                                    </div>

                                    {/* Occupation */}
                                    <div>
                                        <label className="label">Current Occupation <span className="text-danger">*</span></label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <input
                                                className={`input pl-9 ${errors.occupation ? 'input-error' : ''}`}
                                                placeholder="e.g. Self-employed, Teacher"
                                                {...register('occupation')}
                                            />
                                        </div>
                                        {errors.occupation && <p className="text-danger text-xs mt-1">{errors.occupation.message}</p>}
                                    </div>

                                    {/* Education Level */}
                                    <div className="sm:col-span-2">
                                        <label className="label">Education Level <span className="text-neutral-400 text-xs">(optional)</span></label>
                                        <select className="input" {...register('education_level')}>
                                            <option value="">Select education level</option>
                                            <option value="8th">8th Pass</option>
                                            <option value="10th">10th Pass</option>
                                            <option value="12th">12th Pass</option>
                                            <option value="graduate">Graduate</option>
                                            <option value="post_graduate">Post Graduate</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={advanceToDocuments}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                            >
                                Next: Upload Documents →
                            </button>
                        </div>
                    )}

                    {/* ── STEP 2: Document Uploads (Section 6) ─────────────────────── */}
                    {step === 2 && (
                        <form onSubmit={submitFinal} className="flex flex-col gap-5">
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Document Uploads</p>
                                <p className="text-xs text-neutral-500 mb-4">
                                    Profile photo and Aadhaar scan are <span className="text-danger font-semibold">required</span>. Other documents are optional but recommended.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <DocUpload label="Profile Photo" required accept=".jpg,.jpeg,.png" icon={ImageIcon} value={profilePhoto} onChange={setProfilePhoto} capture="user" />
                                    </div>
                                    <div className="relative">
                                        <DocUpload label="Aadhaar Card Scan" required accept=".jpg,.jpeg,.png,.pdf" icon={CreditCard} value={aadhaarDoc} onChange={setAadhaarDoc} />
                                    </div>
                                    <DocUpload label="PAN Card" accept=".jpg,.jpeg,.png,.pdf" icon={Hash} value={panDoc} onChange={setPanDoc} />
                                    <DocUpload label="Education Certificate" accept=".jpg,.jpeg,.png,.pdf" icon={FileText} value={educationCert} onChange={setEducationCert} />
                                    <DocUpload label="Resume / CV" accept=".pdf,.doc,.docx" icon={Upload} value={resume} onChange={setResume} />
                                    <DocUpload label="Signed MoU" accept=".jpg,.jpeg,.png,.pdf" icon={FileText} value={mouSigned} onChange={setMouSigned} />
                                </div>
                            </div>

                            <p className="text-xs text-neutral-500">
                                By submitting, you agree that your information will be used for verification purposes. Your Aadhaar number is encrypted and stored securely.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="btn-secondary px-6 py-3"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                                    disabled={registerMutation.isPending}
                                >
                                    {registerMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-sm text-neutral-600">
                            Already registered?{' '}
                            <Link to="/enumerator/login" className="text-primary font-semibold hover:underline">Sign in here</Link>
                        </p>
                    </div>
                </div>

                <p className="text-center mt-4">
                    <Link to="/" className="text-sm text-neutral-600 hover:text-primary">← Back to Home</Link>
                </p>
            </div>
        </div>
    );
}
