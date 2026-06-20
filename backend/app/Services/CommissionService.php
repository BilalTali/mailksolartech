<?php

namespace App\Services;

use App\Exceptions\CommissionAccessDeniedException;
use App\Exceptions\CommissionAlreadyExistsException;
use App\Exceptions\CommissionLockedException;
use App\Exceptions\LeadNotCompletedException;
use App\Models\AdminLedger;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CommissionService
{
    public function __construct(
        private PipelineService $pipelineService,
        private HierarchyService $hierarchyService,
        private NotificationService $notificationService,
    ) {}

    /**
     * UNIFIED COMMISSION ENTRY
     * Handles all roles (Super Agent, Agent, Enumerator) based on the hierarchy chain.
     */
    public function enterCommission(
        Lead $lead,
        User $payee,
        float $amount,
        User $payer
    ): Commission {
        $pos = $this->pipelineService->positionOf($lead->status);
        $minPos = $this->pipelineService->positionOf('DISBURSEMENT_VERIFIED');

        if ($pos === null || $minPos === null || $pos < $minPos) {
            throw new LeadNotCompletedException('Commission can only be entered for leads that have reached the DISBURSEMENT_VERIFIED milestone.');
        }

        // Authorization logic based on parentage (Allow ancestors to enter commission)
        $logicalParentId = $this->hierarchyService->getLogicalParentId($payee, $lead);
        $ascendantSAId = $this->hierarchyService->findAscendantSuperAgentId($payee);

        // PUBLIC REFERRAL LEAD: Admin always authorized to pay the referral BDM directly
        $isPublicReferralLead = ($lead->source === 'public_form' && $lead->referral_agent_id && ! $lead->submitted_by_agent_id && ! $lead->submitted_by_enumerator_id);

        $isAuthorized = ($payer->isAdmin() ||
                         $isPublicReferralLead ||
                         (int) $logicalParentId === (int) $payer->id || 
                         ($payer->isSuperAgent() && (int) $ascendantSAId === (int) $payer->id));

        if (! $isAuthorized) {
            throw new CommissionAccessDeniedException('You can only enter commissions for your subordinates.');
        }

        $existing = Commission::query()->withTrashed()->where(fn($q) => $q->where('lead_id', $lead->id))
            ->where(fn($q) => $q->where('payee_id', $payee->id))
            ->first();

        if ($existing) {
            if ($existing->isPaid()) {
                throw new CommissionAlreadyExistsException('Commission already paid for this lead.');
            }
            $existing->forceDelete();
        }

        return DB::transaction(function () use ($lead, $payee, $amount, $payer) {
            // Balance check INSIDE the transaction — prevents race conditions where
            // two concurrent requests both read a passing balance, then both commit.
            // Only enforce balance check for regular admins.
            if ($payer->role === 'admin') {
                $globalNetEarning = $this->getAdminGlobalNetEarning($payer);
                if ($globalNetEarning < $amount) {
                    throw new CommissionAccessDeniedException(
                        'Insufficient balance. You have ₹' . number_format($globalNetEarning, 2) .
                        ' available, but tried to pass ₹' . number_format($amount, 2) . '.'
                    );
                }
            }

            $commission = Commission::create([
                'lead_id'    => $lead->id,
                'payee_id'   => $payee->id,
                'payee_role' => $payee->role,
                'amount'     => $amount,
                'entered_by' => $payer->id,
                'locked_at'  => now()->addHours(24),
            ]);

            $this->refreshLeadCommissionStatus($lead);

            // Notify Payee
            $this->notificationService->send(
                $payee->id,
                'commission_entered',
                '💰 Commission Entered',
                "{$payer->name} has entered ₹{$amount} commission for lead {$lead->ulid}.",
                ['lead_ulid' => $lead->ulid, 'commission_id' => $commission->id, 'amount' => $amount]
            );

            return $commission;
        });
    }

    public function getAdminGlobalNetEarning(?User $admin = null): float
    {
        $adminId = ($admin && $admin->role === 'admin') ? $admin->id : null;

        $ledgerCredits = $adminId 
            ? AdminLedger::whereAdminId($adminId)->whereTransactionType('credit')->sum('amount')
            : AdminLedger::whereTransactionType('credit')->sum('amount');

        $ledgerDebits = $adminId 
            ? AdminLedger::whereAdminId($adminId)->whereTransactionType('debit')->sum('amount')
            : AdminLedger::whereTransactionType('debit')->sum('amount');

        $commissionsEarned = $adminId 
            ? Commission::wherePayeeId($adminId)->wherePayeeRole('admin')->sum('amount')
            : Commission::wherePayeeRole('admin')->sum('amount');

        $downlineRoles = ['agent', 'enumerator', 'field_technical_team', 'super_agent'];
        $commissionsToDownlines = $adminId 
            ? Commission::whereEnteredBy($adminId)->whereIn('payee_role', $downlineRoles)->sum('amount')
            : Commission::whereIn('payee_role', $downlineRoles)->sum('amount');

        return (float) (($commissionsEarned + $ledgerCredits) - ($ledgerDebits + $commissionsToDownlines));
    }

    /**
     * EDIT COMMISSION (within 24 hours only)
     */
    public function editCommission(
        Commission $commission,
        float $newAmount,
        User $editor
    ): Commission {
        if ($commission->isLocked() && ! $editor->isAdmin()) {
            throw new CommissionLockedException('This commission cannot be edited. It was locked 24 hours after creation.');
        }

        if ($commission->isPaid()) {
            throw new CommissionLockedException('Paid commissions cannot be edited.');
        }

        $logicalParentId = $this->hierarchyService->getLogicalParentId($commission->payee, $commission->lead);
        $isParent = (int) $logicalParentId === (int) $editor->id;
        $isEnterer = (int) $commission->entered_by === (int) $editor->id;

        if (!$isParent && !$isEnterer && !$editor->isAdmin()) {
            throw new CommissionAccessDeniedException('You are not authorized to edit this commission.');
        }

        // Only enforce balance check for regular admins. Super Admins can override/set initial values.
        if ($editor->role === 'admin') {
            $diff = $newAmount - $commission->amount;
            if ($diff > 0) {
                $globalNetEarning = $this->getAdminGlobalNetEarning($editor);
                if ($globalNetEarning < $diff) {
                    throw new CommissionAccessDeniedException('Insufficient balance. You have ₹' . number_format($globalNetEarning, 2) . ' available, but tried to increase by ₹' . number_format($diff, 2) . '.');
                }
            }
        }

        $commission->update([
            'amount' => $newAmount,
            'entered_by' => $editor->id,
        ]);

        $this->refreshLeadCommissionStatus($commission->lead);

        return $commission;
    }

    // Removed role-specific enterEnumeratorCommission (unified into enterCommission)

    /**
     * MARK COMMISSION AS PAID
     * Hierarchy-aware: Parent can pay their direct children. Admin can pay anyone.
     */
    public function markAsPaid(
        Commission $commission,
        array $paymentData,
        User $payer
    ): Commission {
        $payee = $commission->payee;
        $logicalParentId = $this->hierarchyService->getLogicalParentId($payee, $commission->lead);
        $ascendantSAId = $this->hierarchyService->findAscendantSuperAgentId($payee);

        $isAuthorized = ($payer->isAdmin() || 
                         (int) $logicalParentId === (int) $payer->id || 
                         ($payer->isSuperAgent() && (int) $ascendantSAId === (int) $payer->id));

        if (! $isAuthorized) {
            throw new CommissionAccessDeniedException('You can only mark payments for your subordinates.');
        }

        if ($commission->isPaid()) {
            throw new \InvalidArgumentException('Commission is already marked as paid.');
        }

        if ((float) $commission->amount <= 0) {
            throw new \InvalidArgumentException('Cannot mark a zero or negative commission as paid.');
        }

        $commission->update([
            'payment_status' => 'paid',
            'paid_at' => now(),
            'paid_by' => $payer->id,
            'payment_method' => $paymentData['payment_method'],
            'payment_reference' => $paymentData['payment_reference'],
            'payment_notes' => $paymentData['payment_notes'] ?? null,
        ]);

        $this->notifyPaymentMade($commission);

        return $commission;
    }

    /**
     * REVOKE UNPAID COMMISSIONS
     * Called when lead status moves away from terminal 'LEAD_COMPLETED' or MNRE statuses.
     */
    public function revokeUnpaidCommissions(Lead $lead, ?User $revokedBy = null): void
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Commission> $commissions */
        $commissions = Commission::query()->where(fn ($q) => $q->whereLeadId($lead->id))->unpaid()->get();

        foreach ($commissions as $commission) {
            $this->notifyCommissionRevoked($commission, $revokedBy);
            $commission->forceDelete();
        }

        if ($commissions->isNotEmpty()) {
            $this->refreshLeadCommissionStatus($lead);
        }
    }

    // ── Phase 3: Auto-Commission Triggers ────────────────────────────────────

    /**
     * TRIGGER 1: HIERARCHY COMMISSIONS — fires on DISBURSEMENT_VERIFIED
     *
     * Walks the commission chain from the lead's submitter upward,
     * creates an auto-commission record for each person using slab amounts.
     * Skips if a commission for that payee already exists.
     */
    public function triggerHierarchyCommissions(Lead $lead, User $actor): void
    {

        // Resolve starting point (bottom of hierarchy)
        $submitter = $lead->submittedByEnumerator
            ?? $lead->submittedByAgent
            ?? User::find($lead->submitted_by_agent_id)
            ?? $lead->createdBySuperAgent
            ?? User::find($lead->created_by_super_agent_id);

        if (! $submitter) {
            return; // No chain to walk
        }

        $chain = $this->hierarchyService->getCommissionChain($submitter, $lead);

        // Prepend submitter itself (enumerator or agent)
        $fullChain = collect([$submitter])->merge($chain)->filter()->unique(fn($item) => $item->id);

        $level = 1;
        DB::transaction(function () use ($lead, $actor, $fullChain, &$level) {
            foreach ($fullChain as $payee) {
                if ($payee->isAdmin()) {
                    continue;
                }

                // Skip if auto-commission already exists for this payee/lead (enforces unique_lead_payee_person constraint)
                $exists = Commission::whereLeadId($lead->id)
                    ->wherePayeeId($payee->id)
                    ->exists();

                if ($exists) {
                    $level++;
                    continue;
                }

                $payerId = $this->hierarchyService->getLogicalParentId($payee, $lead);
                $suggestedAmount = $this->getSuggestedAmount($lead, $payee, $payerId);

                Commission::create([
                    'lead_id'         => $lead->id,
                    'payee_id'        => $payee->id,
                    'payee_role'      => $payee->role,
                    'amount'          => $suggestedAmount,
                    'entered_by'      => $payerId,
                    'trigger_status'  => 'DISBURSEMENT_VERIFIED',
                    'triggered_at'    => now(),
                    'chain_type'      => 'HIERARCHY',
                    'hierarchy_level' => $level,
                    'locked_at'       => now()->addHours(48),
                ]);

                // Notify payee
                $this->notificationService->send(
                    $payee->id,
                    'commission_auto_triggered',
                    '💰 Commission Triggered — Disbursement Verified',
                    "A commission of ₹{$suggestedAmount} has been auto-created for lead {$lead->ulid} upon disbursement verification.",
                    ['lead_ulid' => $lead->ulid, 'amount' => $suggestedAmount, 'trigger' => 'DISBURSEMENT_VERIFIED']
                );

                $level++;
            }
        });

        $this->refreshLeadCommissionStatus($lead);
    }

    /**
     * TRIGGER 2: INSTALLER COMMISSION — fires on POD_SUCCESSFUL
     *
     * Creates a commission for the assigned field_technical_team installer.
     * Uses the technician slab (or 0 if no slab configured).
     * Skips if installer commission already exists.
     */
    public function triggerInstallerCommission(Lead $lead, User $actor): void
    {
        $technicians = [];

        // 1. Resolve Surveyor
        if (!empty($lead->assigned_surveyor_id)) {
            $technicians[] = [
                'user' => User::find($lead->assigned_surveyor_id),
                'type' => 'SURVEYOR'
            ];
        }

        // 2. Resolve Installer
        if (!empty($lead->assigned_installer_id)) {
            $technicians[] = [
                'user' => User::find($lead->assigned_installer_id),
                'type' => 'INSTALLER'
            ];
        }

        foreach ($technicians as $tech) {
            $user = $tech['user'];
            if (!$user) continue;

            // Skip if commission already exists for this lead/user/type combo
            $exists = Commission::whereLeadId($lead->id)
                ->wherePayeeId($user->id)
                ->whereChainType($tech['type'])
                ->exists();

            if ($exists) continue;

            // Use slab lookup
            $amount = $this->getSuggestedAmount($lead, $user, null);

            DB::transaction(function () use ($lead, $actor, $user, $amount, $tech) {
                Commission::create([
                    'lead_id'         => $lead->id,
                    'payee_id'        => $user->id,
                    'payee_role'      => 'field_technical_team',
                    'amount'          => $amount,
                    'entered_by'      => $actor->id,
                    'trigger_status'  => 'POD_SUCCESSFUL',
                    'triggered_at'    => now(),
                    'chain_type'      => $tech['type'],
                    'hierarchy_level' => 1,
                    'locked_at'       => now()->addHours(48),
                ]);

                $this->notificationService->send(
                    $user->id,
                    'commission_auto_triggered',
                    '🔧 Installation Commission Triggered',
                    "A commission of ₹{$amount} has been auto-created for your {$tech['type']} work on lead {$lead->ulid} (POD passed).",
                    ['lead_ulid' => $lead->ulid, 'amount' => $amount, 'trigger' => 'POD_SUCCESSFUL']
                );
            });
        }

        $this->refreshLeadCommissionStatus($lead);
    }

    /**
     * DYNAMIC COMMISSION STATUS REFRESH
     * Analyzes the hierarchy chain to see if all required commissions are entered.
     */
    private function refreshLeadCommissionStatus(Lead $lead): void
    {
        $lead->refresh();
        $submitter = $lead->submittedByEnumerator ?? $lead->submittedByAgent ?? $lead->createdBySuperAgent;

        // COMMISSION REDESIGN v1.0:
        // All leads (including public referral leads) now have proper submitter fields set.
        // No special-case needed for "public referral with no submitter".
        if (! $submitter) {
            $lead->update(['commission_entry_status' => 'none']);
            return;
        }

        $chain = $this->hierarchyService->getCommissionChain($submitter, $lead);

        // The submitter (enumerator) also gets a commission entry
        $requiredPayees = [];
        if ($submitter->role === 'enumerator') {
            $requiredPayees[] = $submitter->id;
        }
        foreach ($chain as $user) {
            $requiredPayees[] = $user->id;
        }

        $enteredCount = Commission::query()->where(fn($q) => $q->where('lead_id', $lead->id))->whereIn('payee_id', $requiredPayees)->count();

        $status = match (true) {
            $enteredCount === 0 => 'none',
            $enteredCount === count($requiredPayees) => 'all_entered',
            default => 'partially_entered',
        };

        $lead->update(['commission_entry_status' => $status]);
    }

    /**
     * DYNAMIC COMMISSION PROMPTS
     * Returns a list of required commissions for the given lead.
     */
    public function getCommissionStatus(Lead $lead): array
    {
        // Guard against leads with null status (legacy or malformed data)
        if ($lead->status === null) {
            return [
                'prompts' => [],
                'entry_status' => 'none'
            ];
        }

        $pos = $this->pipelineService->positionOf($lead->status);
        $minPos = $this->pipelineService->positionOf('DISBURSEMENT_VERIFIED');

        if ($pos === null || $minPos === null || $pos < $minPos) {
            return [];
        }

        // Determine if the lead has passed the POD inspection milestone.
        $podPos = $this->pipelineService->positionOf('POD_SUCCESSFUL');
        $leadHasPassedPod = ($podPos !== null && $pos >= $podPos);

        $prompts = [];
        $processedPayeeIds = [];

        // 1. Identify all potential payees (Submitter, Assignee, Enumerator)
        $potentialPayees = collect([
            $lead->submittedByEnumerator,
            $lead->submittedByAgent,
            $lead->assignedAgent,
            $lead->createdBySuperAgent,
            $leadHasPassedPod ? $lead->assignedSurveyor  : null,
            $leadHasPassedPod ? $lead->assignedInstaller : null,
        ])->filter()->unique(fn($item) => $item->id);

        foreach ($potentialPayees as $payee) {
            /** @var User $payee */
            if ($payee->isAdmin()) continue;

            $prompts[] = $this->buildPrompt($lead, $payee, $payee->role);
            $processedPayeeIds[] = $payee->id;
        }

        // 2. Walk the upstream hierarchy chain from the submitter to Admin
        $startingUser = $lead->submittedByEnumerator
            ?? $lead->submittedByAgent
            ?? $lead->assignedAgent
            ?? $lead->createdBySuperAgent;

        if ($startingUser) {
            $chain = $this->hierarchyService->getCommissionChain($startingUser, $lead);
            foreach ($chain as $user) {
                if (!in_array($user->id, $processedPayeeIds)) {
                    $prompts[] = $this->buildPrompt($lead, $user, $user->role);
                    $processedPayeeIds[] = $user->id;
                }
            }
        }

        return $prompts;
    }

    /**
     * Build a commission prompt specifically for a referral BDM on a public form lead.
     * Payer is always Admin for these leads.
     */
    private function buildReferralPrompt(Lead $lead, User $referralSA): array
    {
        $comm = Commission::query()
            ->whereLeadId($lead->id)
            ->wherePayeeId($referralSA->id)
            ->first();

        return [
            'payee_id'         => $referralSA->id,
            'payee_name'       => $referralSA->name,
            'payee_role'       => $referralSA->role,
            'payee_code'       => $referralSA->super_agent_code ?? $referralSA->agent_id ?? '',
            'payee_type_label' => 'Business Development Manager (Referral)',
            'payer_id'         => null,   // Admin — no specific user ID
            'payer_name'       => 'Admin',
            'payer_role'       => 'admin',
            'status'           => $comm ? 'entered' : 'pending',
            'amount'           => $comm ? (float) $comm->amount : null,
            'suggested_amount' => $this->getSuggestedAmount($lead, $referralSA, null),
            'payment_status'   => $comm ? $comm->payment_status : null,
            'commission_id'    => $comm ? $comm->id : null,
            'is_editable'      => $comm ? (! $comm->isLocked() && ! $comm->isPaid()) : true,
        ];
    }

    private function buildPrompt(Lead $lead, User $payee, string $role): array
    {
        $payerId = $this->hierarchyService->getLogicalParentId($payee, $lead);
        if ($role === 'field_technical_team') {
            $payerId = null; // Admin pays Field Technical Team directly
        }
        $payer = $payerId ? User::find($payerId) : null;

        $comm = Commission::query()->where(fn($q) => $q->whereLeadId($lead->id))->where(fn($q) => $q->wherePayeeId($payee->id))->first();
        
        return [
            'payee_id' => $payee->id,
            'payee_name' => $payee->name,
            'payee_role' => $role,
            'payee_code' => match($role) {
                'super_agent' => $payee->super_agent_code,
                'agent' => $payee->agent_id,
                'enumerator' => $payee->enumerator_id,
                default => ''
            },
            'payee_type_label' => match($role) {
                'super_agent' => 'Business Development Manager',
                'agent' => 'Business Development Executive',
                'enumerator' => 'Enumerator',
                'field_technical_team' => 'Field Technician ' . ($payee->technician_type ? ' (' . ucfirst($payee->technician_type) . ')' : ''),
                default => 'Executive',
            },
            'payer_id' => $payerId,
            'payer_name' => $payer?->name ?? 'Admin',
            'payer_role' => $payer ? $payer->role : 'admin',
            'status' => $comm ? 'entered' : 'pending',
            'amount' => $comm ? (float)$comm->amount : null,
            'suggested_amount' => $this->getSuggestedAmount($lead, $payee, $payerId),
            'payment_status' => $comm ? $comm->payment_status : null,
            'commission_id' => $comm ? $comm->id : null,
            'is_editable' => $comm ? (! $comm->isLocked() && ! $comm->isPaid()) : true,
        ];
    }

    private function getSuggestedAmount(Lead $lead, User $payee, ?int $payerId = null): float
    {
        $capacity = $lead->system_capacity ?: '1kw';
        $payerId = $payerId ?? $payee->parent_id;

        // 1. Try to find slab owned by the Payer
        $slabQuery = \App\Models\CommissionSlab::query()->where(fn($q) => $q->where('capacity', $capacity));
        
        if ($payerId) {
            $slab = (clone $slabQuery)->where(fn($q) => $q->where('super_agent_id', $payerId))->first();
        } else {
            $slab = (clone $slabQuery)->whereNull('super_agent_id')->first();
        }

        // 2. Fallback to System default (NULL super_agent_id)
        if (!$slab && $payerId) {
            $slab = (clone $slabQuery)->whereNull('super_agent_id')->first();
        }

        if (!$slab) return 0.0;

        return match($payee->role) {
            'agent' => (float)$slab->agent_commission,
            'super_agent' => (float)$slab->super_agent_override,
            'enumerator' => (float)$slab->enumerator_commission,
            'field_technical_team' => 0.0, // Default to 0.0 until technical slabs are implemented
            default => 0.0
        };
    }

    /**
     * GET COMMISSION DATA FOR A LEAD
     * Returns a predictable list of all commissions associated with the lead.
     */
    public function getLeadCommissions(Lead $lead): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Commission> $commissions */
        $commissions = Commission::query()
            ->where(fn ($q) => $q->whereLeadId($lead->id))
            ->with(['payee', 'enteredBy'])
            ->get();

        return $commissions->map(fn($c) => $this->formatCommissionForResponse($c))->toArray();
    }

    private function formatCommissionForResponse(Commission $c): array
    {
        return [
            'id' => $c->id,
            'amount' => (float) $c->amount,
            'payee_id' => $c->payee_id,
            'payee_role' => $c->payee_role,
            'payee_name' => $c->payee->name,
            'payee_code' => match($c->payee_role) {
                'super_agent' => $c->payee?->super_agent_code ?? '',
                'agent' => $c->payee?->agent_id ?? '',
                'enumerator' => $c->payee?->enumerator_id ?? '',
                default => '',
            },
            'entered_by' => $c->enteredBy->name,
            'entered_at' => $c->created_at->toIso8601String(),
            'payment_status' => $c->payment_status,
            'is_locked' => $c->isLocked(),
            'is_editable' => ! $c->isLocked(),
            'chain_type' => $c->chain_type,
        ];
    }

    // ── Private notification helpers ──────────────────────────────────
    // Note: notifySuperAgentCommissionEntered, notifyAgentCommissionEntered,
    // and notifyAgentDirectCommissionEntered were removed (dead code).
    // All commission notifications now use notificationService->send() directly inline.

    private function notifyPaymentMade(Commission $commission): void
    {
        $payee = $commission->payee;
        $paidBy = $commission->paidBy;
        $this->notificationService->send(
            $payee->id,
            'commission_paid',
            '✅ Commission Payment Received',
            "₹{$commission->amount} has been marked as paid by {$paidBy->name}. Ref: {$commission->payment_reference}",
            ['commission_id' => $commission->id, 'amount' => $commission->amount]
        );
    }

    private function notifyCommissionRevoked(Commission $commission, ?User $revokedBy = null): void
    {
        $payee = $commission->payee;
        $lead = $commission->lead;
        $revokedByName = $revokedBy ? $revokedBy->name : 'Admin (Status Update)';

        $this->notificationService->send(
            $payee->id,
            'commission_revoked',
            '⚠️ Commission Revoked',
            "Your commission of ₹{$commission->amount} for lead {$lead->ulid} has been revoked due to a status update by {$revokedByName}.",
            ['lead_ulid' => $lead->ulid, 'amount' => $commission->amount]
        );
    }
}
