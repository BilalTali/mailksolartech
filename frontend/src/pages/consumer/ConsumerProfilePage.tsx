import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Phone, Mail, KeyRound, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { useAuthStore } from '@/store/authStore';

export default function ConsumerProfilePage() {
    const { user, setAuth } = useAuthStore();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [mobile, setMobile] = useState(user?.mobile || '');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const profileMutation = useMutation({
        mutationFn: () => api.post('/consumer/profile', { name, email, mobile }),
        onSuccess: (res) => {
            toast.success('Profile updated successfully!');
            // Update auth store with new user data
            if (res.data?.user) {
                const token = sessionStorage.getItem('sm_token') || '';
                setAuth(token, res.data.user);
            }
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || 'Failed to update profile');
        }
    });

    const passwordMutation = useMutation({
        mutationFn: () => api.post('/consumer/change-password', {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: confirmPassword
        }),
        onSuccess: () => {
            toast.success('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || 'Failed to change password');
        }
    });

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-slate-800">Profile Settings</h1>
            
            {/* Profile Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-500" /> Personal Information
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Mobile Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={() => profileMutation.mutate()}
                            disabled={profileMutation.isPending}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Password Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-500" /> Security & Password
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={() => passwordMutation.mutate()}
                            disabled={passwordMutation.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Update Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
