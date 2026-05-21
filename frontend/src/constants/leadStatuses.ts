/**
 * Centralized Lead Status Configuration
 *
 * This file defines the human-readable labels and color-coded badges for all lead statuses.
 * It ensures consistency between the backend and all frontend screens (Admin, Super Agent, Agent).
 */

export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; badgeClass: string }> = {
    // ── Exact Requested Order ──
    'NEW': { label: 'NEW', color: 'bg-gray-100 text-gray-700', badgeClass: 'badge-new' },
    'DOCUMENTS_FOR_REGISTRATION_COMPLETED': { label: 'DOCUMENTS FOR REGISTRATION COMPLETED', color: 'bg-amber-50 text-amber-700', badgeClass: 'badge-docs-reg' },
    'REJECTED': { label: 'REJECTED', color: 'bg-red-50 text-red-700', badgeClass: 'badge-rejected' },
    'REGISTERED': { label: 'REGISTERED AT MNRE.', color: 'bg-indigo-50 text-indigo-700', badgeClass: 'badge-registered' },
    'SURVEY_DONE': { label: 'SITE SURVEY COMPLETED', color: 'bg-purple-50 text-purple-700', badgeClass: 'badge-survey' },
    'LEAD_DOCUMENTS_PRINTED': { label: 'LEGAL DOCUMENTS PRINTED', color: 'bg-indigo-50 text-indigo-700', badgeClass: 'badge-docs' },
    'SIGNATURE_PENDING': { label: 'CONSUMER SIGNATURE PENDING', color: 'bg-amber-50 text-amber-700', badgeClass: 'badge-signature' },
    'SIGNATURE_DONE': { label: 'CONSUMER SIGNATURE DONE', color: 'bg-green-50 text-green-700', badgeClass: 'badge-signature' },
    'FILE_DISBURSED': { label: 'FILE DISBURSED SUCCESSFULLY', color: 'bg-emerald-50 text-emerald-700', badgeClass: 'badge-disbursed' },
    'DISBURSEMENT_VERIFIED': { label: 'DISBURSEMENT VERIFIED BY ADMIN', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', badgeClass: 'badge-disbursed' },
    'DISPATCH_INITIATED': { label: 'MATERIAL DISPATCH INITIATED', color: 'bg-orange-50 text-orange-700', badgeClass: 'badge-dispatch' },
    'IN_TRANSIT': { label: 'MATERIAL IN TRANSIT', color: 'bg-yellow-50 text-yellow-700', badgeClass: 'badge-transit' },
    'DELIVERED': { label: 'MATERIAL DELIVERED', color: 'bg-emerald-50 text-emerald-700', badgeClass: 'badge-delivered' },
    'MATERIAL_VERIFIED_BY_CONSUMER': { label: 'MATERIAL VERIFIED BY CONSUMER', color: 'bg-emerald-50 text-emerald-700', badgeClass: 'badge-verified' },
    'INSTALLATION_SCHEDULED': { label: 'INSTALLATION SCHEDULED', color: 'bg-blue-50 text-blue-700', badgeClass: 'badge-installation-scheduled' },
    'INSTALLATION_IN_PROGRESS': { label: 'INSTALLATION IN PROGRESS', color: 'bg-blue-50 text-blue-700', badgeClass: 'badge-installation-progress' },
    'SOLAR_INSTALLED': { label: 'SOLAR INSTALLED SUCCESSFULLY', color: 'bg-green-50 text-green-700', badgeClass: 'badge-installed' },
    'POD_INSPECTION_INITIATED': { label: 'POD INSPECTION SCHEDULED', color: 'bg-purple-50 text-purple-700', badgeClass: 'badge-pod' },
    'POD_REJECTED': { label: 'POD INSPECTION REJECTED', color: 'bg-red-50 text-red-700', badgeClass: 'badge-rejected' },
    'POD_SUCCESSFUL': { label: 'POD INSPECTION PASSED', color: 'bg-emerald-50 text-emerald-700', badgeClass: 'badge-pod' },
    'PROJECT_COMMISSIONING': { label: 'PROJECT COMMISSIONING', color: 'bg-emerald-50 text-emerald-700', badgeClass: 'badge-commissioning' },
    'SUBSIDY_REQUEST': { label: 'SUBSIDY REQUEST FILED', color: 'bg-teal-50 text-teal-700', badgeClass: 'badge-subsidy-req' },
    'SUBSIDY_DISBURSED': { label: 'SUBSIDY DISBURSED', color: 'bg-green-50 text-green-700', badgeClass: 'badge-subsidy-paid' },
    'LEAD_COMPLETED': { label: 'LEAD COMPLETED', color: 'bg-green-50 text-green-700', badgeClass: 'badge-completed' },


};

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_CONFIG).map(([value, { label }]) => ({
    value,
    label,
}));

