import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { authApi } from '@/services/auth.api';
import toast from 'react-hot-toast';

interface ChangePasswordFormProps {
    className?: string;
    onSuccess?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ className = '', onSuccess }) => {
    const [showPasswords, setShowPasswords] = useState(false);
    const [formData, setFormData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const mutation = useMutation({
        mutationFn: authApi.changePassword,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Password updated successfully');
                setFormData({
                    current_password: '',
                    password: '',
                    password_confirmation: '',
                });
                onSuccess?.();
            }
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to update password';
            toast.error(msg);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            toast.error('New passwords do not match');
            return;
        }
        mutation.mutate(formData);
    };

    return (
        <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                    <Lock size={14} className="text-accent" /> Security Settings
                </h3>
                <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="p-1.5 text-slate-400 hover:text-accent transition-colors rounded-lg hover:bg-slate-100"
                    title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                >
                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Current Password</label>
                    <div className="relative">
                        <input
                            required
                            type={showPasswords ? "text" : "password"}
                            value={formData.current_password}
                            onChange={e => setFormData({ ...formData, current_password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:border-accent outline-none transition-all placeholder:text-slate-300"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">New Password</label>
                        <div className="relative">
                            <input
                                required
                                type={showPasswords ? "text" : "password"}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Min. 8 characters"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:border-accent outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Confirm New Password</label>
                        <div className="relative">
                            <input
                                required
                                type={showPasswords ? "text" : "password"}
                                value={formData.password_confirmation}
                                onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                placeholder="Confirm new password"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:border-accent outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <AlertCircle size={18} className="text-blue-500 shrink-0" />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                        Strong passwords include a mix of uppercase letters, numbers, and special symbols.
                        Changing your password will NOT log you out of your current session.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                    {mutation.isPending ? 'Updating Security...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordForm;
