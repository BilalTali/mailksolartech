import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Lock, Send, Key, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { securityApi } from '@/services/security.api';
import { useAuthStore } from '@/store/authStore';

interface SecurityGuardProps {
    children: React.ReactNode;
}

/**
 * Higher-Order Component/Guard to protect sensitive Admin & Super Admin areas with OTP.
 */
export default function SecurityGuard({ children }: SecurityGuardProps) {
    const { role } = useAuthStore();
    const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
    const [otp, setOtp] = useState('');

    // Check if already unlocked
    const { data: statusData, isLoading: isCheckingStatus } = useQuery({
        queryKey: ['security-status', role],
        queryFn: securityApi.checkStatus
    });

    useEffect(() => {
        if (statusData) {
            setIsUnlocked(statusData.is_unlocked);
        }
    }, [statusData]);

    const sendOtpMutation = useMutation({
        mutationFn: securityApi.sendOtp,
        onSuccess: (data) => {
            toast.success(data.message || 'OTP sent to your email.');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || err.message || 'Failed to send OTP.');
        }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: securityApi.verifyOtp,
        onSuccess: () => {
            toast.success('Access granted.');
            setIsUnlocked(true);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || err.message || 'Invalid OTP.');
        }
    });

    if (isCheckingStatus || isUnlocked === null) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!isUnlocked) {
        const titleArea = role === 'super_admin' ? 'Global Settings' : 'Admin Settings';
        
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-indigo-100">
                        <Lock className="w-10 h-10 text-indigo-600" />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-3">Security Verification Required</h2>
                <p className="text-slate-500 max-w-md mb-10 font-medium">
                    To access the {titleArea}, you must verify your identity. We will send a 6-digit OTP to your registered email address.
                </p>

                {!sendOtpMutation.isSuccess ? (
                    <button
                        onClick={() => sendOtpMutation.mutate()}
                        disabled={sendOtpMutation.isPending}
                        className="group flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {sendOtpMutation.isPending ? <RefreshCw className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                        REQUEST SECURITY OTP
                    </button>
                ) : (
                    <div className="w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="ENTER 6-DIGIT OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-center text-xl font-black tracking-[0.5em] placeholder:tracking-normal placeholder:text-sm"
                            />
                        </div>
                        <button
                            onClick={() => verifyOtpMutation.mutate(otp)}
                            disabled={otp.length !== 6 || verifyOtpMutation.isPending}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-300"
                        >
                            {verifyOtpMutation.isPending ? <RefreshCw className="animate-spin w-5 h-5 mx-auto" /> : 'VERIFY & UNLOCK'}
                        </button>
                        <button
                            onClick={() => sendOtpMutation.mutate()}
                            className="text-indigo-600 font-bold text-sm hover:underline"
                        >
                            Didn't receive it? Resend OTP
                        </button>
                    </div>
                )}

                <div className="mt-12 flex items-center gap-3 px-4 py-2 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Secure Area Monitoring Enabled</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
