<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\User;

/**
 * StatusTransitionService
 *
 * Single source of truth for which statuses each role may transition a lead to.
 * All status-change endpoints (admin, technical) MUST call canTransition() before
 * persisting a status change. Admin always passes (no restrictions by design).
 *
 * Status strings match the UPPERCASE convention used throughout the application.
 */
class StatusTransitionService
{
    // ── Complete status set — always derived from LeadStatus enum (CRIT-08 fix).
    // Do NOT maintain a separate hardcoded list here — it will diverge.
    public static function allStatuses(): array
    {
        return \App\Enums\LeadStatus::values();
    }

    // Legacy constant kept for backward compat with any direct reference — delegates to enum.
    // @deprecated Use allStatuses() instead.
    public const ALL_STATUSES = [
        'NEW', 'REJECTED', 'REGISTERED', 'SURVEY_DONE',
        'LEAD_DOCUMENTS_PRINTED', 'SIGNATURE_PENDING', 'SIGNATURE_DONE',
        'FILE_SUBMITTED_TO_BANK', 'FILE_PENDING_DISBURSAL', 'FILE_DISBURSED',
        'DISBURSEMENT_VERIFIED', 'DISPATCH_INITIATED', 'IN_TRANSIT', 'DELIVERED',
        'MATERIAL_VERIFIED_BY_CONSUMER', 'INSTALLATION_SCHEDULED',
        'INSTALLATION_IN_PROGRESS', 'SOLAR_INSTALLED', 'INSTALLATION_VERIFIED',
        'INSTALLATION_COMPLETED', 'POD_INSPECTION_INITIATED', 'POD_REJECTED',
        'POD_SUCCESSFUL', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST',
        'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED', 'LEAD_COMPLETED',
    ];

    // ── Statuses the field_technical_team may set via geo-tagged visit ──
    public const TECHNICAL_STATUSES = [
        'SURVEY_DONE',
        'SOLAR_INSTALLED',
        'INSTALLATION_IN_PROGRESS',
    ];

    // ── Statuses that REQUIRE a geotag (photo + GPS) when set by tech ─
    public const GEOTAG_REQUIRED_STATUSES = [
        'SURVEY_DONE',
        'SOLAR_INSTALLED',
        'INSTALLATION_VERIFIED',
        'POD_SUCCESSFUL',
    ];

    // ── Statuses the lead creator (super_agent/agent/enumerator) may update — Banking Track ──
    // These run IN PARALLEL with the field technician's SURVEY_DONE.
    // A lead at REGISTERED can enter the banking track without waiting for SURVEY_DONE.
    // Both tracks must complete before admin can set DISBURSEMENT_VERIFIED.
    public const BANKING_STATUSES = [
        'LEAD_DOCUMENTS_PRINTED',
        'SIGNATURE_PENDING',
        'SIGNATURE_DONE',
        'FILE_SUBMITTED_TO_BANK',   // MED-08: was missing
        'FILE_PENDING_DISBURSAL',   // MED-08: was missing
        'FILE_DISBURSED',
    ];

    /**
     * Return the list of statuses the given user is allowed to transition
     * the lead to. Admin always gets the full list (no restrictions).
     *
     * @return string[]
     */
    public function getAllowedStatuses(User $user, Lead $lead): array
    {
        // Admin / Super Admin — unrestricted
        if ($user->isAdmin() || $user->isSuperAdmin()) {
            return self::allStatuses();
        }

        // Operator — same as admin for status changes
        if ($user->isOperator()) {
            return self::allStatuses();
        }

        // Field Technical Team — limited to geo-tagged statuses
        if ($user->isFieldTechnician()) {
            return self::TECHNICAL_STATUSES;
        }

        // Super Agent / Agent / Enumerator — limited to banking statuses
        if ($user->isSuperAgent() || $user->isAgent() || $user->isEnumerator()) {
            return self::BANKING_STATUSES;
        }

        return [];
    }

    /**
     * Check whether a user can transition a specific lead to $newStatus.
     * Returns true for admin regardless of current status (override by design).
     */
    public function canTransition(User $user, Lead $lead, string $newStatus): bool
    {
        return in_array($newStatus, $this->getAllowedStatuses($user, $lead), true);
    }

    /**
     * Return true when the given status transition REQUIRES a geotag photo
     * to be submitted alongside the status change.
     */
    public static function requiresGeotag(string $newStatus): bool
    {
        return in_array($newStatus, self::GEOTAG_REQUIRED_STATUSES, true);
    }

    /**
     * Return the human-readable label for a status string.
     * Keeps backend consistent with the frontend leadStatuses constant.
     */
    public function getLabel(string $status): string
    {
        // Delegate to LeadStatus enum if it knows the status
        $enum = LeadStatus::tryFrom($status);
        if ($enum !== null) {
            return $enum->label();
        }
        return str_replace('_', ' ', $status);
    }
}
