import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/services/auth.api';

type FPStep = 'email' | 'otp' | 'password' | 'done';

const emailSchema = z.object({
    identifier: z.string().min(1, 'Please enter your email or mobile'),
});
const otpSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'Digits only'),
});
const passwordSchema = z.object({
    password: z.string().min(8, 'Minimum 8 characters'),
    password_confirmation: z.string().min(8, 'Minimum 8 characters'),
}).refine(d => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

type EmailData = z.infer<typeof emailSchema>;
type OtpData = z.infer<typeof otpSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

interface Props {
    role: string;
    onBack: () => void;
}

export default function ForgotPasswordForm({ role, onBack }: Props) {
    const [step, setStep] = useState<FPStep>('email');
    const [identifier, setIdentifier] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfPw, setShowConfPw] = useState(false);

    const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema) });
    const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });
    const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

    const sendMut = useMutation({
        mutationFn: (d: EmailData) => authApi.forgotPassword({ identifier: d.identifier, role }),
        onSuccess: (_res, vars) => {
            setIdentifier(vars.identifier);
            setStep('otp');
            toast.success('OTP sent! Check your registered email.');
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send OTP.'),
    });

    const resetMut = useMutation({
        mutationFn: (d: PasswordData) => authApi.resetPassword({
            identifier,
            otp: otpForm.getValues('otp'),
            password: d.password,
            password_confirmation: d.password_confirmation,
            role,
        }),
        onSuccess: () => {
            setStep('done');
            toast.success('Password reset successfully!');
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to reset password.'),
    });

    const handleOtpNext = (d: OtpData) => {
        // Just advance to password step — OTP is validated at reset time by the server
        if (d.otp.length === 6) setStep('password');
    };

    // ── DONE ────────────────────────────────────────────────────────────
    if (step === 'done') {
        return (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Password Reset!</h3>
                    <p className="text-slate-500 text-sm">Your password has been updated. You may now log in with your new credentials.</p>
                </div>
                <button
                    onClick={onBack}
                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/10"
                >
                    Back to Login <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // ── STEP 1: EMAIL / IDENTIFIER INPUT ────────────────────────────────
    if (step === 'email') {
        return (
            <form onSubmit={emailForm.handleSubmit((d) => sendMut.mutate(d))} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center mb-2">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Forgot Password?</h3>
                    <p className="text-slate-500 text-sm">Enter your registered email or mobile. We'll send a 6-digit OTP to your email.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email / Mobile / Agent ID</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 ${emailForm.formState.errors.identifier ? 'border-red-500' : ''}`}
                            placeholder="name@company.com or 9876543210"
                            {...emailForm.register('identifier')}
                            autoFocus
                        />
                    </div>
                    {emailForm.formState.errors.identifier && <p className="text-red-500 text-xs mt-2 font-medium">{emailForm.formState.errors.identifier.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={sendMut.isPending}
                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/10 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70"
                >
                    {sendMut.isPending ? 'Sending OTP…' : 'Send Reset OTP'}
                    {!sendMut.isPending && <ArrowRight className="w-5 h-5" />}
                </button>

                <button type="button" onClick={onBack} className="w-full text-center text-sm text-slate-500 hover:text-primary transition-colors font-medium">
                    ← Back to Login
                </button>
            </form>
        );
    }

    // ── STEP 2: OTP ──────────────────────────────────────────────────────
    if (step === 'otp') {
        return (
            <form onSubmit={otpForm.handleSubmit(handleOtpNext)} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-2">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">OTP sent to</p>
                    <p className="font-bold text-slate-900 text-sm">{identifier}</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">6-Digit OTP</label>
                    <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            maxLength={6}
                            className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 text-center tracking-[0.5em] font-mono text-xl ${otpForm.formState.errors.otp ? 'border-red-500' : ''}`}
                            placeholder="000000"
                            {...otpForm.register('otp')}
                            autoFocus
                        />
                    </div>
                    {otpForm.formState.errors.otp && <p className="text-red-500 text-xs mt-2 font-medium">{otpForm.formState.errors.otp.message}</p>}
                </div>

                <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/10 hover:shadow-primary/30 active:scale-[0.98]"
                >
                    Verify OTP <ArrowRight className="w-5 h-5" />
                </button>

                <button type="button" onClick={() => setStep('email')} className="w-full text-center text-sm text-slate-500 hover:text-primary transition-colors font-medium">
                    ← Re-enter Email
                </button>
            </form>
        );
    }

    // ── STEP 3: NEW PASSWORD ─────────────────────────────────────────────
    return (
        <form onSubmit={passwordForm.handleSubmit((d) => resetMut.mutate(d))} className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-slate-800 mb-1">Set New Password</h3>
                <p className="text-slate-500 text-sm">Choose a strong password with at least 8 characters.</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type={showPw ? 'text' : 'password'}
                        className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 ${passwordForm.formState.errors.password ? 'border-red-500' : ''}`}
                        placeholder="Min. 8 characters"
                        {...passwordForm.register('password')}
                        autoFocus
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                {passwordForm.formState.errors.password && <p className="text-red-500 text-xs mt-2 font-medium">{passwordForm.formState.errors.password.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type={showConfPw ? 'text' : 'password'}
                        className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 ${passwordForm.formState.errors.password_confirmation ? 'border-red-500' : ''}`}
                        placeholder="Re-enter password"
                        {...passwordForm.register('password_confirmation')}
                    />
                    <button type="button" onClick={() => setShowConfPw(!showConfPw)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                        {showConfPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                {passwordForm.formState.errors.password_confirmation && <p className="text-red-500 text-xs mt-2 font-medium">{passwordForm.formState.errors.password_confirmation.message}</p>}
            </div>

            <button
                type="submit"
                disabled={resetMut.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/10 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70"
            >
                {resetMut.isPending ? 'Resetting…' : 'Reset Password'}
                {!resetMut.isPending && <CheckCircle className="w-5 h-5" />}
            </button>
        </form>
    );
}
