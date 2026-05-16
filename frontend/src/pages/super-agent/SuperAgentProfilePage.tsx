// @ts-nocheck
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    User as UserIcon, Phone, MapPin, Building2, 
    Calendar, Shield, BadgeCheck, Save,
    Camera, Mail, FileText, Lock, Download,
    Briefcase, Star, Check, RefreshCcw, Info,
    CreditCard, GraduationCap, Target, UserCheck, Edit2
} from 'lucide-react';
import { superAgentApi } from '@/services/superAgent.api';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { STATE_DISTRICTS, INDIAN_STATES } from '@/constants/locationData';
import { compressImage } from '@/utils/imageUtils';
import ChangePasswordForm from '@/components/shared/ChangePasswordForm';
import DownloadJoiningLetterButton from '@/components/shared/DownloadJoiningLetterButton';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';

type ProfileTab = 'personal' | 'contact' | 'professional' | 'kyc_bank' | 'security';

export function SuperAgentProfilePage() {
    const { user, setUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
    
    const [editForm, setEditForm] = useState({

        father_name: (user as any)?.father_name ?? '',
        dob: (user as any)?.dob ? (user as any).dob.split('T')[0] : '',
        blood_group: (user as any)?.blood_group ?? '',
        religion: (user as any)?.religion ?? '',
        gender: (user as any)?.gender ?? '',
        marital_status: (user as any)?.marital_status ?? '',

        permanent_address: (user as any)?.permanent_address ?? '',
        current_address: (user as any)?.current_address ?? '',
        pincode: (user as any)?.pincode ?? '',
        landmark: (user as any)?.landmark ?? '',
        state: user?.state ?? '',
        district: user?.district ?? '',
        area: user?.area ?? '',

        voter_id: (user as any)?.voter_id ?? '',
        aadhaar_number: (user as any)?.aadhaar_number ?? '',
        pan_number: (user as any)?.pan_number ?? '',
        bank_name: (user as any)?.bank_name ?? '',
        bank_account_number: (user as any)?.bank_account_number ?? '',
        bank_ifsc: (user as any)?.bank_ifsc ?? '',
        bank_branch: (user as any)?.bank_branch ?? '',
        upi_id: (user as any)?.upi_id ?? '',

        occupation: (user as any)?.occupation ?? '',
        qualification: (user as any)?.qualification ?? '',
        experience_years: (user as any)?.experience_years ?? 0,
        languages_known_string: ((user as any)?.languages_known ?? []).join(', '),
        reference_name: (user as any)?.reference_name ?? '',
        reference_mobile: (user as any)?.reference_mobile ?? '',
        territory: (user as any)?.territory ?? '',
        target_monthly: (user as any)?.target_monthly ?? 0,
    });

    useEffect(() => {
        if (user) {
            setEditForm({

                father_name: (user as any).father_name ?? '',
                dob: (user as any).dob ? (user as any).dob.split('T')[0] : '',
                blood_group: (user as any).blood_group ?? '',
                religion: (user as any).religion ?? '',
                gender: (user as any).gender ?? '',
                marital_status: (user as any).marital_status ?? '',
                
                permanent_address: (user as any).permanent_address ?? '',
                current_address: (user as any).current_address ?? '',
                pincode: (user as any).pincode ?? '',
                landmark: (user as any).landmark ?? '',
                state: user.state ?? '',
                district: user.district ?? '',
                area: user.area ?? '',

                voter_id: (user as any).voter_id ?? '',
                aadhaar_number: (user as any).aadhaar_number ?? '',
                pan_number: (user as any).pan_number ?? '',
                bank_name: (user as any).bank_name ?? '',
                bank_account_number: (user as any).bank_account_number ?? '',
                bank_ifsc: (user as any).bank_ifsc ?? '',
                bank_branch: (user as any).bank_branch ?? '',
                upi_id: (user as any).upi_id ?? '',

                occupation: (user as any).occupation ?? '',
                qualification: (user as any).qualification ?? '',
                experience_years: (user as any).experience_years ?? 0,
                languages_known_string: ((user as any).languages_known ?? []).join(', '),
                reference_name: (user as any).reference_name ?? '',
                reference_mobile: (user as any).reference_mobile ?? '',
                territory: (user as any).territory ?? '',
                target_monthly: (user as any).target_monthly ?? 0,
            });
        }
    }, [user]);

    const uploadPhotoMutation = useMutation({
        mutationFn: authApi.uploadProfilePhoto,
        onSuccess: (res) => {
            if (res.success) {
                setUser(res.data);
                toast.success('Profile photo updated');
            }
        },
        onError: () => {
            toast.error('Failed to upload photo');
        }
    });

    const updateProfileMutation = useMutation({
        mutationFn: superAgentApi.updateProfile,
        onSuccess: (res) => {
            if (res.success) {
                setUser(res.data);
                toast.success('Manager credentials synchronized');
                setEditing(false);
            }
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to update profile';
            toast.error(msg);
        }
    });

    const handleSave = () => {
        const payload = { ...editForm };
        if (payload.languages_known_string) {
            payload.languages_known = payload.languages_known_string.split(',').map(s => s.trim()).filter(s => s !== '');
            delete payload.languages_known_string;
        }
        updateProfileMutation.mutate(payload);
    };

    const completion = user?.profile_completion ?? 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-indigo-100">
                        <Briefcase className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight leading-none">Manager Command Center</h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Professional Identity & Resources</p>
                    </div>
                </div>
                {!editing ? (
                    <button onClick={() => setEditing(true)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                        <Edit2 size={14} /> Edit Manager Profile
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={() => setEditing(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                        <button 
                            disabled={updateProfileMutation.isPending}
                            onClick={handleSave} 
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-xl transition-all"
                        >
                            {updateProfileMutation.isPending ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar: Profile Identity */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-slate-800 overflow-hidden shadow-2xl mb-6 relative">
                                    {user?.profile_photo_url ? (
                                        <img src={user.profile_photo_url} alt={user.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-600/20 text-indigo-400 font-black text-4xl">
                                            {user?.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={24} />
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                                            accept="image/*" 
                                            capture="user"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 5 * 1024 * 1024) {
                                                    toast.error('Profile photo must be under 5MB.');
                                                    return;
                                                }
                                                const toastId = toast.loading('Optimizing photo...');
                                                try {
                                                    const compressed = await compressImage(file);
                                                    uploadPhotoMutation.mutate(compressed, {
                                                        onSettled: () => toast.dismiss(toastId)
                                                    });
                                                } catch (error) {
                                                    toast.dismiss(toastId);
                                                    toast.error('Failed to compress image');
                                                }
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-display font-black tracking-tight text-center">{user?.name}</h3>
                            <div className="mt-2 bg-indigo-600/30 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                                <BadgeCheck size={12} className="text-indigo-400" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-100">{user?.super_agent_code || 'Senior Manager'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Completion Progress */}
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Strength</span>
                            <span className="text-lg font-black text-indigo-600">{completion}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-600 transition-all duration-1000"
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        {completion < 60 && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                                <Info size={12} className="text-amber-600 mt-0.5" />
                                <p className="text-[9px] text-amber-700 font-bold leading-relaxed">
                                    Reach 60% to unlock your official ID Card and Appointment Letter.
                                </p>
                            </div>
                        )}
                    </div>

                    <nav className="bg-white rounded-[2rem] border border-slate-200 p-2 shadow-sm space-y-1">
                        <NavTab id="personal" label="Manager Identity" icon={<UserIcon size={16} />} active={activeTab === 'personal'} onClick={setActiveTab} />
                        <NavTab id="contact" label="Contact & Address" icon={<MapPin size={16} />} active={activeTab === 'contact'} onClick={setActiveTab} />
                        <NavTab id="professional" label="Professional" icon={<Briefcase size={16} />} active={activeTab === 'professional'} onClick={setActiveTab} />
                        <NavTab id="kyc_bank" label="KYC & Banking" icon={<CreditCard size={16} />} active={activeTab === 'kyc_bank'} onClick={setActiveTab} />
                        <NavTab id="security" label="System Security" icon={<Lock size={16} />} active={activeTab === 'security'} onClick={setActiveTab} />
                    </nav>
                </div>

                {/* Right: Tab Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-8 lg:p-10">
                            {activeTab === 'personal' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><UserIcon size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Personal Credentials</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <DisplayField label="Full Legal Name" value={user?.name} icon={<UserIcon size={14} />} />
                                        <EditField 
                                            label="Father's Name" 
                                            value={editForm.father_name} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, father_name: v }))} 
                                            icon={<UserIcon size={14} />} 
                                            placeholder="S/o or D/o name"
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date of Birth</label>
                                            {editing ? (
                                                <input 
                                                    type="date" 
                                                    value={editForm.dob} 
                                                    onChange={e => setEditForm(p => ({ ...p, dob: e.target.value }))}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                                                />
                                            ) : (
                                                <div className="px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl flex items-center gap-3 text-slate-800 font-bold">
                                                    <Calendar size={14} className="text-slate-300" />
                                                    {user?.dob ? new Date(user.dob).toLocaleDateString('en-IN') : 'Not Provided'}
                                                </div>
                                            )}
                                        </div>
                                        <EditSelect 
                                            label="Blood Group"
                                            value={editForm.blood_group}
                                            editing={editing}
                                            onChange={v => setEditForm(p => ({ ...p, blood_group: v }))}
                                            options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']}
                                            icon={<Star size={14} />}
                                        />
                                        <EditSelect 
                                            label="Gender"
                                            value={editForm.gender}
                                            editing={editing}
                                            onChange={v => setEditForm(p => ({ ...p, gender: v }))}
                                            options={['male', 'female', 'other']}
                                            icon={<UserCheck size={14} />}
                                        />
                                        <EditSelect 
                                            label="Marital Status"
                                            value={editForm.marital_status}
                                            editing={editing}
                                            onChange={v => setEditForm(p => ({ ...p, marital_status: v }))}
                                            options={['single', 'married', 'divorced', 'widowed']}
                                            icon={<UserCheck size={14} />}
                                        />
                                        <EditField 
                                            label="Religion" 
                                            value={editForm.religion} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, religion: v }))} 
                                            icon={<Star size={14} />} 
                                            placeholder="e.g. Hindu, Muslim, Sikh"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><MapPin size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Contact & Address Details</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <DisplayField label="Primary Mobile" value={user?.mobile} icon={<Phone size={14} />} />
                                        <DisplayField label="Email Address" value={user?.email} icon={<Mail size={14} />} />

                                        <EditField 
                                            label="Landmark" 
                                            value={editForm.landmark} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, landmark: v }))} 
                                            icon={<MapPin size={14} />} 
                                            placeholder="Near school, hospital, etc."
                                        />
                                        <div className="md:col-span-2">
                                            <EditTextArea 
                                                label="Permanent Address" 
                                                value={editForm.permanent_address}
                                                editing={editing}
                                                onChange={v => setEditForm(p => ({ ...p, permanent_address: v }))}
                                                icon={<MapPin size={14} />}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <EditTextArea 
                                                label="Current Address" 
                                                value={editForm.current_address}
                                                editing={editing}
                                                onChange={v => setEditForm(p => ({ ...p, current_address: v }))}
                                                icon={<MapPin size={14} />}
                                            />
                                        </div>
                                        <EditSelect 
                                            label="State Authority"
                                            value={editForm.state}
                                            editing={editing}
                                            onChange={v => setEditForm(p => ({ ...p, state: v, district: '' }))}
                                            options={INDIAN_STATES}
                                            icon={<MapPin size={14} />}
                                        />
                                        <EditSelect 
                                            label="District Boundary"
                                            value={editForm.district}
                                            editing={editing}
                                            onChange={v => setEditForm(p => ({ ...p, district: v }))}
                                            options={STATE_DISTRICTS[editForm.state] || []}
                                            disabled={!editForm.state}
                                            icon={<MapPin size={14} />}
                                        />
                                        <EditField 
                                            label="Area Name" 
                                            value={editForm.area} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, area: v }))} 
                                            icon={<MapPin size={14} />} 
                                            placeholder="Block or Taluka"
                                        />
                                        <EditField 
                                            label="Pincode" 
                                            value={editForm.pincode} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, pincode: v }))} 
                                            icon={<MapPin size={14} />} 
                                            placeholder="6-digit PIN"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'professional' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Briefcase size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Professional Standing</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <EditField 
                                            label="Current Occupation" 
                                            value={editForm.occupation} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, occupation: v }))} 
                                            icon={<Briefcase size={14} />} 
                                        />
                                        <EditField 
                                            label="Educational Qualification" 
                                            value={editForm.qualification} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, qualification: v }))} 
                                            icon={<GraduationCap size={14} />} 
                                        />
                                        <EditField 
                                            label="Experience (Years)" 
                                            value={editForm.experience_years} 
                                            type="number"
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, experience_years: parseInt(v) || 0 }))} 
                                            icon={<Star size={14} />} 
                                        />
                                        <EditField 
                                            label="Known Languages" 
                                            value={editForm.languages_known_string} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, languages_known_string: v }))} 
                                            icon={<Info size={14} />} 
                                            placeholder="English, Hindi, etc."
                                        />
                                        <EditField 
                                            label="Assigned Territory" 
                                            value={editForm.territory} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, territory: v }))} 
                                            icon={<Target size={14} />} 
                                        />
                                        <DisplayField label="Monthly Target" value={editForm.target_monthly} icon={<Target size={14} />} />
                                        <EditField 
                                            label="Reference Name" 
                                            value={editForm.reference_name} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, reference_name: v }))} 
                                            icon={<UserIcon size={14} />} 
                                        />
                                        <EditField 
                                            label="Reference Mobile" 
                                            value={editForm.reference_mobile} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, reference_mobile: v }))} 
                                            icon={<Phone size={14} />} 
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'kyc_bank' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><CreditCard size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">KYC & Banking Settlement</h2>
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-4 italic mb-6">
                                        <Shield className="text-slate-400 shrink-0 mt-1" size={18} />
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                            For security, sensitive data like Aadhaar and Bank Account numbers are encrypted. Masked values are shown for your protection.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <EditField 
                                            label="Aadhaar Card Number" 
                                            value={editForm.aadhaar_number} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, aadhaar_number: v }))} 
                                            icon={<Shield size={14} />} 
                                            placeholder="12-digit number"
                                            pattern="\d{12}"
                                            maxLength={12}
                                        />
                                        <EditField 
                                            label="PAN Card Number" 
                                            value={editForm.pan_number} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, pan_number: v }))} 
                                            icon={<Shield size={14} />} 
                                            placeholder="ABCDE1234F"
                                            pattern="[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}"
                                            maxLength={10}
                                        />
                                        <EditField 
                                            label="Voter ID" 
                                            value={editForm.voter_id} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, voter_id: v }))} 
                                            icon={<Shield size={14} />} 
                                        />
                                        <div className="md:col-span-2 h-px bg-slate-100 my-2" />
                                        <EditField 
                                            label="Bank Name" 
                                            value={editForm.bank_name} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, bank_name: v }))} 
                                            icon={<Building2 size={14} />} 
                                        />
                                        <EditField 
                                            label="Account Number" 
                                            value={editForm.bank_account_number} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, bank_account_number: v }))} 
                                            icon={<CreditCard size={14} />} 
                                            pattern="\d{9,18}"
                                            maxLength={18}
                                        />
                                        <EditField 
                                            label="Bank IFSC" 
                                            value={editForm.bank_ifsc} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, bank_ifsc: v }))} 
                                            icon={<Building2 size={14} />} 
                                            pattern="[a-zA-Z]{4}0[a-zA-Z0-9]{6}"
                                            maxLength={11}
                                        />
                                        <EditField 
                                            label="Bank Branch" 
                                            value={editForm.bank_branch} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, bank_branch: v }))} 
                                            icon={<Building2 size={14} />} 
                                        />
                                        <EditField 
                                            label="UPI ID" 
                                            value={editForm.upi_id} 
                                            editing={editing} 
                                            onChange={v => setEditForm(p => ({ ...p, upi_id: v }))} 
                                            icon={<RefreshCcw size={14} />} 
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Lock size={18} /></div>
                                        <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Account Access & Security</h2>
                                    </div>
                                    <div className="max-w-md">
                                        <ChangePasswordForm />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Cards for Documents */}
                    {!editing && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DocumentCard 
                                title="Official I-Card" 
                                desc="Download your verified platform identity document."
                                icon={<Download size={24} />}
                                button={<DownloadIdCardButton className="w-full h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg" />}
                            />
                            <DocumentCard 
                                title="Appointment" 
                                desc="Official joining authorization for your position."
                                icon={<FileText size={24} />}
                                button={<DownloadJoiningLetterButton user={user!} variant="primary" className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg" />}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const NavTab = ({ id, label, icon, active, onClick }: { id: any, label: string, icon: React.ReactNode, active: boolean, onClick: (id: any) => void }) => (
    <button 
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const DisplayField = ({ label, value, icon }: { label: string, value?: any, icon: React.ReactNode }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <div className="px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl flex items-center gap-3 text-slate-800 font-bold overflow-hidden">
            <span className="text-slate-300">{icon}</span>
            <span className="truncate">{value || '---'}</span>
        </div>
    </div>
);

const EditField = ({ label, value, editing, onChange, icon, placeholder, type = "text", pattern, maxLength }: { label: string, value: any, editing: boolean, onChange: (v: string) => void, icon: React.ReactNode, placeholder?: string, type?: string, pattern?: string, maxLength?: number }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        {editing ? (
            <input 
                type={type} 
                value={value || ''} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder}
                pattern={pattern}
                maxLength={maxLength}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all" 
            />
        ) : (
            <div className="px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl flex items-center gap-3 text-slate-800 font-bold overflow-hidden">
                <span className="text-slate-300">{icon}</span>
                <span className="truncate">{value || 'Not Provided'}</span>
            </div>
        )}
    </div>
);

const EditSelect = ({ label, value, editing, onChange, options, icon }: { label: string, value: any, editing: boolean, onChange: (v: string) => void, options: string[], icon: React.ReactNode }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        {editing ? (
            <select 
                value={value || ''} 
                onChange={e => onChange(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all appearance-none"
            >
                <option value="">Select...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>)}
            </select>
        ) : (
            <div className="px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl flex items-center gap-3 text-slate-800 font-bold">
                <span className="text-slate-300">{icon}</span>
                <span>{value || 'Not Provided'}</span>
            </div>
        )}
    </div>
);

const EditTextArea = ({ label, value, editing, onChange, icon }: { label: string, value: any, editing: boolean, onChange: (v: string) => void, icon: React.ReactNode }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        {editing ? (
            <textarea 
                value={value || ''} 
                onChange={e => onChange(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all min-h-[100px]"
            />
        ) : (
            <div className="px-6 py-8 bg-slate-50 border-2 border-slate-50 rounded-2xl flex items-start gap-3 text-slate-800 font-bold">
                <span className="text-slate-300 mt-1">{icon}</span>
                <span className="leading-relaxed">{value || 'Not Provided'}</span>
            </div>
        )}
    </div>
);

const DocumentCard = ({ title, desc, icon, button }: { title: string, desc: string, icon: React.ReactNode, button: React.ReactNode }) => (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                {icon}
            </div>
            <div>
                <h4 className="font-display font-black text-slate-800">{title}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-none mt-1 uppercase tracking-wider">{desc}</p>
            </div>
        </div>
        {button}
    </div>
);
