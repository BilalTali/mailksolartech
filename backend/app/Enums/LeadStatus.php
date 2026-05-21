<?php

namespace App\Enums;

/**
 * LeadStatus — single source of truth for all valid lead status strings.
 */
enum LeadStatus: string
{
    // ── Pipeline Statuses (Sequential Order) ─────────────────────────────────
    case NEW                      = 'NEW';
    case DOCUMENTS_FOR_REGISTRATION_COMPLETED = 'DOCUMENTS_FOR_REGISTRATION_COMPLETED';
    case REGISTERED               = 'REGISTERED';
    case SURVEY_DONE              = 'SURVEY_DONE';
    case LEAD_DOCUMENTS_PRINTED   = 'LEAD_DOCUMENTS_PRINTED';
    case SIGNATURE_PENDING        = 'SIGNATURE_PENDING';
    case SIGNATURE_DONE           = 'SIGNATURE_DONE';
    case FILE_SUBMITTED_TO_BANK   = 'FILE_SUBMITTED_TO_BANK';
    case FILE_PENDING_DISBURSAL   = 'FILE_PENDING_DISBURSAL';
    case FILE_DISBURSED           = 'FILE_DISBURSED';
    case DISBURSEMENT_VERIFIED    = 'DISBURSEMENT_VERIFIED';
    case DISPATCH_INITIATED       = 'DISPATCH_INITIATED';
    case IN_TRANSIT               = 'IN_TRANSIT';
    case DELIVERED                = 'DELIVERED';
    case MATERIAL_VERIFIED_BY_CONSUMER = 'MATERIAL_VERIFIED_BY_CONSUMER';
    case INSTALLATION_SCHEDULED   = 'INSTALLATION_SCHEDULED';
    case INSTALLATION_IN_PROGRESS = 'INSTALLATION_IN_PROGRESS';
    case SOLAR_INSTALLED          = 'SOLAR_INSTALLED';
    case POD_INSPECTION_INITIATED = 'POD_INSPECTION_INITIATED';
    case POD_SUCCESSFUL           = 'POD_SUCCESSFUL';
    case PROJECT_COMMISSIONING    = 'PROJECT_COMMISSIONING';
    case SUBSIDY_REQUEST          = 'SUBSIDY_REQUEST';
    case SUBSIDY_APPLIED          = 'SUBSIDY_APPLIED';
    case SUBSIDY_DISBURSED        = 'SUBSIDY_DISBURSED';
    case LEAD_COMPLETED           = 'LEAD_COMPLETED';

    // ── Terminal & Exception Statuses ───────────────────────────────────────
    case REJECTED                 = 'REJECTED';
    case POD_REJECTED             = 'POD_REJECTED';
    case FILE_REJECTED            = 'FILE_REJECTED';

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** All status values as a flat string array (replaces ALL_STATUSES const). */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** Returns true for statuses that can be set from ANY pipeline position (no forward-only check). */
    public function isTerminal(): bool
    {
        return in_array($this, [
            self::REJECTED,
            self::POD_REJECTED,
            self::FILE_REJECTED,
        ], true);
    }

    /** Human-readable label. */
    public function label(): string
    {
        return match ($this) {
            // Pipeline
            self::NEW                    => 'NEW',
            self::DOCUMENTS_FOR_REGISTRATION_COMPLETED => 'DOCUMENTS FOR REGISTRATION COMPLETED',
            self::REJECTED               => 'REJECTED',
            self::FILE_REJECTED          => 'FILE REJECTED',
            self::REGISTERED             => 'REGISTERED AT MNRE',
            self::SURVEY_DONE            => 'SITE SURVEY COMPLETED',
            self::LEAD_DOCUMENTS_PRINTED => 'LEGAL DOCUMENTS PRINTED',
            self::SIGNATURE_PENDING      => 'CONSUMER SIGNATURE PENDING',
            self::SIGNATURE_DONE         => 'CONSUMER SIGNATURE DONE',
            self::FILE_SUBMITTED_TO_BANK => 'FILE SUBMITTED TO BANK',
            self::FILE_PENDING_DISBURSAL => 'FILE PENDING DISBURSAL',
            self::FILE_DISBURSED         => 'FILE DISBURSED SUCCESSFULLY',
            self::DISBURSEMENT_VERIFIED  => 'DISBURSEMENT VERIFIED BY ADMIN',
            self::DISPATCH_INITIATED     => 'MATERIAL DISPATCH INITIATED',
            self::IN_TRANSIT             => 'MATERIAL IN TRANSIT',
            self::DELIVERED              => 'MATERIAL DELIVERED',
            self::MATERIAL_VERIFIED_BY_CONSUMER  => 'MATERIAL VERIFIED BY CONSUMER',
            self::INSTALLATION_SCHEDULED => 'INSTALLATION SCHEDULED',
            self::INSTALLATION_IN_PROGRESS => 'INSTALLATION IN PROGRESS',
            self::SOLAR_INSTALLED        => 'SOLAR INSTALLED SUCCESSFULLY',
            self::POD_INSPECTION_INITIATED => 'POD INSPECTION INITIATED',
            self::POD_REJECTED           => 'POD INSPECTION REJECTED',
            self::POD_SUCCESSFUL         => 'POD INSPECTION PASSED',
            self::PROJECT_COMMISSIONING  => 'PROJECT COMMISSIONING',
            self::SUBSIDY_REQUEST        => 'SUBSIDY REQUEST FILED',
            self::SUBSIDY_APPLIED        => 'SUBSIDY APPLIED',
            self::SUBSIDY_DISBURSED      => 'SUBSIDY DISBURSED',
            self::LEAD_COMPLETED         => 'LEAD COMPLETED',
        };
    }
}