// ─────────────────────────────────────────────────────────────
// Pipeline order — mirrors PipelineService::ORDERED_PIPELINE
// ─────────────────────────────────────────────────────────────
export const ORDERED_PIPELINE: string[] = [
    'NEW',
    'DOCUMENTS_FOR_REGISTRATION_COMPLETED',
    'REJECTED',
    'REGISTERED',
    'SURVEY_DONE',
    'LEAD_DOCUMENTS_PRINTED',
    'SIGNATURE_PENDING',
    'SIGNATURE_DONE',
    'FILE_DISBURSED',
    'DISBURSEMENT_VERIFIED',
    'DISPATCH_INITIATED',
    'IN_TRANSIT',
    'DELIVERED',
    'MATERIAL_VERIFIED_BY_CONSUMER',
    'INSTALLATION_SCHEDULED',
    'INSTALLATION_IN_PROGRESS',
    'SOLAR_INSTALLED',
    'POD_INSPECTION_INITIATED',
    'POD_REJECTED',
    'POD_SUCCESSFUL',
    'PROJECT_COMMISSIONING',
    'SUBSIDY_REQUEST',
    'SUBSIDY_DISBURSED',
    'LEAD_COMPLETED',
];

/** Statuses that bypass forward-only enforcement (terminal). */
export const TERMINAL_STATUSES: string[] = [
    'REJECTED', 'POD_REJECTED',
];

/** Statuses the Field Technical Team must set with a physical geotag. */
export const GEOTAG_REQUIRED_STATUSES: string[] = [
    'SURVEY_DONE',
    'SOLAR_INSTALLED',
];

/**
 * How many pipeline steps are skipped when moving from `fromStatus` to `toStatus`?
 * Returns 0 for a clean single-step advance, positive for a skip, negative for backward.
 * Returns null if either status is not in the pipeline (e.g. terminal states).
 */
export function countPipelineSkips(fromStatus: string, toStatus: string): number | null {
    const fromPos = ORDERED_PIPELINE.indexOf(fromStatus);
    const toPos = ORDERED_PIPELINE.indexOf(toStatus);
    if (fromPos === -1 || toPos === -1) return null;
    return toPos - fromPos - 1; // 0 = one clean step, 1+ = stages skipped
}

// ─────────────────────────────────────────────────────────────
// Existing helpers
// ─────────────────────────────────────────────────────────────
export function getLeadStatusLabel(status: string): string {
    return LEAD_STATUS_CONFIG[status]?.label || status.replace(/_/g, ' ');
}

export function getLeadStatusColor(status: string): string {
    return LEAD_STATUS_CONFIG[status]?.color || 'bg-slate-100 text-slate-600';
}

export function getLeadStatusBadgeClass(status: string): string {
    return LEAD_STATUS_CONFIG[status]?.badgeClass || 'badge-new';
}

export const MILESTONE_STATUSES = [
    'NEW',
    'DOCUMENTS_FOR_REGISTRATION_COMPLETED',
    'REJECTED',
    'REGISTERED',
    'SURVEY_DONE',
    'LEAD_DOCUMENTS_PRINTED',
    'SIGNATURE_PENDING',
    'SIGNATURE_DONE',
    'FILE_DISBURSED',
    'DISBURSEMENT_VERIFIED',
    'DISPATCH_INITIATED',
    'IN_TRANSIT',
    'DELIVERED',
    'MATERIAL_VERIFIED_BY_CONSUMER',
    'INSTALLATION_SCHEDULED',
    'INSTALLATION_IN_PROGRESS',
    'SOLAR_INSTALLED',
    'POD_INSPECTION_INITIATED',
    'POD_REJECTED',
    'POD_SUCCESSFUL',
    'PROJECT_COMMISSIONING',
    'SUBSIDY_REQUEST',
    'SUBSIDY_DISBURSED',
    'LEAD_COMPLETED',
];

export const COMMISSIONABLE_STATUSES = MILESTONE_STATUSES;
