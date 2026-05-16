import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Settings as SettingsIcon, Building2, Globe, Save, RefreshCcw,
    User, CreditCard, Image,
    Upload, FileText, Camera, MapPin, 
    Calendar, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '@/services/settings.api';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';
import { AchievementManager } from '@/components/admin/AchievementManager';
import { FeedbackManager } from '@/components/admin/FeedbackManager';
import api from '@/services/axios';
import ChangePasswordForm from '@/components/shared/ChangePasswordForm';
import MobileInput from '@/components/shared/MobileInput';
import { useSettings } from '@/hooks/useSettings';
import { STATE_DISTRICTS, INDIAN_STATES } from '@/constants/locationData';
import { compressImage } from '@/utils/imageUtils';
import SecurityGuard from '@/components/super-admin/SecurityGuard';



type TabId = 'company' | 'branding' | 'icard' | 'letter' | 'achievements' | 'feedback' | 'profile';

// ─── Standalone sub-components ───

function Field({ k, label, type = 'text', value, onChange, placeholder }: {
    k: string; label: string; type?: string;
    value: string; onChange: (key: string, val: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={e => onChange(k, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm min-h-[100px]"
                />
            ) : type === 'tel' ? (
                <MobileInput
                    label={label}
                    value={value || ''}
                    onChange={val => onChange(k, val)}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={e => onChange(k, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm"
                />
            )}
        </div>
    );
}

const getFileUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').split('/api/v1')[0];
    return `${baseUrl}/storage/${path}`;
};

function FileUploadField({ settingKey, label, accept, currentUrl, pendingFile, onSelect, disabled }: {
    settingKey: string; label: string; accept: string; currentUrl?: string;
    pendingFile?: File;
    onSelect: (key: string, file: File) => void;
    disabled?: boolean;
}) {
    const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : getFileUrl(currentUrl);

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
            {(previewUrl || pendingFile) && (
                <div className="rounded-xl overflow-hidden border border-slate-100 h-24 w-auto flex items-center justify-center bg-slate-50 relative group">
                    {accept.includes('video') ? (
                        <video src={previewUrl} className="h-full" muted autoPlay loop playsInline />
                    ) : (
                        <img src={previewUrl} alt={label} className="h-full object-contain p-2" />
                    )}
                    {pendingFile && (
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-primary shadow-sm">Pending Save</span>
                        </div>
                    )}
                </div>
            )}
            <label className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed transition-colors text-sm overflow-hidden ${disabled ? 'bg-slate-50 border-slate-100 cursor-not-allowed text-slate-400' : 'border-slate-200 hover:border-accent/50 cursor-pointer text-slate-600'}`}>
                <Upload className="w-4 h-4" /> {currentUrl || pendingFile ? 'Replace file' : 'Upload file'}
                {!disabled && (
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" accept={accept} onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                            toast.error('File must be under 5MB.');
                            return;
                        }
                        if (file.type.startsWith('image/')) {
                            const toastId = toast.loading('Optimizing image...');
                            try {
                                const compressed = await compressImage(file);
                                toast.dismiss(toastId);
                                onSelect(settingKey, compressed);
                            } catch (err) {
                                toast.dismiss(toastId);
                                toast.error('Failed to process image');
                            }
                        } else {
                            onSelect(settingKey, file);
                        }
                    }} />
                )}
            </label>
        </div>
    );
}

const AdminSettingsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { companyName: globalCompanyName, logo: globalLogo } = useSettings();
    
    // Group & Tab states
    const [activeTab, setActiveTab] = useState<TabId>('company');
    const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

    // Profile Edit State
    const { setUser } = useAuthStore();
    const [profileForm, setProfileForm] = useState<any>({});
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                father_name: user.father_name || '',
                dob: user.dob ? user.dob.split('T')[0] : '',
                gender: user.gender || '',
                marital_status: user.marital_status || '',
                blood_group: user.blood_group || '',
                religion: user.religion || '',

                state: user.state || '',
                district: user.district || '',
                area: user.area || '',
                pincode: user.pincode || '',
                landmark: user.landmark || '',
                permanent_address: user.permanent_address || '',
                current_address: user.current_address || '',
                occupation: user.occupation || '',
                qualification: user.qualification || '',
            });
        }
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.put('/admin/profile', data);
            return res.data;
        },
        onSuccess: (res) => {
            if (res.success) {
                setUser(res.data);
                toast.success('Profile updated successfully');
                setIsEditingProfile(false);
            }
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        }
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: authApi.uploadProfilePhoto,
        onSuccess: (res) => {
            if (res.success) {
                setUser(res.data);
                toast.success('Profile photo updated');
            }
        },
        onError: () => toast.error('Failed to upload photo')
    });

    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: settingsApi.getSettings
    });

    useEffect(() => {
        if (settingsData?.success && settingsData.data) {
            const flat: Record<string, string> = {};
            Object.values(settingsData.data).flat().forEach(item => {
                flat[item.key] = item.value || '';
            });
            setLocalSettings(flat);
        }
    }, [settingsData]);

    const updateMutation = useMutation({
        mutationFn: settingsApi.updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            queryClient.invalidateQueries({ queryKey: ['public-settings'] });
            toast.success('Settings saved');
        }
    });

    const uploadFileMutation = useMutation({
        mutationFn: async ({ key, file }: { key: string; file: File }) => {
            const fd = new FormData();
            fd.append('key', key);
            fd.append('file', file);
            const res = await api.post('/admin/settings/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            return res.data;
        },
        onSuccess: (data, { key }) => {
            if (data?.data?.url) {
                const url: string = data.data.url;
                const relativePath = url.includes('/storage/') ? url.split('/storage/')[1] : url;
                setLocalSettings(prev => ({ ...prev, [key]: relativePath }));
            }
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            queryClient.invalidateQueries({ queryKey: ['public-settings'] });
        }
    });

    const saveSection = async (keys: string[], customData?: Record<string, any>) => {
        for (const key of keys) {
            if (pendingFiles[key]) {
                await uploadFileMutation.mutateAsync({ key, file: pendingFiles[key] });
            }
        }
        setPendingFiles(prev => {
            const updated = { ...prev };
            keys.forEach(k => delete updated[k]);
            return updated;
        });

        const settingsToSave = keys
            .filter(k => localSettings[k] !== undefined && !['company_logo', 'company_logo_2', 'company_signature', 'official_signature', 'company_seal', 'hero_video'].includes(k))
            .map(k => ({ key: k, value: localSettings[k] }));

        if (customData) {
            Object.entries(customData).forEach(([k, v]) => {
                settingsToSave.push({ key: k, value: JSON.stringify(v) });
            });
        }

        if (settingsToSave.length > 0) {
            await updateMutation.mutateAsync(settingsToSave);
        }
    };

    const handleInput = (key: string, value: string) => setLocalSettings(p => ({ ...p, [key]: value }));

    const F = (k: string, label: string, type?: string, defaultValue?: string) => (
        <Field k={k} label={label} type={type} value={localSettings[k] || defaultValue || ''} onChange={handleInput} />
    );

    const FU = (settingKey: string, label: string, accept: string, disabled?: boolean) => (
        <FileUploadField
            settingKey={settingKey}
            label={label}
            accept={accept}
            currentUrl={localSettings[settingKey]}
            pendingFile={pendingFiles[settingKey]}
            onSelect={(key, file) => setPendingFiles(prev => ({ ...prev, [key]: file }))}
            disabled={disabled}
        />
    );

    const SectionSave = ({ keys, customData, label = "Save Changes" }: { keys: string[], customData?: Record<string, any>, label?: string }) => (
        <div className="flex justify-end pt-6 border-t border-slate-100">
            <button
                onClick={() => saveSection(keys, customData)}
                disabled={updateMutation.isPending || uploadFileMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
            >
                {updateMutation.isPending || uploadFileMutation.isPending ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {label}
            </button>
        </div>
    );

    if (isLoading) return <div className="flex h-64 items-center justify-center"><RefreshCcw className="w-8 h-8 text-accent animate-spin" /></div>;

    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: 'company', label: 'Company Info', icon: Building2 },
        { id: 'branding', label: 'Branding & Identity', icon: Image },
        { id: 'icard', label: 'ID Card Template', icon: CreditCard },
        { id: 'letter', label: 'Joining Letter Template', icon: FileText },
        { id: 'achievements', label: 'Success Records', icon: Star },
        { id: 'feedback', label: 'User Testimonials', icon: FileText },
        { id: 'profile', label: 'My Bio Profile', icon: User },
    ];

    return (
        <SecurityGuard>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
                {/* Dynamic Title and Desc header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase">
                            <SettingsIcon className="text-accent animate-spin" style={{ animationDuration: '6s' }} /> Admin Settings
                        </h1>
                        <p className="text-slate-500 text-sm font-semibold mt-1">Configure company credentials, logo branding assets, ID cards, joining templates, and success records.</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[650px]">
                    {/* Left Sub-tabs List */}
                    <div className="w-full md:w-64 border-r border-slate-100 bg-slate-50/30 p-4 space-y-1 shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-white text-accent shadow-sm border border-slate-100' 
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right Main Content area */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {(() => {
                            switch (activeTab) {
                                // ────────── GENERAL SETTINGS TABS ──────────
                                case 'company':
                                    return (
                                        <div className="space-y-6">
                                            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                                                <p className="text-xs text-amber-800 font-medium">
                                                    <strong>Tenant Identity:</strong> These details appear on your generated documents (ID Cards, Joining Letters). 
                                                    {user?.role === 'super_admin' && " Platform homepage details are managed in the Authority Hub."}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {F('company_name', 'Company Name (on ID Cards)')}
                                                {F('company_registration_no', 'Registration Number')}
                                                {F('company_email', 'Support Email')}
                                                {F('company_phone', 'Support Phone')}
                                                {F('company_mobile', 'Support Mobile')}
                                                {F('company_whatsapp', 'WhatsApp Number')}
                                                {F('company_website', 'Website URL')}
                                                <div className="md:col-span-2">
                                                    {F('company_address', 'Full Address', 'textarea')}
                                                </div>
                                            </div>
                                            <SectionSave keys={['company_name', 'company_registration_no', 'company_email', 'company_phone', 'company_mobile', 'company_whatsapp', 'company_website', 'company_address']} label="Save Identity" />
                                        </div>
                                    );
                                case 'branding':
                                    return (
                                        <div className="space-y-8">
                                            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-6 space-y-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Globe className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Affiliate Partner (Platform Identity)</span>
                                                    <span className="ml-auto text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Read Only · Set by Super Admin</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl border-2 border-indigo-100 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                        {globalLogo ? (
                                                            <img src={globalLogo} alt={globalCompanyName} className="w-full h-full object-contain p-1" />
                                                        ) : (
                                                            <Globe className="w-7 h-7 text-indigo-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-base">{globalCompanyName}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">This is the platform's master identity managed by the Super Admin. It appears on official documents as the affiliation authority.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-slate-800">Your Company Branding</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {F('company_slogan', 'Company Slogan')}
                                                {F('authorized_signatory', 'Signatory Name')}
                                                {F('authorized_signatory_title', 'Signatory Title')}
                                                {F('icard_clearance', 'Clearance Level (e.g. Level-V)')}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-1">
                                                    {FU('company_logo', 'Institutional Identity (Locked)', 'image/*', user?.role !== 'super_admin')}
                                                    <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">Master logo set by platform HQ</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {FU('company_logo_2', 'My Team Branding (ID Front)', 'image/*')}
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Appears on the front of your ID cards</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {FU('company_signature', 'Signatory Signature (ID & Letters)', 'image/*')}
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Appears on ID cards & appointment letters</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {FU('official_signature', 'Official Signature (Bills & Receipts)', 'image/*', user?.role !== 'super_admin')}
                                                    <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">Authorized sign set by platform HQ</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {FU('company_seal', 'My Seal', 'image/*')}
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Appears alongside signatures on files</p>
                                                </div>
                                            </div>
                                            <SectionSave keys={['company_slogan', 'authorized_signatory', 'authorized_signatory_title', 'icard_clearance', 'company_logo', 'company_logo_2', 'company_signature', 'official_signature', 'company_seal']} label="Save Branding Details" />
                                        </div>
                                    );
                                case 'icard':
                                    return (
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                                <h4 className="font-bold text-slate-800 text-sm">Configure Back of ID Card</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">Customize the instructions and disclaimer text printed on the backside of your group members' identity documents.</p>
                                            </div>
                                            {F('icard_inst_1', 'Instruction Line 1', 'text', 'This ID card is non-transferable and remains property of the issuer.')}
                                            {F('icard_inst_2', 'Instruction Line 2', 'text', 'Always wear this card while on official field operations.')}
                                            {F('icard_inst_3', 'Instruction Line 3', 'text', 'If found, please return to the office address listed on front.')}
                                            {F('icard_inst_4', 'Instruction Line 4', 'text', 'Loss of card must be reported immediately.')}
                                            <SectionSave keys={['icard_inst_1', 'icard_inst_2', 'icard_inst_3', 'icard_inst_4']} label="Save Instruction Backing" />
                                        </div>
                                    );
                                case 'letter':
                                    return (
                                        <div className="space-y-6">
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                                <h4 className="font-bold text-slate-800 text-sm">Joining Letter Structure</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">Customize key legal terms and official office details embedded in the joining letter template.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {F('joining_terms_office_timing', 'Default Office Timing', 'text', '09:30 AM to 06:00 PM')}
                                                {F('joining_terms_working_days', 'Default Working Days', 'text', 'Monday to Saturday')}
                                                <div className="md:col-span-2">
                                                    {F('joining_terms_probation', 'Probation & Notice Period Details', 'textarea')}
                                                </div>
                                            </div>
                                            <SectionSave keys={['joining_terms_office_timing', 'joining_terms_working_days', 'joining_terms_probation']} label="Save Joining Template" />
                                        </div>
                                    );
                                case 'achievements':
                                    return <AchievementManager />;
                                case 'feedback':
                                    return <FeedbackManager />;
                                case 'profile':
                                    return (
                                        <div className="space-y-8">
                                            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="relative group shrink-0">
                                                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-white shadow-md overflow-hidden relative">
                                                        <img src={getFileUrl(user?.profile_photo) || 'https://via.placeholder.com/150'} alt="Avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                    <label className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full border shadow-md hover:bg-slate-100 cursor-pointer transition-all active:scale-90">
                                                        <Camera size={14} className="text-slate-600" />
                                                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const compressed = await compressImage(file);
                                                                uploadPhotoMutation.mutate(compressed);
                                                            }
                                                        }} />
                                                    </label>
                                                </div>
                                                <div className="text-center sm:text-left">
                                                    <h3 className="text-lg font-black text-slate-800">{user?.name}</h3>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{user?.role?.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                <h4 className="font-bold text-slate-800">My Bio Profile</h4>
                                                <button
                                                    onClick={() => {
                                                        if (isEditingProfile) {
                                                            updateProfileMutation.mutate(profileForm);
                                                        } else {
                                                            setIsEditingProfile(true);
                                                        }
                                                    }}
                                                    disabled={updateProfileMutation.isPending}
                                                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all"
                                                >
                                                    {updateProfileMutation.isPending ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save size={14} />}
                                                    {isEditingProfile ? 'Save Bio Profile' : 'Edit Bio Profile'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <ProfileField label="Full Name" value={user?.name || ''} formValue={profileForm.name} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, name: v }))} icon={<User size={14} />} />
                                                <ProfileField label="Father's Name" value={user?.father_name || ''} formValue={profileForm.father_name} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, father_name: v }))} icon={<User size={14} />} />
                                                <ProfileField label="Date of Birth" value={user?.dob ? new Date(user.dob).toLocaleDateString() : ''} formValue={profileForm.dob} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, dob: v }))} type="date" icon={<Calendar size={14} />} />
                                                <ProfileField label="Gender" value={user?.gender || ''} formValue={profileForm.gender} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, gender: v }))} type="select" options={['male', 'female', 'other']} icon={<User size={14} />} />
                                                <ProfileField label="Blood Group" value={user?.blood_group || ''} formValue={profileForm.blood_group} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, blood_group: v }))} type="select" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} icon={<User size={14} />} />
                                                <ProfileField label="Religion" value={user?.religion || ''} formValue={profileForm.religion} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, religion: v }))} icon={<User size={14} />} />
                                                
                                                <ProfileField label="State" value={user?.state || ''} formValue={profileForm.state} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, state: v, district: '' }))} type="select" options={INDIAN_STATES} icon={<MapPin size={14} />} />
                                                <ProfileField label="District" value={user?.district || ''} formValue={profileForm.district} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, district: v }))} type="select" options={profileForm.state ? STATE_DISTRICTS[profileForm.state] || [] : []} icon={<MapPin size={14} />} disabled={!profileForm.state} />
                                                <ProfileField label="Area / City" value={user?.area || ''} formValue={profileForm.area} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, area: v }))} icon={<MapPin size={14} />} />
                                                <ProfileField label="Pincode" value={user?.pincode || ''} formValue={profileForm.pincode} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, pincode: v }))} icon={<MapPin size={14} />} />
                                                
                                                <div className="md:col-span-2">
                                                    <ProfileField label="Permanent Address" value={user?.permanent_address || ''} formValue={profileForm.permanent_address} editing={isEditingProfile} onChange={v => setProfileForm((p: any) => ({ ...p, permanent_address: v }))} type="textarea" icon={<MapPin size={14} />} />
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100 max-w-md">
                                                <ChangePasswordForm />
                                            </div>
                                        </div>
                                    );

                                default:
                                    return null;
                            }
                        })()}
                    </div>
                </div>
            </div>
        </SecurityGuard>
    );
};

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    editing: boolean;
    formValue?: string;
    onChange?: (val: string) => void;
    placeholder?: string;
    type?: string;
    options?: string[];
    disabled?: boolean;
}

const ProfileField: React.FC<ProfileFieldProps> = ({
    label, value, icon, editing, formValue, onChange, placeholder, type = 'text', options = [], disabled = false
}) => {
    if (editing && !disabled) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 ml-1">
                    {icon}
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</label>
                </div>
                {type === 'textarea' ? (
                    <textarea
                        value={formValue || ''}
                        onChange={e => onChange?.(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-emerald-500 outline-none transition-all min-h-[100px]"
                    />
                ) : type === 'tel' ? (
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-2 focus-within:border-emerald-500 transition-all">
                        <MobileInput
                            label=""
                            value={formValue || ''}
                            onChange={v => onChange?.(v)}
                            placeholder={placeholder}
                        />
                    </div>
                ) : type === 'select' ? (
                    <select
                        value={formValue || ''}
                        onChange={e => onChange?.(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Select {label}...</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>)}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={formValue || ''}
                        onChange={e => onChange?.(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-emerald-500 outline-none transition-all"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400 ml-1">
                {icon}
                <label className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</label>
            </div>
            <div className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="font-bold text-slate-800 break-all">{value || '---'}</p>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
