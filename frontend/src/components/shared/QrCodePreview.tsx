import React from 'react';
import { QrCode, ExternalLink, RefreshCw, ShieldCheck, History } from 'lucide-react';
import { User, ApiResponse } from '@/types';
import { agentsApi } from '@/services/agents.api';
import { adminSuperAgentApi } from '@/services/adminSuperAgent.api';
import { toast } from 'react-hot-toast';

interface QrCodePreviewProps {
    user: User;
    isAdminView?: boolean;
    onRegenerated?: (updatedUser: User) => void;
}

const QrCodePreview: React.FC<QrCodePreviewProps> = ({ user, isAdminView = false, onRegenerated }) => {
    const [isRegenerating, setIsRegenerating] = React.useState(false);

    // Construct verification URL (matches backend config('app.url') logic)
    const verificationUrl = user.qr_token
        ? `${window.location.origin}/verify/${user.qr_token}`
        : null;

    const handleRegenerate = async () => {
        if (!window.confirm('Are you sure? This will invalidate all previously printed ID cards for this user.')) {
            return;
        }

        setIsRegenerating(true);
        try {
            let res: ApiResponse<User>;
            if (user.role === 'super_agent') {
                res = await adminSuperAgentApi.regenerateQr(user.id);
            } else {
                res = await agentsApi.regenerateQr(user.id);
            }

            if (res.success) {
                toast.success('QR Code regenerated successfully');
                onRegenerated?.(res.data);
            }
        } catch (error) {
            toast.error('Failed to regenerate QR code');
        } finally {
            setIsRegenerating(false);
        }
    };

    if (!user.qr_token) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                <QrCode className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <h3 className="text-slate-300 font-medium">No QR Token Generated</h3>
                <p className="text-slate-500 text-sm mt-1">
                    QR codes are generated automatically upon account approval.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-bottom border-slate-800 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Secure Verification QR</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                    ID: {user.qr_token.substring(0, 8)}...
                </div>
            </div>

            <div className="p-6 flex flex-col items-center">
                {/* Visual Representation of QR (Note: Actual QR generation happens on server for ICard) */}
                {/* Here we just show a placeholder or link to the verification page */}
                <div className="relative group">
                    <div className="w-40 h-40 bg-white p-3 rounded-lg shadow-xl shadow-orange-500/10">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl || '')}&color=0A1931`}
                            alt="Verification QR"
                            className="w-full h-full"
                        />
                    </div>
                    <a
                        href={verificationUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-slate-950/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ExternalLink className="w-6 h-6 text-white" />
                    </a>
                </div>

                <div className="mt-6 w-full space-y-4">
                    <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Public Verification URL</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={verificationUrl || ''}
                                className="bg-transparent text-xs text-slate-300 w-full outline-none"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(verificationUrl || '');
                                    toast.success('URL copied to clipboard');
                                }}
                                className="text-orange-500 hover:text-orange-400 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/50">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <History className="w-3 h-3" /> Scans
                            </div>
                            <div className="text-lg font-bold text-white leading-tight">
                                {user.scan_count || 0}
                            </div>
                        </div>
                        <div className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/50">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Verified</div>
                            <div className="text-xs font-medium text-slate-300 leading-tight">
                                {user.last_verified_at ? new Date(user.last_verified_at).toLocaleDateString() : 'Never'}
                            </div>
                        </div>
                    </div>
                </div>

                {isAdminView && (
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-900/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate QR Token'}
                    </button>
                )}
            </div>

            <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                    {isAdminView
                        ? "Restricted action: Regenerating will permanently disconnect previously issued physical cards."
                        : "This QR code is embedded on your official ID card for live profile verification."}
                </p>
            </div>
        </div>
    );
};

export default QrCodePreview;
