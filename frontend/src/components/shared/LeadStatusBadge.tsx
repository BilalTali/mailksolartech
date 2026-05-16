import { STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import type { LeadStatus } from '@/types';

interface LeadStatusBadgeProps {
    status: LeadStatus;
    className?: string;
}

export default function LeadStatusBadge({ status, className = '' }: LeadStatusBadgeProps) {
    const colorClass = STATUS_COLORS[status] || 'badge-new';
    const label = STATUS_LABELS[status] || status.replace(/_/g, ' ');

    return (
        <span
            className={`badge ${colorClass} ${className}`}
            role="status"
            aria-label={`Status: ${label}`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
            {label}
        </span>
    );
}
