import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Lock, KeyRound, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';

const step1Schema = z.object({
    email: z.string().min(1, 'Enter your email, mobile number, or ID'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
type Step1Data = z.infer<typeof step1Schema>;

const step2Schema = z.object({
    otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});
type Step2Data = z.infer<typeof step2Schema>;

/** Maps the role returned from the API to the dashboard URL. */
function dashboardForRole(role: string): string {
    switch (role) {
        case 'super_admin':  return '/super-admin/dashboard';
        case 'admin':        return '/admin/dashboard';
        case 'super_agent':  return '/super-agent/dashboard';
        case 'agent':        return '/agent/dashboard';
        case 'enumerator':   return '/enumerator/dashboard';
        case 'operator':     return '/admin/leads';
        case 'field_technical_team': return '/technical';
        case 'consumer':    return '/consumer/dashboard';
        default:             return '/';
    }
}

export default function UnifiedLoginForm() {
    const navigate   = useNavigate();
    const { setAuth } = useAuthStore();
    const [step, setStep]             = useState<1 | 2>(1);
    const [credentials, setCredentials] = useState<Step1Data | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
    const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

    // Force-clear OTP field when step 2 mounts to block browser autofill
    useEffect(() => {
        if (step === 2) {
            step2Form.setValue('otp', '');
            setTimeout(() => step2Form.setValue('otp', ''), 100);
            setTimeout(() => step2Form.setValue('otp', ''), 300);
        }
    }, [step]);
    
    // Timer for Resend
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    /* ── Step 1: verify credentials + request OTP ─────────────────────── */
    const sendOtpMutation = useMutation({
        mutationFn: (data: Step1Data) => {
            // CRITICAL: Clear any stale token before requesting a new OTP.
            // If an invalid token is sent in the headers, some server configurations
            // might return 401 (Unauthorized) even on public routes.
            sessionStorage.removeItem('sm_token');
            return authApi.sendOtp({ identifier: data.email, password: data.password, role: 'any' });
        },
        onSuccess: (res, variables) => {
            if (res.success) {

                setCredentials(variables);
                setStep(2);
                setCooldown(60); // Start 60s cooldown
                toast.success('Credentials verified. OTP sent to your email.');
            } else {
                toast.error(res.message || 'Failed to verify credentials');
            }
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Invalid email or password');
        },
    });

    const handleResendOtp = () => {
        if (credentials && cooldown === 0) {
            sendOtpMutation.mutate(credentials);
        }
    };

    /* ── Step 2: verify OTP, store auth, redirect by role ─────────────── */
    const loginMutation = useMutation({
        mutationFn: (data: { otp: string }) =>
            authApi.loginOtp(credentials?.email || '', data.otp, 'any'),
        onSuccess: (res) => {
            if (res.success && res.data) {
                const { token, user, requires_password_set } = res.data;
                setAuth(token, user);
                toast.success(`Welcome back, ${user.name}!`);

                if (requires_password_set && user.role === 'agent') {
                    navigate('/agent/set-password');
                } else {
                    navigate(dashboardForRole(user.role));
                }
            } else {
                toast.error(res.message || 'Invalid OTP');
            }
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Invalid OTP');
        },
    });

    /* ── Render Step 1 ─────────────────────────────────────────────────── */
    if (step === 1) {
        return (
            <form
                onSubmit={step1Form.handleSubmit((d) => sendOtpMutation.mutate(d))}
                className="space-y-6 animate-in fade-in slide-in-from-right-4"
            >
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Login Identifier</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            autoComplete="username"
                            className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 ${step1Form.formState.errors.email ? 'border-red-500 focus:ring-red-500/5' : ''}`}
                            placeholder="Email, Mobile, or ID"
                            {...step1Form.register('email')}
                            autoFocus
                        />
                    </div>
                    {step1Form.formState.errors.email && (
                        <p className="text-red-500 text-xs mt-2 font-medium">{step1Form.formState.errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 ${step1Form.formState.errors.password ? 'border-red-500 focus:ring-red-500/5' : ''}`}
                            placeholder="••••••••"
                            {...step1Form.register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {step1Form.formState.errors.password && (
                        <p className="text-red-500 text-xs mt-2 font-medium">{step1Form.formState.errors.password.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/10 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70"
                    disabled={sendOtpMutation.isPending}
                >
                    {sendOtpMutation.isPending ? 'Verifying...' : 'Continue'}
                    {!sendOtpMutation.isPending && <ArrowRight className="w-5 h-5" />}
                </button>
            </form>
        );
    }

    /* ── Render Step 2 ─────────────────────────────────────────────────── */
    return (
        <form
            onSubmit={step2Form.handleSubmit((d) => loginMutation.mutate(d))}
            className="space-y-6 animate-in fade-in slide-in-from-right-4"
            autoComplete="off"
        >
            {/* Honeypot: tricks browser into autofilling here instead of OTP field */}
            <input type="text" name="username" style={{ display: 'none' }} autoComplete="username" />
            <input type="password" name="password" style={{ display: 'none' }} autoComplete="current-password" />
            <div className="text-center bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-2">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Enter OTP Sent To</p>
                <p className="font-bold text-slate-900">{credentials?.email}</p>
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-primary font-bold hover:text-primary-dark mt-2 transition-colors inline-flex items-center gap-1"
                >
                    ← Back
                </button>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">6-Digit Verification Code</label>
                <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        data-lpignore="true"
                        data-form-type="other"
                        className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 text-center tracking-[0.5em] font-mono text-xl ${step2Form.formState.errors.otp ? 'border-red-500 focus:ring-red-500/5' : ''}`}
                        placeholder="000000"
                        {...step2Form.register('otp')}
                        autoFocus
                    />
                </div>
                {step2Form.formState.errors.otp && (
                    <p className="text-red-500 text-xs mt-2 font-medium">{step2Form.formState.errors.otp.message}</p>
                )}
            </div>

            <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/10 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70"
                disabled={loginMutation.isPending}
            >
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
                {!loginMutation.isPending && <ShieldCheck className="w-5 h-5" />}
            </button>

            {/* Resend OTP */}
            <div className="text-center pt-2">
                <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || sendOtpMutation.isPending}
                    className={`text-sm font-bold transition-all ${cooldown > 0 ? 'text-slate-400' : 'text-primary hover:text-primary-dark underline underline-offset-4'}`}
                >
                    {sendOtpMutation.isPending ? 'Sending...' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
            </div>
        </form>
    );
}
