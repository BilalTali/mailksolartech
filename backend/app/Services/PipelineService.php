<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Exceptions\InvalidLeadOperationException;
use App\Models\Lead;
use App\Models\LeadStatusLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * PipelineService
 *
 * Enforces the forward-only pipeline state machine with a PARALLEL TRACK model.
 *
 * Two independent tracks run in parallel after REGISTERED:
 *  ── Survey Track (field_technical_team): REGISTERED → SURVEY_DONE
 *  ── Banking Track (lead creator):        REGISTERED → LEAD_DOCUMENTS_PRINTED → SIGNATURE_PENDING → SIGNATURE_DONE → FILE_DISBURSED
 *
 * Both tracks MUST be complete before DISBURSEMENT_VERIFIED (admin merges them).
 *
 * Key rules:
 *  1. Forward-only applies within each track.
 *  2. Banking statuses (LEAD_DOCUMENTS_PRINTED → FILE_DISBURSED) are allowed
 *     whenever the lead is at REGISTERED or already in the banking track.
 *  3. DISBURSEMENT_VERIFIED requires both SURVEY_DONE AND FILE_DISBURSED to be reached.
 *  4. DISPATCH_INITIATED and beyond require DISBURSEMENT_VERIFIED.
 *  5. Admin/Operator always pass the actor check.
 */
