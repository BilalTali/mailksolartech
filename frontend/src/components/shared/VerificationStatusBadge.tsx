import React from 'react';
import type { LeadVerificationStatus } from '@/types';

const config: Record<LeadVerificationStatus, { label: string; bgClass: string; textClass: string; icon: string; pulse?: boolean }> = {
    not_required: {
        label: 'No Verification',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-500',
        icon: '',
    },
    pending_super_agent_verification: {
        label: 'Pending SA Review',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-800',
        icon: '⏳',
        pulse: true,
    },
    pending_agent_verification: {
        label: 'Pending Agent Review',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-800',
        icon: '⏳',
        pulse: true,
    },
    super_agent_verified: {
        label: 'SA Verified',
        bgClass: 'bg-green-100',
        textClass: 'text-green-700',
        icon: '✅',
    },
    reverted_to_agent: {
        label: 'Action Needed',
        bgClass: 'bg-red-100',
        textClass: 'text-red-700',
        icon: '↩',
    },
    reverted_to_enumerator: {
        label: 'Enm Action Needed',
        bgClass: 'bg-red-100',
        textClass: 'text-red-700',
        icon: '↩',
    },
    admin_override: {
        label: 'Admin Override',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-700',
        icon: '🔧',
    },
};

interface Props {
    status: LeadVerificationStatus;
    revertCount?: number;
    className?: string;
}

export const VerificationStatusBadge: React.FC<Props> = ({ status, revertCount, className = '' }) => {
    const cfg = config[status];
    if (!cfg || status === 'not_required') return null;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bgClass} ${cfg.textClass} ${cfg.pulse ? 'animate-pulse' : ''} ${className}`}
        >
            {cfg.icon && <span>{cfg.icon}</span>}
            {cfg.label}
            {status === 'reverted_to_agent' && revertCount !== undefined && revertCount > 0 && (
                <span className="ml-0.5 text-red-600 font-bold">×{revertCount}</span>
            )}
        </span>
    );
};
