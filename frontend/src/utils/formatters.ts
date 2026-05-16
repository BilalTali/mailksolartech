import { format } from 'date-fns';
import type { LeadStatus } from '@/types';
import { LEAD_STATUS_CONFIG } from '@/constants/leadStatuses';

export const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    return format(new Date(dateStr), 'dd MMM yyyy');
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
};

export const STATUS_LABELS: Record<LeadStatus, string> = Object.entries(LEAD_STATUS_CONFIG).reduce((acc, [key, val]) => {
    acc[key as LeadStatus] = val.label;
    return acc;
}, {} as Record<LeadStatus, string>);

export const STATUS_COLORS: Record<LeadStatus, string> = Object.entries(LEAD_STATUS_CONFIG).reduce((acc, [key, val]) => {
    acc[key as LeadStatus] = val.badgeClass;
    return acc;
}, {} as Record<LeadStatus, string>);

export const getFileUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').split('/api/v1')[0];
    return `${baseUrl}/storage/${path}`;
};
