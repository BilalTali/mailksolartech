import React, { useState } from 'react';
import { Copy, Check, Share2, MessageSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';

interface ReferralShareWidgetProps {
    referralCode: string;
    role: 'agent' | 'super_agent';
}

export const ReferralShareWidget: React.FC<ReferralShareWidgetProps> = ({ referralCode, role }) => {
    const [copied, setCopied] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { setUser } = useAuthStore();

    const baseUrl = window.location.origin;
    const referralUrl = referralCode ? `${baseUrl}/apply?ref=${referralCode}` : null;
    const roleName = role === 'agent' ? 'BDE (Field Agent)' : 'BDM (Team Manager)';

    /**
     * If the referral code is missing from the persisted auth store
     * (stale session from before the API fix), fetch fresh data from /me
     * and update the store so the code appears without forcing a re-login.
     */
    const refreshCode = async () => {
        setRefreshing(true);
        try {
            const res = await authApi.me();
            if (res.success && res.data) {
                setUser(res.data);
                toast.success('Referral code refreshed!');
            }
        } catch {
            toast.error('Could not refresh referral code.');
        } finally {
            setRefreshing(false);
        }
    };

    const copyToClipboard = async () => {
        if (!referralUrl) return;
        try {
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            toast.success('Referral link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const shareOnWhatsApp = () => {
        if (!referralUrl) return;
        const textToShare = role === 'agent'
            ? `Hi! Register for PM Surya Ghar Muft Bijli Yojana using my referral link and get up to 300 units of free electricity every month. Check your eligibility here: ${referralUrl}`
            : `Hi! I'm expanding my team for PM Surya Ghar project. If you're interested in joining as a BDE, use my referral link for priority registration: ${referralUrl}`;

        const message = encodeURIComponent(textToShare);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 shadow-sm overflow-hidden relative">
            {/* Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />

            <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-slate-800 leading-tight">Share Your Referral Link</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{roleName} Referral Program</p>
                        </div>
                    </div>

                    {/* Refresh button — shown when code is missing */}
                    {!referralCode && (
                        <button
                            onClick={refreshCode}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
                            title="Reload referral code"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Loading...' : 'Load Code'}
                        </button>
                    )}
                </div>

                {referralUrl ? (
                    <>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-indigo-100/50 shadow-inner">
                            <div className="flex-1 truncate pl-2 font-mono text-[10px] text-slate-500">
                                {referralUrl}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-slate-50 rounded-lg transition-colors group relative"
                                title="Copy Link"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={shareOnWhatsApp}
                                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-green-100 active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4" />
                                WhatsApp
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-700 py-2.5 rounded-xl font-bold text-xs transition-all border border-indigo-100 shadow-sm active:scale-95"
                            >
                                <Copy className="w-4 h-4" />
                                Copy Link
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="bg-white/70 rounded-xl border border-indigo-100 px-4 py-3 text-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Your referral code is not loaded yet.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Click <strong>Load Code</strong> above or log out and log back in.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