class PipelineService
{
    /**
     * The canonical ordered pipeline.
     * Only statuses in this list are subject to forward-only enforcement.
     * The index of each status is its "position" — higher = later.
     */
    public const ORDERED_PIPELINE = [
        'NEW',
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

    /**
     * Statuses that belong to the BANKING track.
     * These can be advanced to from REGISTERED onward (in parallel with SURVEY_DONE).
     */
    public const BANKING_TRACK = [
        'LEAD_DOCUMENTS_PRINTED',
        'SIGNATURE_PENDING',
        'SIGNATURE_DONE',
        'FILE_DISBURSED',
    ];

    /**
     * Statuses that are eligible starting points for the banking track.
     * A lead at any of these can proceed to LEAD_DOCUMENTS_PRINTED.
     */
    public const BANKING_ELIGIBLE_STATUSES = [
        'REGISTERED',
        'SURVEY_DONE',          // survey done first, banking can still proceed
        'LEAD_DOCUMENTS_PRINTED',
        'SIGNATURE_PENDING',
        'SIGNATURE_DONE',
    ];

    /**
     * Roles allowed to trigger each status.
     * Admin + Operator always pass — they are not listed here but
     * are caught early in the actor check.
     */
    private const ACTOR_MAP = [
        'NEW'                      => ['admin', 'super_admin', 'operator'],
        'REGISTERED'               => ['admin', 'super_admin', 'operator'],
        'SURVEY_DONE'              => ['admin', 'super_admin', 'operator', 'field_technical_team'],
        // Bank sub-steps
        'LEAD_DOCUMENTS_PRINTED'   => ['admin', 'super_admin', 'operator', 'super_agent', 'agent', 'enumerator'],
        'SIGNATURE_PENDING'        => ['admin', 'super_admin', 'operator', 'super_agent', 'agent', 'enumerator'],
        'SIGNATURE_DONE'           => ['admin', 'super_admin', 'operator', 'super_agent', 'agent', 'enumerator'],

        'FILE_DISBURSED'           => ['admin', 'super_admin', 'operator', 'super_agent', 'agent', 'enumerator'],
        'DISBURSEMENT_VERIFIED'    => ['admin', 'super_admin', 'operator'],
        // Dispatch sub-steps
        'DISPATCH_INITIATED'       => ['admin', 'super_admin', 'operator'],
        'IN_TRANSIT'               => ['admin', 'super_admin', 'operator'],
        'DELIVERED'                => ['admin', 'super_admin', 'operator', 'consumer'],
        'MATERIAL_VERIFIED_BY_CONSUMER'  => ['admin', 'super_admin', 'operator', 'consumer'],
        'INSTALLATION_SCHEDULED'   => ['admin', 'super_admin', 'operator'],
        'INSTALLATION_IN_PROGRESS' => ['admin', 'super_admin', 'operator', 'field_technical_team'],
        'SOLAR_INSTALLED'          => ['admin', 'super_admin', 'operator', 'field_technical_team'],
        // POD
        'POD_INSPECTION_INITIATED' => ['admin', 'super_admin', 'operator'],
        'POD_SUCCESSFUL'           => ['admin', 'super_admin', 'operator'],
        // Post-install
        'PROJECT_COMMISSIONING'    => ['admin', 'super_admin', 'operator'],
        'SUBSIDY_REQUEST'          => ['admin', 'super_admin', 'operator'],
        'SUBSIDY_DISBURSED'        => ['admin', 'super_admin', 'operator'],
        'LEAD_COMPLETED'           => ['admin', 'super_admin', 'operator'],
        // Terminal states
        'REJECTED'                 => ['admin', 'super_admin', 'operator'],
        'POD_REJECTED'             => ['admin', 'super_admin', 'operator'],
    ];

    /**
     * Attempt to advance a lead to a new status.
     * Runs inside a DB transaction. Throws on invalid transition.
     *
     * @throws InvalidLeadOperationException
     */
    public function advanceTo(
        string $newStatus,
        Lead   $lead,
        User   $actor,
        ?string $notes = null
    ): Lead {
        return DB::transaction(function () use ($newStatus, $lead, $actor, $notes) {
            $this->assertActorAllowed($newStatus, $actor);

            if ($newStatus === $lead->status) {
                // Allow "updating" to the same status just to add notes
                if ($notes) {
                    LeadStatusLog::create([
                        'lead_id'         => $lead->id,
                        'changed_by'      => $actor->id,
                        'changed_by_role' => $actor->role,
                        'from_status'     => $lead->status,
                        'to_status'       => $newStatus,
                        'notes'           => $notes,
                    ]);
                }
                return $lead;
            }

            $this->assertForwardTransition($newStatus, $lead);

            $oldStatus = $lead->status;
            $lead->status = $newStatus;
            $lead->save();

            LeadStatusLog::create([
                'lead_id'         => $lead->id,
                'changed_by'      => $actor->id,
                'changed_by_role' => $actor->role,
                'from_status'     => $oldStatus,
                'to_status'       => $newStatus,
                'notes'           => $notes,
                'metadata'        => ['via' => 'PipelineService'],
            ]);

            return $lead->fresh();
        });
    }

    /**
     * Check if an actor role is permitted to trigger a given status.
     *
     * @throws InvalidLeadOperationException
     */
    public function assertActorAllowed(string $newStatus, User $actor): void
    {
        $allowed = self::ACTOR_MAP[$newStatus] ?? ['admin', 'super_admin', 'operator'];

        if (! in_array($actor->role, $allowed, true)) {
            throw new InvalidLeadOperationException(
                "Your role ({$actor->role}) is not permitted to set status [{$newStatus}]."
            );
        }
    }

    /**
     * Enforce forward-only pipeline movement.
     * Terminal states (ON_HOLD, INVALID, etc.) bypass this check.
     *
     * @throws InvalidLeadOperationException
     */
    public function assertForwardTransition(string $newStatus, Lead $lead): void
    {
        $statusEnum = LeadStatus::tryFrom($newStatus);

        // Terminal states bypass forward-only rule
        if ($statusEnum && $statusEnum->isTerminal()) {
            return;
        }

        $currentPos = $this->positionOf($lead->status);
        $targetPos  = $this->positionOf($newStatus);

        // If current is a terminal state, resolve the last known valid state to enforce correct resuming
        $currentEnum = LeadStatus::tryFrom($lead->status ?? '');
        if ($currentEnum && $currentEnum->isTerminal()) {
            $logs = LeadStatusLog::where('lead_id', $lead->id)
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->limit(20)
                ->get();
                
            $effectiveCurrentStatus = 'NEW';
            foreach ($logs as $log) {
                $enum = LeadStatus::tryFrom($log->from_status);
                if ($enum && !$enum->isTerminal()) {
                    $effectiveCurrentStatus = $log->from_status;
                    break;
                }
            }
            
            $currentPos = $this->positionOf($effectiveCurrentStatus);
            
            if ($targetPos !== null && $currentPos !== null && $targetPos < $currentPos) {
                throw new InvalidLeadOperationException(
                    "Cannot move lead backward. When resuming from [{$lead->status}], the lead must return to its last valid state [{$effectiveCurrentStatus}] or proceed forward. Attempted to move to [{$newStatus}]."
                );
            }
            return;
        }

        if ($targetPos !== null && $currentPos !== null && $targetPos <= $currentPos) {
            // Parallel track exception 1: Banking steps can be set from REGISTERED onward
            // (even when SURVEY_DONE at pos 3 hasn't been reached yet)
            $isBankingTarget   = in_array($newStatus, self::BANKING_TRACK, true);
            $isBankingEligible = in_array($lead->status, self::BANKING_ELIGIBLE_STATUSES, true);

            // Parallel track exception 2: SURVEY_DONE can be set when lead is in banking track
            // (surveyor completes visit while lead creator is processing banking documents)
            $isSurveyTarget    = $newStatus === 'SURVEY_DONE';
            $isInBankingTrack  = in_array($lead->status, self::BANKING_TRACK, true);

            if (!( ($isBankingTarget && $isBankingEligible) || ($isSurveyTarget && $isInBankingTrack) )) {
                throw new InvalidLeadOperationException(
                    "Cannot move lead backward: [{$lead->status}] → [{$newStatus}]. Pipeline moves forward only."
                );
            }
        }

        // ── Parallel track merge gate ──────────────────────────────────────────
        // DISBURSEMENT_VERIFIED requires:
        //  1. Banking track complete (lead status must be at FILE_DISBURSED)
        //  2. Survey track complete  (surveyor_form_submitted_at must be set)
        // The admin panel enforces this via the merge gate warning; the backend
        // double-checks condition 1. Condition 2 is a soft check (admin may override).
        if ($newStatus === 'DISBURSEMENT_VERIFIED') {
            $fileDisbursedPos = $this->positionOf('FILE_DISBURSED');
            if ($currentPos !== null && $fileDisbursedPos !== null && $currentPos < $fileDisbursedPos) {
                throw new InvalidLeadOperationException(
                    "Cannot mark Disbursement Verified: Banking track not complete. Lead must reach FILE_DISBURSED first."
                );
            }
        }

        // ── Dispatch gate ─────────────────────────────────────────────────────
        // Do not allow dispatching materials until after DISBURSEMENT_VERIFIED.
        $disburseVerifiedPos = $this->positionOf('DISBURSEMENT_VERIFIED');
        $dispatchPos = $this->positionOf('DISPATCH_INITIATED');
        if ($targetPos !== null && $currentPos !== null && $disburseVerifiedPos !== null && $dispatchPos !== null) {
            if ($targetPos >= $dispatchPos && $currentPos < $disburseVerifiedPos) {
                throw new InvalidLeadOperationException(
                    "Cannot proceed to [{$newStatus}] before Disbursement is Verified. Both Site Survey and Banking must be completed first."
                );
            }
        }
    }

    /**
     * Returns the position (0-based index) of a status in the ordered pipeline.
     * Returns null if status is not in the pipeline (e.g. terminal states).
     */
    public function positionOf(string $status): ?int
    {
        $pos = array_search($status, self::ORDERED_PIPELINE, true);
        return $pos !== false ? (int) $pos : null;
    }

    /**
     * Returns which roles are allowed to trigger the given status.
     */
    public function getAllowedActors(string $status): array
    {
        return self::ACTOR_MAP[$status] ?? ['admin', 'super_admin', 'operator'];
    }
}
