import React, { useState } from 'react';
import { FileDown, Lock, Loader2 } from 'lucide-react';
import { User } from '@/types';
import { joiningLetterApi } from '@/services/joiningLetter.api';
import { toast } from 'react-hot-toast';
import { useSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/store/authStore';

interface DownloadJoiningLetterButtonProps {
    user: User;
    variant?: 'primary' | 'outline' | 'ghost' | 'sidebar' | 'button' | 'card';
    className?: string;
}

const DownloadJoiningLetterButton: React.FC<DownloadJoiningLetterButtonProps> = ({
    user,
    variant = 'primary',
    className = ''
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { companyName } = useSettings();
    const { user: authUser } = useAuthStore();
    const isAdmin = ['admin', 'super_admin', 'operator'].includes(authUser?.role || '');

    // Is the target user approved and profile complete (>= 60%)?
    // If authUser is an admin, they can bypass the lock for any user (including themselves)
    const isProfileComplete = (user?.profile_completion ?? 0) >= 60;
    const isApproved = isAdmin || (user?.status === 'active' && isProfileComplete);

    const lockTitle = !isProfileComplete
        ? "Please complete your profile (60%) to download"
        : "Waiting for Admin approval";

    const handleDownload = async () => {
        if (!isApproved) return;

        try {
            setIsDownloading(true);
            // If it's an admin viewing potentially another user, pass the target userId
            const downloadUrl = await joiningLetterApi.getDownloadUrl(isAdmin ? user.id : undefined);

            // Detect Mobile / PWA Standalone Mode
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

            if (isIOS || isStandalone) {
                // On iOS or Standalone PWA, direct navigation is more reliable for triggers the native PDF viewer/download
                window.open(downloadUrl, '_blank');
                toast.success('Opening Joining Letter...');
            } else {
                // Desktop/Standard: Fetch as blob to bypass PWA navigation cache interception
                const fileResponse = await fetch(downloadUrl);
                if (!fileResponse.ok) throw new Error('Failed to download');
                
                const blob = await fileResponse.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `Joining_Letter_${user.name.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);

                toast.success('Joining letter download started.');
            }
        } catch (error: any) {
            if (import.meta.env.DEV) {
                console.error('Download error:', error);
            }
            toast.error(error.response?.data?.message || 'Failed to download joining letter.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isApproved) {
        if (variant === 'button' || variant === 'primary') {
            return (
                <button
                    disabled
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl opacity-60 cursor-not-allowed bg-slate-200 text-slate-500 shadow-sm ${className}`}
                    title={lockTitle}
                >
                    <Lock className="w-4 h-4" />
                    <span>Letter Locked</span>
                </button>
            );
        }

        return (
            <button
                disabled
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg opacity-60 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
                title={lockTitle}
            >
                <Lock className="w-4 h-4" />
                <span>Letter Locked</span>
            </button>
        );
    }

    if (variant === 'card') {
        return (
            <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${className}`}
                style={{ borderLeft: '4px solid #F97316' }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-orange-50 text-orange-600">
                        <FileDown size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-base">Joining Letter</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Official {companyName} appointment letter
                        </p>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileDown className="w-4 h-4" />
                        )}
                        {isDownloading ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>
            </div>
        );
    }

    const baseStyles = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600",
        outline: "border-2 border-orange-500 text-orange-600 hover:bg-orange-50 bg-white",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        sidebar: "w-full bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50",
        button: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg rounded-xl font-bold"
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FileDown className="w-4 h-4" />
            )}
            <span>{isDownloading ? 'Generating...' : 'Joining Letter'}</span>
        </button>
    );
};

export default DownloadJoiningLetterButton;
