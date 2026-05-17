<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Exceptions\InvalidLeadOperationException;
use App\Exceptions\LeadAccessDeniedException;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadStatusLog;
use App\Models\LeadVerification;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class LeadService
{
    public function __construct(
        private NotificationService $notificationService,
        private CommissionService $commissionService,
        private OfferService $offerService,
        private HierarchyService $hierarchyService,
        private PipelineService $pipelineService,
        private ConsumerService $consumerService,
    ) {}

    // ────────────────────────────────────────────────────────────────
    // METHOD 1: createFromPublicForm()
    // Lead goes to admin pool, no verification needed
    // ────────────────────────────────────────────────────────────────
    public function createFromPublicForm(array $data): Lead
    {
        return DB::transaction(function () use ($data) {
            $referralCode = isset($data['referral_agent_id']) ? strtoupper(trim($data['referral_agent_id'])) : null;
            $referringUser = null;

            if ($referralCode) {
                // COMMISSION REDESIGN v1.0:
                // Resolve referral by BOTH agent_id (for Agents) AND super_agent_code (for Super Agents)
                // Previously only agent_id was checked — Super Agent referrals were silently ignored
                $referringUser = User::query()
                    ->where(fn($q) => $q
                        ->where('agent_id', $referralCode)
                        ->orWhere('super_agent_code', $referralCode)
                    )
                    ->where('status', 'active')
                    ->whereIn('role', ['agent', 'super_agent'])
                    ->first();
                /** @var User|null $referringUser */
            }

            $leadData = collect($data)->except(['aadhaar_front', 'aadhaar_back', 'electricity_bill', 'photo', 'other', 'solar_roof_photo', 'bank_passbook', 'consumer_signature', 'referral_agent_id'])->toArray();

            $createData = [
                ...$leadData,
                'source'           => 'public_form',
                'referral_agent_id'=> $referralCode,
                'status'           => 'NEW',
            ];

            if ($referringUser) {
                // Use HierarchyService to correctly determine pool, verification_status,
                // and SA assignment — exactly the same logic as agent/enumerator submissions
                $routing = $this->hierarchyService->resolveInitialRouting($referringUser);

                // Track who the referral came from (for commission chain resolution)
                if ($referringUser->isAgent()) {
                    $routing['submitted_by_agent_id'] = $referringUser->id;
                } elseif ($referringUser->isSuperAgent()) {
                    $routing['created_by_super_agent_id'] = $referringUser->id;
                }

                $createData = array_merge($createData, $routing);
            } else {
                // No valid referral — straight to Admin Pool, no commission chain
                $createData['owner_type']          = 'admin_pool';
                $createData['verification_status'] = 'not_required';
            }

            /** @var Lead $lead */
            $lead = Lead::forceCreate($createData);

            // Store consumer signature if uploaded
            if (!empty($data['consumer_signature']) && $data['consumer_signature'] instanceof UploadedFile) {
                $sigPath = $data['consumer_signature']->store("leads/{$lead->ulid}", 'local');
                $lead->consumer_signature_path = $sigPath;
                $lead->save();
                $this->uploadDocument($lead, $data['consumer_signature'], 'consumer_signature', null);
            }

            // Auto-create consumer portal account
            try { $this->consumerService->createForLead($lead); } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Consumer portal creation failed for lead {$lead->ulid}: " . $e->getMessage());
            }

            $this->logStatusChange($lead, null, null, 'NEW', 'Lead received from public form'.($referralCode ? " (Ref: {$referralCode})" : ''));

            if ($referringUser) {
                /** @var User $referringUser */
                if ($referringUser->isAgent()) {
                    $this->notifyAgentNewReferralLead($lead, $referringUser);
                    // Notify the Agent's Super Agent too (if they have one)
                    $saId = $this->hierarchyService->findAscendantSuperAgentId($referringUser);
                    if ($saId) {
                        $sa = User::find($saId);
                        if ($sa) {
                            $this->notifySuperAgentNewReferralLead($lead, $sa, $referringUser);
                        }
                    }
                } elseif ($referringUser->isSuperAgent()) {
                    // Notify the Super Agent directly
                    $this->notifySuperAgentLeadPendingVerification($lead, $referringUser);
                }
            } else {
                $this->notifyAdminNewPublicLead($lead);
            }

            return $lead;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────

    public function createFromAgent(array $data, User $agent): Lead
    {
        return DB::transaction(function () use ($data, $agent) {
            $routing = $this->hierarchyService->resolveInitialRouting($agent);
            $leadData = collect($data)->except(['aadhaar_front', 'aadhaar_back', 'electricity_bill', 'photo', 'other', 'solar_roof_photo', 'bank_passbook', 'consumer_signature'])->toArray();

            /** @var Lead $lead */
            $lead = Lead::forceCreate([
                ...$leadData,
                'source' => 'agent_submission',
                'submitted_by_agent_id' => $agent->id,
                ...$routing,
                'status' => 'NEW',
            ]);

            // Store consumer signature if uploaded
            if (!empty($data['consumer_signature']) && $data['consumer_signature'] instanceof UploadedFile) {
                $sigPath = $data['consumer_signature']->store("leads/{$lead->ulid}", 'local');
                $lead->consumer_signature_path = $sigPath;
                $lead->save();
                $this->uploadDocument($lead, $data['consumer_signature'], 'consumer_signature', $agent->id);
            }

            // Auto-create consumer portal account
            try { $this->consumerService->createForLead($lead); } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Consumer portal creation failed for lead {$lead->ulid}: " . $e->getMessage());
            }

            $this->logStatusChange($lead, $agent->id, null, 'NEW', 'Lead submitted by agent');

            if ($lead->assigned_super_agent_id) {
                $this->notifySuperAgentLeadPendingVerification($lead, $agent);
            } else {
                $this->notifyAdminNewAgentLead($lead, $agent);
            }

            return $lead;
        });
    }

    /**
     * METHOD 2B: createFromEnumerator()
     * Uses HierarchyService to resolve routing for any Enumerator creation scenario (Case 1-3)
     */
    public function createFromEnumerator(array $data, User $enumerator): Lead
    {
        return DB::transaction(function () use ($data, $enumerator) {
            $routing = $this->hierarchyService->resolveInitialRouting($enumerator);
            $leadData = collect($data)->except(['aadhaar_front', 'aadhaar_back', 'electricity_bill', 'photo', 'other', 'solar_roof_photo', 'bank_passbook', 'consumer_signature'])->toArray();

            $lead = Lead::forceCreate([
                ...$leadData,
                'source' => 'enumerator_submission',
                'submitted_by_enumerator_id' => $enumerator->id,
                ...$routing,
                'status' => 'NEW',
            ]);

            // Store consumer signature if uploaded
            if (!empty($data['consumer_signature']) && $data['consumer_signature'] instanceof UploadedFile) {
                $sigPath = $data['consumer_signature']->store("leads/{$lead->ulid}", 'local');
                $lead->consumer_signature_path = $sigPath;
                $lead->save();
                $this->uploadDocument($lead, $data['consumer_signature'], 'consumer_signature', $enumerator->id);
            }

            // Auto-create consumer portal account
            try { $this->consumerService->createForLead($lead); } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Consumer portal creation failed for lead {$lead->ulid}: " . $e->getMessage());
            }

            $this->logStatusChange($lead, $enumerator->id, null, 'NEW', "Lead submitted by enumerator {$enumerator->name}");
            
            // Notification logic
            if ($lead->verification_status === 'pending_agent_verification') {
                 $agent = User::find($lead->assigned_agent_id);
                 if ($agent) {
                    $this->notificationService->send($agent->id, 'new_enumerator_lead', 'New Enumerator Lead', "Enumerator {$enumerator->name} submitted a new lead: {$lead->ulid}", ['lead_ulid' => $lead->ulid]);
                 }
            } elseif ($lead->verification_status === 'pending_super_agent_verification') {
                 $sa = User::find($lead->assigned_super_agent_id);
                 if ($sa) {
                    $this->notificationService->send($sa->id, 'new_enumerator_lead', 'New Enumerator Lead (Pending Verification)', "Enumerator {$enumerator->name} submitted a lead: {$lead->ulid}", ['lead_ulid' => $lead->ulid]);
                 }
            } else {
                // Admin pool
                $this->notifyAdminNewPublicLead($lead); // reusable for admin pool
            }

            return $lead;
        });
    }
    public function createFromSuperAgent(array $data, User $sa): Lead
    {
        return DB::transaction(function () use ($data, $sa) {
            $routing = $this->hierarchyService->resolveInitialRouting($sa);
            $leadData = collect($data)->except(['aadhaar_front', 'aadhaar_back', 'electricity_bill', 'photo', 'other', 'solar_roof_photo', 'bank_passbook', 'consumer_signature'])->toArray();

            $lead = Lead::forceCreate([
                ...$leadData,
                'source' => 'super_agent_submission',
                'created_by_super_agent_id' => $sa->id,
                ...$routing,
                'status' => 'NEW',
            ]);

            // Store consumer signature if uploaded
            if (!empty($data['consumer_signature']) && $data['consumer_signature'] instanceof UploadedFile) {
                $sigPath = $data['consumer_signature']->store("leads/{$lead->ulid}", 'local');
                $lead->consumer_signature_path = $sigPath;
                $lead->save();
                $this->uploadDocument($lead, $data['consumer_signature'], 'consumer_signature', $sa->id);
            }

            // Auto-create consumer portal account
            try { $this->consumerService->createForLead($lead); } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Consumer portal creation failed for lead {$lead->ulid}: " . $e->getMessage());
            }

            $this->logStatusChange($lead, $sa->id, null, 'NEW', "Lead created by Super Agent {$sa->name}");
            
            if ($lead->assigned_super_agent_id && (int)$lead->assigned_super_agent_id !== (int)$sa->id) {
                // If SA routed to ANOTHER SA (unlikely but possible in deeper hierarchy)
                $this->notifySuperAgentLeadAssigned($lead, $lead->assignedSuperAgent, $sa);
            } else {
                $this->notifyAdminNewAgentLead($lead, $sa);
            }

            return $lead;
        });
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 4a: verifyLeadByAgent()
    // Agent approves the enumerator lead → sends to Super Agent pool
    // ────────────────────────────────────────────────────────────────
    public function verifyLeadByAgent(Lead $lead, User $agent, ?string $notes = null): Lead
    {
        if ((int) $lead->assigned_agent_id !== (int) $agent->id) {
            throw new LeadAccessDeniedException('You are not authorized to verify this lead.');
        }

        if ($lead->verification_status !== 'pending_agent_verification') {
            throw new InvalidLeadOperationException('This lead is not pending agent verification.');
        }

        return DB::transaction(function () use ($lead, $agent, $notes) {
            // MED-09 FIX: Use the lead's assigned SA, not the agent's personal super_agent_id.
            // These can differ when an admin assigns a lead to an agent under a different SA.
            $hasSuperAgent = ! is_null($lead->assigned_super_agent_id ?? $agent->super_agent_id);

            $lead->forceFill([
                'verification_status' => $hasSuperAgent ? 'pending_super_agent_verification' : 'not_required',
                'owner_type' => $hasSuperAgent ? 'super_agent_pool' : 'admin_pool',
            ])->save();

            LeadVerification::create([
                'lead_id' => $lead->id,
                'action' => 'verified',
                'performed_by' => $agent->id,
                'performer_role' => 'agent',
                'reason' => $notes,
                'revert_count_at_time' => $lead->revert_count,
            ]);

            $this->logStatusChange($lead, $agent->id, $lead->status, $lead->status,
                'Lead verified by Agent — sent forward for processing');

            if ($hasSuperAgent) {
                $this->notifySuperAgentLeadPendingVerification($lead, $agent);
            } else {
                $this->notifyAdminNewAgentLead($lead, $agent);
            }

            if ($lead->submitted_by_enumerator_id) {
                $this->notifyEnumeratorLeadVerified($lead, $agent);
            }

            return $lead->fresh();
        });
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 4b: revertLeadByAgent()
    // Agent sends lead back to enumerator
    // ────────────────────────────────────────────────────────────────
    public function revertLeadByAgent(Lead $lead, User $agent, string $reason): Lead
    {
        if (empty(trim($reason))) {
            throw new \InvalidArgumentException('A revert reason is required.');
        }

        if ($lead->verification_status !== 'pending_agent_verification') {
            throw new InvalidLeadOperationException('This lead cannot be reverted in its current state.');
        }

        if ((int) $lead->assigned_agent_id !== (int) $agent->id) {
            throw new LeadAccessDeniedException('You are not authorized to revert this lead.');
        }

        return DB::transaction(function () use ($lead, $agent, $reason) {
            // HIGH-08: Guard against reverting leads that already have paid commissions.
            // Also revoke any unpaid commission entries and revert offer points.
            $hasPaidCommissions = \App\Models\Commission::where('lead_id', $lead->id)
                ->where('payment_status', 'paid')
                ->exists();

            if ($hasPaidCommissions) {
                abort(422, 'Cannot revert lead — financial commissions have already been disbursed/paid.');
            }

            $this->commissionService->revokeUnpaidCommissions($lead, $agent);
            $this->offerService->revertPoints($lead);

            $newRevertCount = $lead->revert_count + 1;

            if ($newRevertCount >= 3) {
                 $lead->forceFill([
                     'verification_status' => 'admin_override',
                     'revert_count' => $newRevertCount,
                     'revert_reason' => $reason.' [AUTO-ESCALATED: max reverts reached]',
                     'reverted_at' => now(),
                     'reverted_by' => $agent->id,
                     'owner_type' => 'admin_pool',
                 ])->save();
            } else {
                 $lead->forceFill([
                     'verification_status' => 'reverted_to_enumerator',
                     'revert_count' => $newRevertCount,
                     'revert_reason' => $reason,
                     'reverted_at' => now(),
                     'reverted_by' => $agent->id,
                 ])->save();
            }

            LeadVerification::create([
                'lead_id' => $lead->id,
                'action' => 'reverted',
                'performed_by' => $agent->id,
                'performer_role' => 'agent',
                'reason' => $reason,
                'revert_count_at_time' => $newRevertCount,
            ]);

            if ($lead->submitted_by_enumerator_id) {
                $this->notifyEnumeratorLeadReverted($lead, $agent, $reason);
            }

            return $lead->fresh();
        });
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 4: verifyLead()
    // SA approves the lead → sends to admin pool
    // ────────────────────────────────────────────────────────────────
    public function verifyLead(Lead $lead, User $superAgent, ?string $notes = null): Lead
    {
        if ((int) $lead->assigned_super_agent_id !== (int) $superAgent->id &&
            ! $this->leadBelongsToSuperAgentTeam($lead, $superAgent)) {
            throw new LeadAccessDeniedException('You are not authorized to verify this lead.');
        }

        if (! in_array($lead->verification_status, ['pending_super_agent_verification'])) {
            throw new InvalidLeadOperationException('This lead is not pending verification.');
        }

        return DB::transaction(function () use ($lead, $superAgent, $notes) {
            $lead->forceFill([
                'verification_status' => 'super_agent_verified',
                'verified_by_super_agent_id' => $superAgent->id,
                'verified_at' => now(),
                'owner_type' => 'admin_pool',
            ])->save();

            LeadVerification::create([
                'lead_id' => $lead->id,
                'action' => 'verified',
                'performed_by' => $superAgent->id,
                'performer_role' => 'super_agent',
                'reason' => $notes,
                'revert_count_at_time' => $lead->revert_count,
            ]);

            $this->logStatusChange($lead, $superAgent->id, $lead->status, $lead->status,
                'Lead verified by Super Agent — sent to Admin for processing');
            $this->notifyAdminLeadVerified($lead, $superAgent);

            if ($lead->submitted_by_agent_id || $lead->assigned_agent_id) {
                $this->notifyAgentLeadVerified($lead, $superAgent);
            }

            return $lead->fresh();
        });
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 5: revertLead()
    // SA sends lead back to agent with a reason
    // Auto-escalates to admin after 3 reverts
    // ────────────────────────────────────────────────────────────────
    public function revertLead(Lead $lead, User $superAgent, string $reason): Lead
    {
        if (empty(trim($reason))) {
            throw new \InvalidArgumentException('A revert reason is required.');
        }

        if (! in_array($lead->verification_status, ['pending_super_agent_verification'])) {
            throw new InvalidLeadOperationException('This lead cannot be reverted in its current state.');
        }

        if (! $this->leadBelongsToSuperAgentTeam($lead, $superAgent) &&
            (int) $lead->assigned_super_agent_id !== (int) $superAgent->id) {
            throw new LeadAccessDeniedException('You are not authorized to revert this lead.');
        }

        return DB::transaction(function () use ($lead, $superAgent, $reason) {
            $newRevertCount = $lead->revert_count + 1;

            if ($newRevertCount >= 3) {
                // Auto-escalate to admin
                $lead->forceFill([
                    'verification_status' => 'admin_override',
                    'revert_count' => $newRevertCount,
                    'revert_reason' => $reason.' [AUTO-ESCALATED: max reverts reached]',
                    'reverted_at' => now(),
                    'reverted_by' => $superAgent->id,
                    'owner_type' => 'admin_pool',
                ])->save();

                LeadVerification::create([
                    'lead_id' => $lead->id,
                    'action' => 'reverted',
                    'performed_by' => $superAgent->id,
                    'performer_role' => 'super_agent',
                    'reason' => $reason.' [AUTO-ESCALATED]',
                    'revert_count_at_time' => $newRevertCount,
                ]);

                $this->notifyAdminLeadAutoEscalated($lead, $superAgent, $reason);
                $this->notifyAgentLeadAutoEscalated($lead, $reason);
            } else {
                // Normal revert
                $lead->forceFill([
                    'verification_status' => 'reverted_to_agent',
                    'revert_count' => $newRevertCount,
                    'revert_reason' => $reason,
                    'reverted_at' => now(),
                    'reverted_by' => $superAgent->id,
                ])->save();

                LeadVerification::create([
                    'lead_id' => $lead->id,
                    'action' => 'reverted',
                    'performed_by' => $superAgent->id,
                    'performer_role' => 'super_agent',
                    'reason' => $reason,
                    'revert_count_at_time' => $newRevertCount,
                ]);

                $this->notifyAgentLeadReverted($lead, $reason, $newRevertCount);
            }

            return $lead->fresh();
        });
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 6: resubmitLead()
    // Agent corrects and resubmits a reverted lead
    // ────────────────────────────────────────────────────────────────
    public function resubmitLead(Lead $lead, array $correctedData, User $agent): Lead
    {
        if ($lead->verification_status !== 'reverted_to_agent') {
            throw new InvalidLeadOperationException('Only reverted leads can be resubmitted.');
        }

        if ((int) $lead->submitted_by_agent_id !== (int) $agent->id) {
            throw new LeadAccessDeniedException('You can only resubmit your own leads.');
        }

        return DB::transaction(function () use ($lead, $correctedData, $agent) {
            // CRIT-06 FIX: Whitelist correctedData to prevent agents from overwriting
            // sensitive fields (owner_type, assigned_super_agent_id, commission_entry_status, etc.)
            $allowed = [
                'beneficiary_name', 'beneficiary_mobile', 'beneficiary_email',
                'beneficiary_address', 'beneficiary_pincode', 'beneficiary_state',
                'beneficiary_district', 'consumer_number', 'discom_name',
                'roof_size', 'system_capacity', 'monthly_bill_amount',
                'admin_notes', 'query_message',
            ];

            // MED-12 FIX: Route back to the correct verification stage.
            // An enumerator lead under an Agent should return to agent verification,
            // not skip straight to super agent verification.
            $targetStatus = $lead->assigned_agent_id && ! $lead->submitted_by_agent_id
                ? 'pending_agent_verification'
                : 'pending_super_agent_verification';

            $lead->update([
                ...collect($correctedData)->only($allowed)->toArray(),
                'verification_status' => $targetStatus,
                'revert_reason' => null,
            ]);

            $this->logStatusChange($lead, $agent->id, $lead->status, $lead->status,
                'Lead corrected and resubmitted by agent (revert #'.$lead->revert_count.')');

            if ($lead->assigned_super_agent_id) {
                $this->notifySuperAgentLeadResubmitted($lead, $agent);
            }

            return $lead->fresh();
        });
    }

    /**
     * Enumerator corrects and resubmits a reverted lead.
     */
    public function resubmitLeadByEnumerator(Lead $lead, array $correctedData, User $enumerator): Lead
    {
        if ($lead->verification_status !== 'reverted_to_enumerator') {
            throw new \App\Exceptions\InvalidLeadOperationException('Only leads reverted to you can be resubmitted.');
        }

        if ((int) $lead->submitted_by_enumerator_id !== (int) $enumerator->id) {
            throw new \App\Exceptions\LeadAccessDeniedException('You can only resubmit your own leads.');
        }

        return DB::transaction(function () use ($lead, $correctedData, $enumerator) {
            $allowed = [
                'beneficiary_name', 'beneficiary_mobile', 'beneficiary_email',
                'beneficiary_address', 'beneficiary_pincode', 'beneficiary_state',
                'beneficiary_district', 'consumer_number', 'discom_name',
                'roof_size', 'system_capacity', 'monthly_bill_amount',
                'query_message',
            ];

            $lead->update([
                ...collect($correctedData)->only($allowed)->toArray(),
                'verification_status' => 'pending_agent_verification',
                'revert_reason' => null,
            ]);

            $this->logStatusChange($lead, $enumerator->id, $lead->status, $lead->status,
                'Lead corrected and resubmitted by enumerator (revert #'.$lead->revert_count.')');

            if ($lead->assigned_agent_id) {
                $this->notifyAgentLeadResubmitted($lead, $enumerator);
            }

            return $lead->fresh();
        });
    }

    private function notifyAgentLeadResubmitted(Lead $lead, User $enumerator): void
    {
        if (! $lead->assigned_agent_id) {
            return;
        }
        $agent = User::find($lead->assigned_agent_id);
        if ($agent) {
            $this->notificationService->send(
                $agent->id, 'lead_resubmitted',
                'Lead Resubmitted by Enumerator',
                "Enumerator {$enumerator->name} resubmitted lead {$lead->ulid} for verification",
                ['lead_ulid' => $lead->ulid, 'enumerator_id' => $enumerator->id, 'revert_count' => $lead->revert_count]
            );
        }
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 7: assignLeadToSuperAgent()
    // Admin assigns an unassigned (admin pool) lead to a super agent
    // ────────────────────────────────────────────────────────────────
    public function assignLeadToSuperAgent(Lead $lead, User $superAgent, User $admin): Lead
    {
        return DB::transaction(function () use ($lead, $superAgent, $admin) {
            $lead->update([
                'assigned_super_agent_id' => $superAgent->id,
                'owner_type' => 'super_agent_pool',
                'verification_status' => 'not_required',
            ]);

            $this->logStatusChange($lead, $admin->id, $lead->status, $lead->status,
                'Lead assigned to Super Agent '.($superAgent->super_agent_code ?? $superAgent->name).' by Admin');

            $this->notifySuperAgentLeadAssigned($lead, $superAgent, $admin);

            return $lead->fresh();
        });
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 8: assignLeadToAgent()
    // Admin or SA assigns lead to a specific agent
    // ────────────────────────────────────────────────────────────────
    public function assignLeadToAgent(Lead $lead, User $agent, User $assigner): Lead
    {
        if ($assigner->isSuperAgent()) {
            if ((int) $agent->super_agent_id !== (int) $assigner->id) {
                throw new LeadAccessDeniedException('You can only assign leads to agents in your team.');
            }
            if ((int) $lead->assigned_super_agent_id !== (int) $assigner->id) {
                throw new LeadAccessDeniedException('You can only assign leads that belong to your pool.');
            }
        }

        return DB::transaction(function () use ($lead, $agent, $assigner) {
            $lead->update([
                'assigned_agent_id' => $agent->id,
                'assigned_super_agent_id' => $agent->super_agent_id ?? $lead->assigned_super_agent_id,
                'owner_type' => 'agent_pool',
            ]);

            $this->logStatusChange($lead, $assigner->id, $lead->status, $lead->status,
                'Lead assigned to Agent '.($agent->agent_id ?? $agent->name));

            $this->notifyAgentLeadAssigned($lead, $agent, $assigner);

            return $lead->fresh();
        });
    }

    // ────────────────────────────────────────────────────────────────
    // METHOD 9: updateStatus()
    // Core propagation: notifies SA + Agent automatically
    // ────────────────────────────────────────────────────────────────
    public function updateStatus(Lead $lead, string $newStatus, int $changedById, ?string $notes = null, ?UploadedFile $receipt = null, ?UploadedFile $geotag = null): void
    {
        $changer = User::findOrFail($changedById);

        // ── Phase 2: Forward-only pipeline enforcement ────────────────────────────
        // Admin/Super Admin bypass actor check (they can always move any status)
        // but are still subject to forward-only except when going to terminal states.
        if ($changer) {
            $this->pipelineService->assertForwardTransition($newStatus, $lead);
        }

        // Enforce the centralized pipeline architectural limits implicitly
        $allowedStatuses = LeadStatus::values();
        if (! in_array($newStatus, $allowedStatuses, true)) {
            throw new InvalidLeadOperationException("Invalid status target: {$newStatus}");
        }

        // B4: Enforce Physical Geotag Requirements for specific pipeline actions natively
        if (\App\Services\StatusTransitionService::requiresGeotag($newStatus)) {
            if (!$geotag) {
                // Return an explicit unprocessable entity error structure that triggers 422 HTTP responses on controllers
                abort(422, "A physical Geotag photo artifact is absolutely required to transition to {$newStatus}.");
            }
        }

        if ($lead->status === $newStatus) {
            return;
        }

        DB::transaction(function () use ($lead, $newStatus, $changedById, $notes, $receipt, $geotag) {
            $oldStatus = $lead->status;
            $changer = User::findOrFail($changedById);

            // CRIT-07 FIX: Enforce role-based status transition restrictions.
            // StatusTransitionService::canTransition() was built but never wired into this path.
            if (! $changer->isAdmin() && ! $changer->isSuperAdmin()) {
                $transitionService = app(\App\Services\StatusTransitionService::class);
                if (! $transitionService->canTransition($changer, $lead, $newStatus)) {
                    abort(403, "Your role ({$changer->role}) is not permitted to set status: {$newStatus}");
                }
            }

            // Forward-only pipeline enforcement (admin is exempt from forward-only by design)
            if (! $changer->isAdmin() && ! $changer->isSuperAdmin()) {
                $this->pipelineService->assertForwardTransition($newStatus, $lead);
            }

            // REVOKE UNPAID COMMISSIONS if moving backward from a commissionable state
            $oldPos = $this->pipelineService->positionOf($oldStatus);
            $newPos = $this->pipelineService->positionOf($newStatus);
            $minCommPos = $this->pipelineService->positionOf('DISBURSEMENT_VERIFIED');

            if ($oldPos !== null && $oldPos >= $minCommPos) {
                // If moving to a pre-disbursement status or a terminal status (null pos)
                if ($newPos === null || $newPos < $minCommPos) {
                    
                    // BATCH 2.1: Downward Transition Protection
                    // Block the transition if any commission has already been physically paid.
                    $hasPaidCommissions = \App\Models\Commission::query()
                        ->where('lead_id', $lead->id)
                        ->where('payment_status', 'paid')
                        ->exists();
                        
                    if ($hasPaidCommissions) {
                        abort(422, "Cannot move lead backward to {$newStatus} because financial commissions have already been disbursed/paid. Revocation is blocked.");
                    }

                    $this->commissionService->revokeUnpaidCommissions($lead, $changer);
                    
                    // REVERT POINTS: Revert offer points (Removes logs and deductions from totals)
                    $this->offerService->revertPoints($lead);
                }
            }

            $this->logStatusChange($lead, $changedById, $oldStatus, $newStatus, $notes, $geotag, $changer?->role);

            $lead->status = $newStatus;
            
            if ($newStatus === 'FILE_REJECTED') {
                $lead->rejection_reason = $notes;
            } elseif ($newStatus === 'FILE_DISBURSED') {
                // Store the reference number in admin_notes or a similar field
                $lead->admin_notes = $notes;
            } elseif ($newStatus === 'SURVEY_DONE' && empty($lead->surveyor_form_submitted_at)) {
                $lead->surveyor_form_submitted_at = now();
            }

            $lead->save();

            // UPLOAD RECEIPT if provided
            if ($newStatus === 'LEAD_COMPLETED' && $receipt) {
                $this->uploadDocument($lead, $receipt, 'receipt', $changedById);
            }

            // UPLOAD GEOTAG if provided
            if ($geotag) {
                $this->uploadDocument($lead, $geotag, 'geotag', $changedById, true, $changer->role);
            }

            // AUTO-PROPAGATION: Admin/SA changes → notify downstream parties
            if ($changer) {
                if ($changer->isAdmin()) {
                    if ($lead->assigned_super_agent_id) {
                        $this->notifySuperAgentStatusChanged($lead, $oldStatus, $newStatus, $changer);
                    }
                    if ($lead->assigned_agent_id) {
                        $this->notifyAgentStatusChanged($lead, $oldStatus, $newStatus, $changer);
                    }
                }
                if ($changer->isSuperAgent() && $lead->assigned_agent_id) {
                    $this->notifyAgentStatusChanged($lead, $oldStatus, $newStatus, $changer);
                }
            }

            if ($lead->submitted_by_enumerator_id) {
                $this->notifyEnumeratorStatusChanged($lead, $oldStatus, $newStatus, $changer);
            }

            // TRIGGER OFFERS: reflect points ONLY when status becomes 'DISBURSEMENT_VERIFIED'
            if ($newStatus === 'DISBURSEMENT_VERIFIED') {
                // Priority 1: If submitted by an enumerator, points go to their creator/parent via ABSORPTION logic
                if ($lead->submitted_by_enumerator_id) {
                    $enumerator = User::find($lead->submitted_by_enumerator_id);
                    if ($enumerator) {
                        $this->offerService->processPoints($lead, $enumerator);
                    }
                } else {
                    // Priority 2: Standard fallback chain for Agents/Super Agents
                    $affectedAgent = null;
                    if ($lead->assigned_agent_id) {
                        $affectedAgent = User::find($lead->assigned_agent_id);
                    } elseif ($lead->submitted_by_agent_id) {
                        $affectedAgent = User::find($lead->submitted_by_agent_id);
                    } elseif ($lead->assigned_super_agent_id) {
                        $affectedAgent = User::find($lead->assigned_super_agent_id);
                    } elseif ($lead->created_by_super_agent_id) {
                        $affectedAgent = User::find($lead->created_by_super_agent_id);
                    }

                    if ($affectedAgent) {
                        $this->offerService->processPoints($lead, $affectedAgent);
                    }
                }
            }

            // PHASE 3: AUTO-COMMISSION TRIGGERS (QUEUED)
            if ($changer) {
                if ($newStatus === 'DISBURSEMENT_VERIFIED') {
                    \App\Jobs\TriggerHierarchyCommissionsJob::dispatch($lead, $changer)->onQueue('commissions');
                }

                if ($newStatus === 'POD_SUCCESSFUL') {
                    \App\Jobs\TriggerInstallerCommissionJob::dispatch($lead, $changer)->onQueue('commissions');
                }
            }

            // PHASE 8: PIPELINE COMPLETION NOTIFICATIONS
            if ($newStatus === 'SUBSIDY_APPLIED') {
                $this->notificationService->notifySubsidyApplied($lead);
            }

            if ($newStatus === 'SUBSIDY_DISBURSED') {
                $this->notificationService->notifySubsidyDisbursed($lead);
            }

            if ($newStatus === 'LEAD_COMPLETED') {
                $this->notificationService->notifyLeadCompleted($lead);
            }
        });
    }

    // ────────────────────────────────────────────────────────────────
    // Document upload (unchanged from original)
    // ────────────────────────────────────────────────────────────────
    /**
     * Upload a document for a lead.
     *
     * F5 — Added $visibleToDownline and $uploadedByRole parameters.
     * Default to false / null to remain backward-compatible with all existing callers.
     */
    public function uploadDocument(
        Lead         $lead,
        UploadedFile $file,
        string       $type,
        ?int         $uploadedById = null,
        bool         $visibleToDownline = false,
        ?string      $uploadedByRole = null
    ): LeadDocument {
        $path = $file->store("leads/{$lead->ulid}", 'local');

        return LeadDocument::create([
            'lead_id'             => $lead->id,
            'document_type'       => $type,
            'file_path'           => $path,
            'original_filename'   => $file->getClientOriginalName(),
            'uploaded_by'         => $uploadedById,
            'visible_to_downline' => $visibleToDownline,
            'uploaded_by_role'    => $uploadedByRole,
        ]);
    }

    // ────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ────────────────────────────────────────────────────────────────

    private function logStatusChange(Lead $lead, ?int $changedById, ?string $fromStatus, string $toStatus, ?string $notes, ?UploadedFile $geotag = null, ?string $role = null): void
    {
        $logData = [
            'lead_id' => $lead->id,
            'changed_by' => $changedById,
            'from_status' => $fromStatus ?? $lead->status ?? 'NEW',
            'to_status' => $toStatus,
            'notes' => $notes,
            'changed_by_role' => $role,
        ];

        if ($geotag) {
            // 1. Upload the file
            $path = $geotag->store("leads/geotags", 'public');
            $logData['geotag_photo_path'] = $path;

            // 2. Extract EXIF GPS data if available
            try {
                $exif = @exif_read_data($geotag->getRealPath());
                if (isset($exif['GPSLatitude'], $exif['GPSLatitudeRef'], $exif['GPSLongitude'], $exif['GPSLongitudeRef'])) {
                    $logData['latitude']  = $this->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                    $logData['longitude'] = $this->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
                }
            } catch (\Exception $e) {
                // Silently fail if EXIF reading breaks; audit log remains without coords
            }
        }

        LeadStatusLog::create($logData);
    }

    /**
     * Helper to convert GPS DMS (Degrees, Minutes, Seconds) to decimal.
     */
    private function getGps($exifCoord, $hemi)
    {
        $degrees = count($exifCoord) > 0 ? $this->gps2Num($exifCoord[0]) : 0;
        $minutes = count($exifCoord) > 1 ? $this->gps2Num($exifCoord[1]) : 0;
        $seconds = count($exifCoord) > 2 ? $this->gps2Num($exifCoord[2]) : 0;

        $flip = ($hemi == 'S' || $hemi == 'W') ? -1 : 1;

        return $flip * ($degrees + ($minutes / 60) + ($seconds / 3600));
    }

    private function gps2Num($coordPart)
    {
        $parts = explode('/', $coordPart);
        if (count($parts) <= 0) return 0;
        if (count($parts) == 1) return (float) $parts[0];
        // MED-10 FIX: Guard against division by zero from malformed EXIF data.
        if (floatval($parts[1]) == 0) return 0;
        return floatval($parts[0]) / floatval($parts[1]);
    }

    private function leadBelongsToSuperAgentTeam(Lead $lead, User $superAgent): bool
    {
        if ($lead->submitted_by_agent_id) {
            /** @var User|null $submittingAgent */
            $submittingAgent = User::query()->find($lead->submitted_by_agent_id);

            return $submittingAgent && (int) $submittingAgent->super_agent_id === (int) $superAgent->id;
        }

        return false;
    }

    // ── Notification helpers ─────────────────────────────────────────

    private function notifyAdminNewPublicLead(Lead $lead): void
    {
        // HIGH-06 FIX: Broadcast to ALL admins, not just the first() one.
        $this->notificationService->notifyAdmins(
            'new_public_lead',
            'New Public Lead Received',
            "New public lead from {$lead->beneficiary_name}, {$lead->beneficiary_district}",
            ['lead_ulid' => $lead->ulid]
        );
    }

    private function notifyAdminNewAgentLead(Lead $lead, User $agent): void
    {
        // HIGH-06 FIX: Broadcast to ALL admins.
        $this->notificationService->notifyAdmins(
            'new_agent_lead',
            'New Agent Lead Submitted',
            "Agent {$agent->agent_id} submitted a new lead: {$lead->ulid}",
            ['lead_ulid' => $lead->ulid, 'agent_id' => $agent->id]
        );
    }

    private function notifyAdminLeadVerified(Lead $lead, User $sa): void
    {
        // HIGH-06 FIX: Broadcast to ALL admins.
        $this->notificationService->notifyAdmins(
            'lead_verified',
            'Lead Verified — Ready for Processing',
            "Lead {$lead->ulid} verified by SA {$sa->super_agent_code} — ready for processing",
            ['lead_ulid' => $lead->ulid, 'sa_id' => $sa->id]
        );
    }

    private function notifyAdminLeadAutoEscalated(Lead $lead, User $sa, string $reason): void
    {
        // HIGH-06 FIX: Broadcast to ALL admins.
        $this->notificationService->notifyAdmins(
            'lead_auto_escalated',
            'Lead Auto-Escalated (Max Reverts)',
            "Lead {$lead->ulid} auto-escalated after 3 reverts. Reason: {$reason}",
            ['lead_ulid' => $lead->ulid, 'sa_id' => $sa->id]
        );
    }

    private function notifySuperAgentLeadPendingVerification(Lead $lead, User $agent): void
    {
        if (! $lead->assigned_super_agent_id) {
            return;
        }
        $sa = User::find($lead->assigned_super_agent_id);
        if ($sa) {
            $this->notificationService->send(
                $sa->id, 'lead_pending_verification',
                'Lead Awaiting Verification',
                "Agent {$agent->agent_id} submitted a lead for verification: {$lead->ulid}",
                ['lead_ulid' => $lead->ulid, 'agent_id' => $agent->id]
            );
        }
    }

    private function notifySuperAgentLeadAssigned(Lead $lead, User $sa, User $admin): void
    {
        $this->notificationService->send(
            $sa->id, 'lead_assigned_to_sa',
            'New Lead Assigned to You',
            "Admin assigned lead {$lead->ulid} to you ({$lead->beneficiary_name})",
            ['lead_ulid' => $lead->ulid]
        );
    }

    private function notifySuperAgentLeadResubmitted(Lead $lead, User $agent): void
    {
        if (! $lead->assigned_super_agent_id) {
            return;
        }
        $sa = User::find($lead->assigned_super_agent_id);
        if ($sa) {
            $this->notificationService->send(
                $sa->id, 'lead_resubmitted',
                'Lead Resubmitted for Verification',
                "Agent {$agent->agent_id} resubmitted lead {$lead->ulid} for verification",
                ['lead_ulid' => $lead->ulid, 'agent_id' => $agent->id, 'revert_count' => $lead->revert_count]
            );
        }
    }

    private function notifySuperAgentStatusChanged(Lead $lead, string $from, string $to, User $changer): void
    {
        if (! $lead->assigned_super_agent_id) {
            return;
        }
        $sa = User::find($lead->assigned_super_agent_id);
        if ($sa) {
            $this->notificationService->send(
                $sa->id, 'lead_status_changed',
                'Lead Status Updated',
                "Lead {$lead->ulid} status → {$to}",
                [
                    'lead_ulid' => $lead->ulid, 
                    'from' => $from, 
                    'to' => $to,
                    'title' => 'Lead Status Updated',
                    'message' => "Lead {$lead->ulid} status → {$to}"
                ]
            );
        }
    }

    private function notifyAgentLeadAssigned(Lead $lead, User $agent, User $assigner): void
    {
        $byLabel = $assigner->isAdmin() ? 'Admin' : 'your Super Agent';
        $this->notificationService->send(
            $agent->id, 'lead_assigned_to_agent',
            'New Lead Assigned to You',
            "{$byLabel} assigned lead {$lead->ulid} to you",
            [
                'lead_ulid' => $lead->ulid,
                'title' => 'New Lead Assigned to You',
                'message' => "{$byLabel} assigned lead {$lead->ulid} to you"
            ]
        );
    }

    private function notifyAgentLeadReverted(Lead $lead, string $reason, int $count): void
    {
        if (! $lead->assigned_agent_id && ! $lead->submitted_by_agent_id) {
            return;
        }
        $agentId = $lead->assigned_agent_id ?? $lead->submitted_by_agent_id;
        $this->notificationService->send(
            $agentId, 'lead_reverted',
            '↩ Lead Returned for Correction',
            "Lead {$lead->ulid} returned by your Super Agent. Reason: {$reason}",
            [
                'lead_ulid' => $lead->ulid, 
                'reason' => $reason, 
                'revert_count' => $count,
                'title' => '↩ Lead Returned for Correction',
                'message' => "Lead {$lead->ulid} returned by your Super Agent. Reason: {$reason}"
            ]
        );
    }

    private function notifyAgentLeadAutoEscalated(Lead $lead, string $reason): void
    {
        $agentId = $lead->assigned_agent_id ?? $lead->submitted_by_agent_id;
        if (! $agentId) {
            return;
        }
        $this->notificationService->send(
            $agentId, 'lead_auto_escalated',
            'Lead Escalated to Admin',
            "Lead {$lead->ulid} has been escalated to Admin after 3 reverts.",
            ['lead_ulid' => $lead->ulid, 'reason' => $reason]
        );
    }

    private function notifyAgentNewReferralLead(Lead $lead, User $agent): void
    {
        $this->notificationService->send(
            $agent->id, 'new_referral_lead',
            'New Referral Lead',
            "A new lead ({$lead->beneficiary_name}) was submitted using your referral ID.",
            ['lead_ulid' => $lead->ulid]
        );
    }

    private function notifySuperAgentNewReferralLead(Lead $lead, User $sa, User $agent): void
    {
        $this->notificationService->send(
            $sa->id, 'new_team_referral_lead',
            'New Referral Lead in Team',
            "A new lead ({$lead->beneficiary_name}) was submitted via Agent {$agent->agent_id}'s referral ID.",
            ['lead_ulid' => $lead->ulid, 'agent_id' => $agent->id]
        );
    }

    private function notifyAgentStatusChanged(Lead $lead, string $from, string $to, User $changer): void
    {
        $agentId = $lead->assigned_agent_id ?? $lead->submitted_by_agent_id;
        if (! $agentId) {
            return;
        }
        $byLabel = $changer->isAdmin() ? 'Admin' : 'your Super Agent';
        $this->notificationService->send(
            $agentId, 'lead_status_changed',
            'Lead Status Updated',
            "Lead {$lead->ulid} status → {$to} (updated by {$byLabel})",
            [
                'lead_ulid' => $lead->ulid, 
                'from' => $from, 
                'to' => $to,
                'title' => 'Lead Status Updated',
                'message' => "Lead {$lead->ulid} status → {$to} (updated by {$byLabel})"
            ]
        );
    }

    /**
     * B5 — Notify admin(s) when the Field Technical Team changes a lead status.
     *
     * Called by TechnicalDashboardController::submitVisit() after DB commit.
     * Resolves the correct admin from the lead's assigned_admin_id; if none is
     * set, falls back to notifying all admins who match the lead's chain.
     */
    public function notifyAdminTechnicalStatusChanged(
        Lead   $lead,
        User   $technician,
        string $fromStatus,
        string $toStatus
    ): void {
        // Determine the admin(s) to notify
        $adminIds = [];

        if ($lead->assigned_admin_id) {
            $adminIds[] = $lead->assigned_admin_id;
        } else {
            // Fallback: notify the admin whose team manages this lead via super agent
            if ($lead->assigned_super_agent_id) {
                $sa = User::find($lead->assigned_super_agent_id);
                // MED-11 FIX: parent_admin_id does not exist — use parent_id and verify it is an admin.
                if ($sa && $sa->parent_id) {
                    $parent = User::find($sa->parent_id);
                    if ($parent && in_array($parent->role, ['admin', 'super_admin'], true)) {
                        $adminIds[] = $parent->id;
                    }
                }
            }
        }

        // De-duplicate and skip if none found
        $adminIds = array_unique(array_filter($adminIds));
        if (empty($adminIds)) {
            return;
        }

        $label = $toStatus === 'SITE_SURVEY' ? 'Site Survey Done' : 'Installation Completed';

        foreach ($adminIds as $adminId) {
            $this->notificationService->send(
                $adminId,
                'technical_status_changed',
                "⚙ Field Tech: {$label}",
                "Technician {$technician->name} updated lead {$lead->ulid}: {$fromStatus} → {$toStatus}",
                [
                    'lead_ulid'    => $lead->ulid,
                    'from'         => $fromStatus,
                    'to'           => $toStatus,
                    'technician_id' => $technician->id,
                    'technician_name' => $technician->name,
                ]
            );
        }
    }

    private function notifyEnumeratorStatusChanged(Lead $lead, string $from, string $to, User $changer): void
    {
        if (!$lead->submitted_by_enumerator_id) {
            return;
        }
        $byLabel = $changer->isAdmin() ? 'Admin' : ($changer->isSuperAgent() ? 'Manager' : 'Staff');
        $this->notificationService->send(
            $lead->submitted_by_enumerator_id,
            'lead_status_changed',
            'Lead Status Update',
            "Your lead ({$lead->beneficiary_name}) status → {$to} (updated by {$byLabel})",
            ['lead_ulid' => $lead->ulid, 'from' => $from, 'to' => $to, 'title' => 'Lead Status Update', 'message' => "Your lead ({$lead->beneficiary_name}) status → {$to} (updated by {$byLabel})"]
        );
    }

    public function notifyEnumeratorLeadVerified(Lead $lead, User $agent): void
    {
        if (!$lead->submitted_by_enumerator_id) {
            return;
        }
        $this->notificationService->send(
            $lead->submitted_by_enumerator_id,
            'lead_verified',
            '✅ Lead Verified',
            "Your lead ({$lead->beneficiary_name}) has been verified by Agent {$agent->name}.",
            ['lead_ulid' => $lead->ulid, 'title' => '✅ Lead Verified', 'message' => "Your lead ({$lead->beneficiary_name}) has been verified by Agent {$agent->name}."]
        );
    }

    public function notifyEnumeratorLeadReverted(Lead $lead, User $agent, string $reason): void
    {
        if (!$lead->submitted_by_enumerator_id) {
            return;
        }
        $this->notificationService->send(
            $lead->submitted_by_enumerator_id,
            'lead_reverted',
            '↩ Lead Correction Needed',
            "Your lead ({$lead->beneficiary_name}) requires correction. Reason: {$reason}",
            ['lead_ulid' => $lead->ulid, 'reason' => $reason, 'title' => '↩ Lead Correction Needed', 'message' => "Your lead ({$lead->beneficiary_name}) requires correction. Reason: {$reason}"]
        );
    }

    public function notifyAgentLeadVerified(Lead $lead, User $sa): void
    {
        $agentId = $lead->submitted_by_agent_id ?? $lead->assigned_agent_id;
        if (!$agentId) {
            return;
        }
        $this->notificationService->send(
            $agentId,
            'lead_verified',
            '✅ Lead Verified by Manager',
            "Lead {$lead->ulid} ({$lead->beneficiary_name}) verified by {$sa->name}.",
            ['lead_ulid' => $lead->ulid, 'title' => '✅ Lead Verified by Manager', 'message' => "Lead {$lead->ulid} ({$lead->beneficiary_name}) verified by {$sa->name}."]
        );
    }
}
