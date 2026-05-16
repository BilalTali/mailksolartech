import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    User as UserIcon, Camera, Phone, Mail, BadgeCheck, Shield, MapPin,
    ArrowLeft, Save, Edit2, Calendar,
    Briefcase, CreditCard, ClipboardCheck, Info, Map,
    GraduationCap, Lock, CheckCircle2, Star, UserCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth.api';
import { enumeratorApi } from '@/services/enumerator.api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { STATE_DISTRICTS, INDIAN_STATES } from '@/constants/locationData';
import { compressImage } from '@/utils/imageUtils';
import ChangePasswordForm from '@/components/shared/ChangePasswordForm';
import DownloadJoiningLetterButton from '@/components/shared/DownloadJoiningLetterButton';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import MobileInput from '@/components/shared/MobileInput';
import { User } from '@/types';

type ProfileTab = 'personal' | 'contact' | 'professional' | 'kyc_bank' | 'security';

const EnumeratorProfilePage: React.FC = () => {
    const { user, setUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

    // Form state covers all fields
    const [editForm, setEditForm] = useState<Partial<User>>({});

    useEffect(() => {
        if (user) {
            setEditForm({

                father_name: user.father_name ?? '',
                dob: user.dob ? user.dob.split('T')[0] : '',
                blood_group: user.blood_group ?? '',
                religion: user.religion ?? '',
                gender: user.gender ?? null,
                marital_status: user.marital_status ?? null,

                permanent_address: user.permanent_address ?? '',
                current_address: user.current_address ?? '',
                pincode: user.pincode ?? '',
                landmark: user.landmark ?? '',
                state: user.state ?? '',
                district: user.district ?? '',
                area: user.area ?? '',

                voter_id: user.voter_id ?? '',
                aadhaar_number: user.aadhaar_number ?? '',
                pan_number: user.pan_number ?? '',
                bank_name: user.bank_name ?? '',
                bank_account_number: user.bank_account_number ?? '',
                bank_ifsc: user.bank_ifsc ?? '',
                bank_branch: user.bank_branch ?? '',
                upi_id: user.upi_id ?? '',

                occupation: user.occupation ?? '',
                qualification: user.qualification ?? '',
                experience_years: user.experience_years ?? 0,
                languages_known_string: (user.languages_known ?? []).join(', '),
                reference_name: user.reference_name ?? '',
                reference_mobile: user.reference_mobile ?? '',
                territory: user.territory ?? '',
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
        mutationFn: enumeratorApi.updateProfile,
        onSuccess: (res) => {
            if (res.success) {
                setUser(res.data);
                toast.success('Profile updated successfully');
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
        // Convert languages string back to array
        if ('languages_known_string' in payload) {
            const langStr = (payload as any).languages_known_string as string;
            payload.languages_known = langStr.split(',').map(s => s.trim()).filter(s => s !== '');
            delete (payload as any).languages_known_string;
        }
        updateProfileMutation.mutate(payload);
    };

    const completion = user?.profile_completion ?? 0;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <Link to="/enumerator/dashboard" className="p-3 bg-white hover:bg-slate-50 rounded-2xl text-slate-400 border border-slate-200 transition-all shadow-sm">
                        <ArrowLeft size={22} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enumerator Profile</h1>
                            {user?.status === 'active' && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    <BadgeCheck size={12} /> Verified
                                </div>
                            )}
                        </div>
                        <p className="text-slate-500 font-medium">Manage your field identity and personal details</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <DownloadJoiningLetterButton user={user!} variant="outline" className="h-12 px-6" />
                    <DownloadIdCardButton variant="button" className="h-12 px-6" />
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 h-12 px-6 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                        >
                            <Edit2 size={18} /> Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditing(false)}
                                className="h-12 px-6 border border-slate-200 text-slate-700 bg-white rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateProfileMutation.isPending}
                                className="flex items-center gap-2 h-12 px-6 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                <Save size={18} /> {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: Profile Card & Progress */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Avatar Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-50 to-teal-50" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-[3rem] bg-white p-1.5 shadow-2xl border border-slate-100">
                                    <div className="w-full h-full rounded-[2.5rem] bg-slate-50 flex items-center justify-center overflow-hidden relative">
                                        {user?.profile_photo_url ? (
                                            <img src={user.profile_photo_url} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                <UserIcon size={70} className="text-slate-300" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera size={32} className="text-white" />
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
                                {user?.status === 'active' && (
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                                        <BadgeCheck size={20} />
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 text-center">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{user?.name}</h3>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 font-mono">
                                        {(user as any)?.enumerator_id}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 w-full grid grid-cols-2 gap-3">
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</p>
                                    <p className="font-bold text-slate-700 text-sm">{new Date(user?.created_at!).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="font-bold text-emerald-600 text-sm uppercase">{user?.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Completion Progress */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Profile Strength</h4>
                                <span className="text-2xl font-black text-emerald-500">{completion}%</span>
                            </div>

                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    style={{ width: `${completion}%` }}
                                />
                            </div>

                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                {completion < 75
                                    ? `Reach 75% profile completion to unlock your Joining Letter and ID Card download.`
                                    : `Your profile strength is great! You can now download your official documents.`
                                }
                            </p>

                            {completion < 75 && (
                                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Info className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                        Missing: {activeTab === 'personal' ? 'Father Name, DOB, etc.' : 'Bank Details, KYC, etc.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Area: Tabs & Content */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Tab Navigation */}
                    <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap gap-1">
                        <TabButton
                            active={activeTab === 'personal'}
                            onClick={() => setActiveTab('personal')}
                            icon={<UserIcon size={18} />}
                            label="Personal"
                        />
                        <TabButton
                            active={activeTab === 'contact'}
                            onClick={() => setActiveTab('contact')}
                            icon={<MapPin size={18} />}
                            label="Contact"
                        />
                        <TabButton
                            active={activeTab === 'professional'}
                            onClick={() => setActiveTab('professional')}
                            icon={<Briefcase size={18} />}
                            label="Professional"
                        />
                        <TabButton
                            active={activeTab === 'kyc_bank'}
                            onClick={() => setActiveTab('kyc_bank')}
                            icon={<CreditCard size={18} />}
                            label="KYC & Bank"
                        />
                        <TabButton
                            active={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                            icon={<Shield size={18} />}
                            label="Security"
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 md:p-10">
                            {activeTab === 'personal' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <SectionTitle icon={<UserIcon className="text-emerald-500" />} title="Personal Information" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ProfileField label="Full Legal Name" value={user?.name} icon={<UserIcon size={14} />} disabled />
                                        <ProfileField
                                            label="Father's Name"
                                            value={user?.father_name}
                                            icon={<UserIcon size={14} />}
                                            editing={editing}
                                            formValue={editForm.father_name}
                                            onChange={v => setEditForm({ ...editForm, father_name: v })}
                                            placeholder="S/o or D/o Name"
                                        />
                                        <ProfileField
                                            label="Date of Birth"
                                            value={user?.dob}
                                            type="date"
                                            icon={<Calendar size={14} />}
                                            editing={editing}
                                            formValue={editForm.dob}
                                            onChange={v => setEditForm({ ...editForm, dob: v })}
                                        />
                                        <ProfileField
                                            label="Blood Group"
                                            value={user?.blood_group}
                                            type="select"
                                            options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']}
                                            icon={<Star size={14} />}
                                            editing={editing}
                                            formValue={editForm.blood_group}
                                            onChange={v => setEditForm({ ...editForm, blood_group: v })}
                                        />
                                        <ProfileField
                                            label="Gender"
                                            value={user?.gender}
                                            type="select"
                                            options={['male', 'female', 'other']}
                                            icon={<UserCheck size={14} />}
                                            editing={editing}
                                            formValue={editForm.gender || ''}
                                            onChange={v => setEditForm({ ...editForm, gender: v as any })}
                                        />
                                        <ProfileField
                                            label="Marital Status"
                                            value={user?.marital_status}
                                            type="select"
                                            options={['single', 'married', 'divorced', 'widowed']}
                                            icon={<UserCheck size={14} />}
                                            editing={editing}
                                            formValue={editForm.marital_status || ''}
                                            onChange={v => setEditForm({ ...editForm, marital_status: v as any })}
                                        />
                                        <ProfileField
                                            label="Religion"
                                            value={user?.religion}
                                            icon={<Star size={14} />}
                                            editing={editing}
                                            formValue={editForm.religion}
                                            onChange={v => setEditForm({ ...editForm, religion: v })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <SectionTitle icon={<MapPin className="text-emerald-500" />} title="Contact & Address" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ProfileField label="Primary Mobile" value={(user as any)?.mobile} icon={<Phone size={14} />} disabled />

                                        <ProfileField label="Email Address" value={user?.email} icon={<Mail size={14} />} disabled />
                                        <ProfileField
                                            label="Landmark"
                                            value={user?.landmark}
                                            icon={<Map size={14} />}
                                            editing={editing}
                                            formValue={editForm.landmark}
                                            onChange={v => setEditForm({ ...editForm, landmark: v })}
                                        />

                                        <div className="md:col-span-2">
                                            <ProfileField
                                                label="Permanent Address"
                                                value={user?.permanent_address}
                                                type="textarea"
                                                icon={<MapPin size={14} />}
                                                editing={editing}
                                                formValue={editForm.permanent_address}
                                                onChange={v => setEditForm({ ...editForm, permanent_address: v })}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <ProfileField
                                                label="Current Address"
                                                value={user?.current_address}
                                                type="textarea"
                                                icon={<MapPin size={14} />}
                                                editing={editing}
                                                formValue={editForm.current_address}
                                                onChange={v => setEditForm({ ...editForm, current_address: v })}
                                            />
                                        </div>

                                        <ProfileField
                                            label="State"
                                            value={user?.state}
                                            type="select"
                                            options={INDIAN_STATES}
                                            icon={<MapPin size={14} />}
                                            editing={editing}
                                            formValue={editForm.state}
                                            onChange={v => setEditForm({ ...editForm, state: v, district: '' })}
                                        />
                                        <ProfileField
                                            label="District"
                                            value={user?.district}
                                            type="select"
                                            options={STATE_DISTRICTS[editForm.state!] || []}
                                            icon={<MapPin size={14} />}
                                            editing={editing}
                                            formValue={editForm.district}
                                            onChange={v => setEditForm({ ...editForm, district: v })}
                                            disabled={!editForm.state}
                                        />
                                        <ProfileField
                                            label="Area"
                                            value={user?.area}
                                            icon={<MapPin size={14} />}
                                            editing={editing}
                                            formValue={editForm.area}
                                            onChange={v => setEditForm({ ...editForm, area: v })}
                                        />
                                        <ProfileField
                                            label="Pincode"
                                            value={user?.pincode}
                                            icon={<Map size={14} />}
                                            editing={editing}
                                            formValue={editForm.pincode}
                                            onChange={v => setEditForm({ ...editForm, pincode: v })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'professional' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <SectionTitle icon={<Briefcase className="text-emerald-500" />} title="Professional Profile" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ProfileField
                                            label="Current Occupation"
                                            value={user?.occupation}
                                            icon={<Briefcase size={14} />}
                                            editing={editing}
                                            formValue={editForm.occupation}
                                            onChange={v => setEditForm({ ...editForm, occupation: v })}
                                        />
                                        <ProfileField
                                            label="Qualification"
                                            value={user?.qualification}
                                            icon={<GraduationCap size={14} />}
                                            editing={editing}
                                            formValue={editForm.qualification}
                                            onChange={v => setEditForm({ ...editForm, qualification: v })}
                                        />
                                        <ProfileField
                                            label="Experience (Years)"
                                            value={user?.experience_years?.toString()}
                                            type="number"
                                            icon={<Star size={14} />}
                                            editing={editing}
                                            formValue={editForm.experience_years?.toString()}
                                            onChange={v => setEditForm({ ...editForm, experience_years: parseInt(v) || 0 })}
                                        />
                                        <ProfileField
                                            label="Working Territory"
                                            value={user?.territory}
                                            icon={<MapPin size={14} />}
                                            editing={editing}
                                            formValue={editForm.territory}
                                            onChange={v => setEditForm({ ...editForm, territory: v })}
                                        />
                                        <ProfileField
                                            label="Known Languages"
                                            value={(user?.languages_known ?? []).join(', ')}
                                            icon={<Info size={14} />}
                                            editing={editing}
                                            formValue={(editForm as any).languages_known_string}
                                            onChange={v => setEditForm({ ...editForm, languages_known_string: v } as any)}
                                            placeholder="English, Hindi, etc."
                                        />
                                        <ProfileField
                                            label="Reference Name"
                                            value={user?.reference_name}
                                            icon={<UserIcon size={14} />}
                                            editing={editing}
                                            formValue={editForm.reference_name}
                                            onChange={v => setEditForm({ ...editForm, reference_name: v })}
                                        />
                                        <ProfileField
                                            label="Reference Mobile"
                                            value={user?.reference_mobile}
                                            type="tel"
                                            icon={<Phone size={14} />}
                                            editing={editing}
                                            formValue={editForm.reference_mobile}
                                            onChange={v => setEditForm({ ...editForm, reference_mobile: v })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'kyc_bank' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <SectionTitle icon={<CreditCard className="text-emerald-500" />} title="KYC & Banking Details" />

                                    <div className="p-6 bg-teal-50 rounded-[2rem] border border-teal-100 flex items-start gap-4 mb-4">
                                        <Shield className="text-teal-600 shrink-0 mt-1" size={20} />
                                        <div>
                                            <h5 className="font-bold text-teal-800 text-sm">Strict Data Protection</h5>
                                            <p className="text-xs text-teal-700 leading-relaxed mt-1">
                                                For your security, Aadhaar, PAN, and Bank Account numbers are masked and encrypted. Only authorized administrative personnel can access full records for verification.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ProfileField
                                            label="Aadhaar Card"
                                            value={user?.aadhaar_number}
                                            icon={<ClipboardCheck size={14} />}
                                            editing={editing}
                                            formValue={editForm.aadhaar_number}
                                            onChange={v => setEditForm({ ...editForm, aadhaar_number: v })}
                                            placeholder="12 digit Aadhaar"
                                            pattern="\d{12}" 
                                            maxLength={12}
                                        />
                                        <ProfileField
                                            label="PAN Card"
                                            value={user?.pan_number}
                                            icon={<ClipboardCheck size={14} />}
                                            editing={editing}
                                            formValue={editForm.pan_number}
                                            onChange={v => setEditForm({ ...editForm, pan_number: v })}
                                            placeholder="PAN Number"
                                            pattern="[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}" 
                                            maxLength={10}
                                        />
                                        <ProfileField
                                            label="Voter ID"
                                            value={user?.voter_id}
                                            icon={<ClipboardCheck size={14} />}
                                            editing={editing}
                                            formValue={editForm.voter_id}
                                            onChange={v => setEditForm({ ...editForm, voter_id: v })}
                                        />
                                        <ProfileField
                                            label="Bank Name"
                                            value={user?.bank_name}
                                            icon={<Briefcase size={14} />}
                                            editing={editing}
                                            formValue={editForm.bank_name}
                                            onChange={v => setEditForm({ ...editForm, bank_name: v })}
                                        />
                                        <ProfileField
                                            label="Account Number"
                                            value={user?.bank_account_number}
                                            icon={<CreditCard size={14} />}
                                            editing={editing}
                                            formValue={editForm.bank_account_number}
                                            onChange={v => setEditForm({ ...editForm, bank_account_number: v })}
                                            pattern="\d{9,18}"
                                            maxLength={18}
                                        />
                                        <ProfileField
                                            label="Bank IFSC"
                                            value={user?.bank_ifsc}
                                            icon={<CreditCard size={14} />}
                                            editing={editing}
                                            formValue={editForm.bank_ifsc}
                                            onChange={v => setEditForm({ ...editForm, bank_ifsc: v })}
                                            pattern="[a-zA-Z]{4}0[a-zA-Z0-9]{6}"
                                            maxLength={11}
                                        />
                                        <ProfileField
                                            label="Bank Branch"
                                            value={user?.bank_branch}
                                            icon={<CreditCard size={14} />}
                                            editing={editing}
                                            formValue={editForm.bank_branch}
                                            onChange={v => setEditForm({ ...editForm, bank_branch: v })}
                                        />
                                        <ProfileField
                                            label="UPI ID (Mobile Linked)"
                                            value={user?.upi_id}
                                            type="tel"
                                            icon={<Phone size={14} />}
                                            editing={editing}
                                            formValue={editForm.upi_id}
                                            onChange={v => setEditForm({ ...editForm, upi_id: v })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <SectionTitle icon={<Lock className="text-emerald-500" />} title="Security & Credentials" />
                                    <div className="max-w-md">
                                        <ChangePasswordForm />
                                    </div>

                                    <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                                        <div className="flex items-start gap-5">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                                <Shield className="text-emerald-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-2">Login Sessions & Security</h4>
                                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                                    Your last login was {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Just now'}. Keep your password secure and do not share your credentials with anyone.
                                                </p>
                                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                                    <CheckCircle2 size={16} /> End-to-end Encrypted
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ====== Sub-components ======

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] text-sm font-bold transition-all ${active
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
        <div className="p-2 bg-emerald-50 rounded-xl">{icon}</div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
    </div>
);

interface ProfileFieldProps {
    label: string;
    value?: string | null;
    icon?: React.ReactNode;
    editing?: boolean;
    formValue?: string | null;
    onChange?: (val: string) => void;
    placeholder?: string;
    type?: 'text' | 'date' | 'select' | 'textarea' | 'number' | 'tel';
    options?: string[];
    disabled?: boolean;
    pattern?: string;
    maxLength?: number;
}

const ProfileField: React.FC<ProfileFieldProps> = ({
    label, value, icon, editing, formValue, onChange, placeholder, type = 'text', options = [], disabled = false, pattern, maxLength
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
                        pattern={pattern}
                        maxLength={maxLength}
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

export default EnumeratorProfilePage;
