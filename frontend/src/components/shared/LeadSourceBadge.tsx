import React from 'react';
import type { LeadSource } from '@/types';

const config: Record<LeadSource, { label: string; bgClass: string; textClass: string }> = {
    public_form: {
        label: 'Public',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-700',
    },
    agent_submission: {
        label: 'Agent',
        bgClass: 'bg-green-100',
        textClass: 'text-green-700',
    },
    super_agent_submission: {
        label: 'SA',
        bgClass: 'bg-purple-100',
        textClass: 'text-purple-700',
    },
    admin_manual: {
        label: 'Admin',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-600',
    },
};

interface Props {
    source: LeadSource;
    className?: string;
}

export const LeadSourceBadge: React.FC<Props> = ({ source, className = '' }) => {
    const cfg = config[source];
    if (!cfg) return null;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgClass} ${cfg.textClass} ${className}`}>
            {cfg.label}
        </span>
    );
};
