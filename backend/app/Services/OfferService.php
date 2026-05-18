<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferExpiryLog;
use App\Models\OfferInstallationLog;
use App\Models\OfferProgress;
use App\Models\OfferRedemption;
use App\Models\SuperAgentAbsorbedPoints;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class OfferService
{
    public function __construct(
        private NotificationService $notificationService,
        private HierarchyService $hierarchyService
    ) {}

    /**
     * PROCESS POINTS (Formerly Installation)
     * Called by LeadService when a lead status changes to 'INSTALLED' or beyond.
     * Credit the points to all active, eligible offers.
     */
    public function processPoints(Lead $lead, User $agent): void
    {
        $activeOffers = Offer::live()->get();
        if ($activeOffers->isEmpty()) return;

        $points = $this->getPointsForCapacity($lead->system_capacity);

        // If this capacity earns 0 points (1kW or 2kW), skip offer processing entirely
        if ($points <= 0) return;

        /** @var \App\Models\Offer $offer */
        foreach ($activeOffers as $offer) {
            // Idempotency guard — never double-count the same lead for the same offer
            $alreadyLogged = OfferInstallationLog::where('offer_id', $offer->id)
                ->where('lead_id', $lead->id)
                ->exists();

            if ($alreadyLogged) {
                continue;
            }

            DB::transaction(function () use ($offer, $agent, $lead, $points) {
                // Determine absorption for enumerators
                $pointsToAbsorb = 0;
                $pointsForAgent = $points;
                $creator = null;

                if ($agent->role === 'enumerator') {
                    $progress = OfferProgress::where('user_id', $agent->id)
                        ->where('offer_id', $offer->id)
                        ->lockForUpdate()  // prevent race condition on concurrent completions
                        ->first();

                    $currentTotal = (float)($progress?->total_points ?? 0);
                    // Use the per-enumerator configurable threshold set by their creator
                    $threshold = (float)($agent->offer_point_threshold ?? 10);

                    if ($threshold > 0 && $currentTotal < $threshold) {
                        $pointsToAbsorb = min($points, $threshold - $currentTotal);
                        $pointsForAgent = $points - $pointsToAbsorb;
                        $creator = $agent->parent ?: $agent->createdBySuperAgent ?: $agent->parentAgent;
                    }
                }

                // Log the point allocation
                OfferInstallationLog::create([
                    'offer_id'                => $offer->id,
                    'lead_id'                 => $lead->id,
                    'user_id'                 => $agent->id,
                    'points_awarded'          => $points,
                    'points_awarded_to_agent' => $pointsForAgent,
                    'installed_at'            => now(),
                ]);

                // 1. Award absorbed points to creator
                if ($pointsToAbsorb > 0 && $creator) {
                    $this->awardToUser($offer, $creator, $pointsToAbsorb, $lead);
                    
                    // Log to the absorption table so it's visible to Admin
                    SuperAgentAbsorbedPoints::create([
                        'super_agent_id'      => $creator->id,
                        'source_agent_id'     => $agent->id,
                        'offer_id'            => $offer->id,
                        'lead_id'             => $lead->id,
                        'absorbed_points'     => $pointsToAbsorb,
                        'agent_total_points'  => $currentTotal + $pointsToAbsorb,
                        'offer_target'        => (float)$offer->target_points,
                        'absorption_reason'   => 'enumerator_absorption',
                        'absorbed_at'         => now(),
                        'status'              => 'unclaimed' 
                    ]);
                }

                // 2. Award standard points to agent
                if ($pointsForAgent > 0) {
                    $this->awardToUser($offer, $agent, $pointsForAgent, $lead);
                }

                // ── Handle Collective Offers ───────────────────────────────────
                if ($offer->offer_type === 'collective' && !$offer->collective_redeemed) {
                    $newCollective = (float)$offer->current_points + $points;
                    $offer->update(['current_points' => $newCollective]);

                    if ($newCollective >= $offer->target_points) {
                        $offer->update([
                            'collective_redeemed' => true,
                            'collective_redeemed_at' => now(),
                            'status' => 'ended'
                        ]);
                        // We use the helper directly here
                        $this->notificationService->notifyCollectiveOfferCompleted($offer);
                    }
                }
            });
        }
    }

    /**
     * Award points to a specific user for an offer, handling context and overrides.
     *
     * @param Lead|null $lead  Pass the originating lead so HierarchyService can use
     *                         the lead's assigned_super_agent_id override when it
     *                         differs from the agent's default parent_id.
     */
    private function awardToUser(Offer $offer, User $user, float $points, ?Lead $lead = null): void
    {
        // 1. Direct Award to the User
        $this->incrementProgress($offer, $user, $points, $user->role);

        // 2. Hierarchy Overrides
        // Pass $lead so getCommissionChain() can respect lead-specific SA assignments
        // (i.e. when a lead was manually reassigned to a different Super Agent).
        $chain = $this->hierarchyService->getCommissionChain($user, $lead);
        foreach ($chain as $ancestor) {
            // Only award if the offer is visible to the ancestor's role
            if ($ancestor->isSuperAgent() && in_array($offer->visible_to, ['super_agents', 'both'])) {
                $this->incrementProgress($offer, $ancestor, $points, 'super_agent');
            } elseif ($ancestor->isAgent() && in_array($offer->visible_to, ['agents', 'both'])) {
                $this->incrementProgress($offer, $ancestor, $points, 'agent');
            }
        }
    }

    /**
     * REVERT ALL POINTS associated with a lead (e.g. status changed away from COMPLETED)
     */
    public function revertPoints(Lead $lead): void
    {
        DB::transaction(function () use ($lead) {
            // Find all logs for this lead
            $logs = OfferInstallationLog::where('lead_id', $lead->id)->get();

            foreach ($logs as $log) {
                /** @var \App\Models\OfferInstallationLog $log */
                $offer = $log->offer;
                $agent = $log->user;
                $points = (float)($log->points_awarded_to_agent ?? $log->points_awarded);

                if (!$offer || !$agent) continue;

                // 1. Revert from the main agent
                $this->revertAwardFromUser($offer, $agent, $points);

                // 2. Revert from absorption table if applicable
                /** @var \App\Models\SuperAgentAbsorbedPoints|null $absorption */
                $absorption = SuperAgentAbsorbedPoints::where('lead_id', $lead->id)
                    ->where('offer_id', $offer->id)
                    ->first();

                if ($absorption) {
                    $creator = $absorption->superAgent;
                    $absorbedPoints = (float)$absorption->absorbed_points;
                    
                    if ($creator) {
                        $this->revertAwardFromUser($offer, $creator, $absorbedPoints);
                    }
                    
                    $absorption->delete();
                }

                // 3. Handle Collective-only logic
                if ($offer->offer_type === 'collective') {
                    $newPoints = max(0, (float)$offer->current_points - $points);
                    $offer->update(['current_points' => $newPoints]);
                }

                // 4. Delete the log to allow re-awarding if it becomes COMPLETED again
                $log->delete();
            }
        });
    }

    private function revertAwardFromUser(Offer $offer, User $user, float $points): void
    {
        $isAgent = in_array($user->role, ['agent', 'enumerator']);
        $isSA = $user->role === 'super_agent';
        $isAdmin = in_array($user->role, ['admin', 'super_admin']);

        // Decrement from the submitter themselves
        if ($isAgent && in_array($offer->visible_to, ['agents', 'both'])) {
            $this->decrementProgress($offer, $user, $points, 'agent');
        }

        if ($isSA && in_array($offer->visible_to, ['super_agents', 'both'])) {
            $this->decrementProgress($offer, $user, $points, 'super_agent');
        }

        if ($isAdmin) {
            $this->decrementProgress($offer, $user, $points, 'admin');
        }

        // MED-07 FIX: Walk the full commission chain — not just the direct super_agent_id.
        // awardToUser() uses getCommissionChain() to award ancestors; revert must mirror it.
        if ($isAgent) {
            $chain = $this->hierarchyService->getCommissionChain($user);
            foreach ($chain as $ancestor) {
                if ($ancestor->isSuperAgent() && in_array($offer->visible_to, ['super_agents', 'both'])) {
                    $this->decrementProgress($offer, $ancestor, $points, 'super_agent');
                } elseif ($ancestor->isAgent() && in_array($offer->visible_to, ['agents', 'both'])) {
                    $this->decrementProgress($offer, $ancestor, $points, 'agent');
                }
            }
        }
    }

    private function decrementProgress(Offer $offer, User $user, float $points, string $roleContext): void
    {
        $progress = OfferProgress::where('offer_id', $offer->id)
            ->where('user_id', $user->id)
            ->where('role_context', $roleContext)
            ->lockForUpdate()
            ->first();

        if (!$progress) return;

        $newTotal = max(0, (float)$progress->total_points - $points);
        
        $progress->update([
            'total_points' => $newTotal,
        ]);

        $progress->recalculate();
    }

    private function incrementProgress(Offer $offer, User $user, float $points, string $roleContext): void
    {
        $progress = OfferProgress::firstOrCreate(
            [
                'user_id'      => $user->id,
                'offer_id'     => $offer->id,
                'role_context' => $roleContext,
            ],
            [
                'role_context'            => $roleContext,
                'total_points'            => 0,
                'redeemed_points'         => 0,
                'redemption_count'        => 0,
                'pending_redemption_count'=> 0,
            ]
        );

        // Lock the row to prevent lost updates on concurrent point awards
        $progress = OfferProgress::where('id', $progress->id)->lockForUpdate()->first();

        $newTotal = (float)$progress->total_points + $points;

        // No additional threshold deduction here — the split in processPoints() already
        // withheld the absorbed portion before calling awardToUser(), so $points already
        // reflects only what this user should actually receive.
        $unredeemed = $newTotal - (float)$progress->redeemed_points;
        $target = (float)$offer->target_points;
        $claimableNow = $target > 0 ? (int)floor($unredeemed / $target) : 0;
        $claimableBefore = $progress->pending_redemption_count;

        $progress->update([
            'total_points'            => $newTotal,
            'unredeemed_points'       => $unredeemed,
            'pending_redemption_count'=> $claimableNow,
            'can_redeem'              => $target > 0 && $unredeemed >= $target,
            'last_installation_at'    => now(),
        ]);

        if (!$progress->first_installation_at) {
            $progress->update(['first_installation_at' => now()]);
        }

        // Notify user if they just crossed a redemption threshold
        if ($claimableNow > $claimableBefore) {
            $this->notificationService->notifyOfferRedeemable($offer, $user, $claimableNow);
        }
    }

    // checkAndNotifyMilestones() was previously here — removed (dead code).
    // Threshold notifications are now handled inline inside incrementProgress().

    /**
     * Returns the point value for a given system capacity string.
     * Looks up the capacity → points map from the 'capacity_points_json' Setting.
     */
    private function getPointsForCapacity(?string $capacity): float
    {
        $capacityRaw = strtolower(str_replace(' ', '', $capacity ?? ''));
        if (empty($capacityRaw)) {
            return 0;
        }

        $pointsMap = json_decode(Setting::getValue('capacity_points_json', '{}'), true);

        // 1. Try exact match (e.g., "3kw", "above_10kw", "3.3kw")
        if (isset($pointsMap[$capacityRaw])) {
            return (float) $pointsMap[$capacityRaw];
        }

        // 2. Try matching with "kw" suffix if missing (e.g., "3" -> "3kw")
        if (is_numeric($capacityRaw) && isset($pointsMap[$capacityRaw . 'kw'])) {
            return (float) $pointsMap[$capacityRaw . 'kw'];
        }

        return 0;
    }

    /**
     * REDEEM OFFER
     * Called when agent/SA clicks "Redeem"
     */
    public function redeemOffer(int $offerId, User $user): OfferRedemption
    {
        return DB::transaction(function () use ($offerId, $user) {
            $offer = Offer::findOrFail($offerId);

            if (!$offer->is_claimable) {
                throw new \Exception('This offer has expired and is no longer claimable.');
            }

            $progress = OfferProgress::where('user_id', $user->id)
                ->where('offer_id', $offerId)
                ->lockForUpdate()   // CRITICAL: prevents race condition on double-tap
                ->firstOrFail();

            // Absorption was handled at award time — no extra deduction needed here
            $unredeemed = (float)$progress->total_points - (float)$progress->redeemed_points;
            $target     = (float)$offer->target_points;

            if ($unredeemed < $target) {
                throw new \InvalidArgumentException(
                    "You need {$target} points to redeem this offer. " .
                    "You currently have " . number_format($unredeemed, 1) . " unredeemed points."
                );
            }

            // Deduct exactly one target from unredeemed (surplus carries forward):
            $newRedeemed       = (float)$progress->redeemed_points + $target;
            $newUnredeemed     = $unredeemed - $target;  // the surplus after this redemption
            $newPending        = $target > 0 ? (int)floor($newUnredeemed / $target) : 0;
            $redemptionNumber  = $progress->redemption_count + 1;

            $progress->update([
                'redeemed_points'         => $newRedeemed,
                'unredeemed_points'       => $newUnredeemed,
                'redemption_count'        => $redemptionNumber,
                'pending_redemption_count'=> $newPending,
                'can_redeem'              => $newUnredeemed >= $target,
                'last_redeemed_at'        => now(),
            ]);

            $redemption = OfferRedemption::create([
                'offer_id'           => $offerId,
                'user_id'            => $user->id,
                'redemption_number'  => $redemptionNumber,
                'points_used' => $target,

                'status'             => 'pending',
                'claimed_at'         => now(),
            ]);

            // Notify admin
            $this->notificationService->notifyAdminOfferRedemptionClaimed($offer, $user, $redemption);

            // ── SHARED POOL SYNC: If an Agent redeems, deduct from their Super Agent's override balance ──
            if ($user->role === 'agent' && $user->super_agent_id) {
                $this->syncRedemptionToSuperAgent($offer, $user, $target);
            }

            return $redemption;
        });
    }

    /**
     * Synchronize a redemption from an agent to their Super Agent
     * This ensures that points claimed by an agent are deducted from the SA's "potential" balance.
     */
    private function syncRedemptionToSuperAgent(Offer $offer, User $agent, float $points): void
    {
        $saProgress = OfferProgress::where('user_id', $agent->super_agent_id)
            ->where('offer_id', $offer->id)
            ->lockForUpdate()
            ->first();

        if ($saProgress) {
            // We increment the SA's redeemed_points to reduce their unredeemed total.
            // This treats the override as "used" once the underlying agent claims it.
            // We NO LONGER cap this at total_points. If the SA double-dipped, this correctly
            // drives their unredeemed balance into the negative (debt).
            $newRedeemed = (float)$saProgress->redeemed_points + $points;

            $saProgress->update([
                'redeemed_points' => $newRedeemed,
            ]);
            
            $saProgress->recalculate();
        }
    }

    /**
     * Reverse the synchronization of a redemption from an agent to their Super Agent
     * This restores the points to the SA's "potential" balance when an agent's redemption is cancelled.
     */
    private function reverseSyncRedemptionToSuperAgent(Offer $offer, User $agent, float $points): void
    {
        $saProgress = OfferProgress::where('user_id', $agent->super_agent_id)
            ->where('offer_id', $offer->id)
            ->lockForUpdate()
            ->first();

        if ($saProgress) {
            $newRedeemed = max(0, (float)$saProgress->redeemed_points - $points);

            $saProgress->update([
                'redeemed_points' => $newRedeemed,
            ]);
            
            $saProgress->recalculate();
        }
    }

    /**
     * Process expiry for a single offer.
     * Called by the OfferExpiryJob after (offer_to + grace_period_days) passes.
     * Absorbs partial points to super agents, zeroes expired progress for UI.
     */
    public function processOfferExpiry(Offer $offer): array
    {
        if ($offer->absorption_processed_at) {
            return ['skipped' => true, 'reason' => 'Already processed'];
        }

        $stats = [
            'agents_processed' => 0,
            'agents_absorbed' => 0,
            'agents_grace_period_expired' => 0,
            'total_points_absorbed' => 0,
            'total_points_discarded' => 0,
            'agent_breakdown' => [],
        ];

        // Get ALL progress rows for this offer
        $progressRows = OfferProgress::query()->where(fn ($q) => $q->where('offer_id', $offer->id))
            ->with(['user.superAgent'])
            ->get();

        DB::transaction(function () use ($offer, $progressRows, &$stats) {

            /** @var \App\Models\OfferProgress $progress */
            foreach ($progressRows as $progress) {
                $stats['agents_processed']++;
                $agent = $progress->user;
                $unredeemed = (float)$progress->unredeemed_points;
                $target = (float)$offer->target_points;

                // ── CASE B: Agent fell short (unredeemed > 0, but < target) ──────────
                if ($unredeemed > 0 && $unredeemed < $target) {
                    $this->absorbPoints($offer, $agent, $unredeemed, 'agent_fell_short', $stats);
                }

                // ── CASE A: Agent was eligible but grace period has now passed ────────
                elseif ($unredeemed >= $target) {
                    $this->absorbPoints($offer, $agent, $unredeemed, 'grace_period_expired', $stats);
                }

                // ── CASE C: Agent has zero unredeemed (perfect redemption or no installs) ──
                else {
                    $stats['agent_breakdown'][] = [
                        'agent_id' => $agent->id,
                        'outcome' => 'nothing_to_absorb',
                        'unredeemed' => 0,
                    ];
                }

                // Zero out for UI regardless of outcome
                $progress->update(['offer_ended_zeroed_at' => now()]);
            }

            // Mark offer as absorption-processed
            $offer->update(['absorption_processed_at' => now()]);

            // Log the expiry run
            OfferExpiryLog::create([
                'offer_id' => $offer->id,
                'agents_processed' => $stats['agents_processed'],
                'agents_absorbed' => $stats['agents_absorbed'],
                'agents_grace_period_expired' => $stats['agents_grace_period_expired'],
                'total_points_absorbed' => $stats['total_points_absorbed'],
                'total_points_discarded' => $stats['total_points_discarded'],
                'agent_breakdown' => $stats['agent_breakdown'],
                'processed_at' => now(),
            ]);

            // Notify all affected super agents
            $affectedSAs = SuperAgentAbsorbedPoints::query()
                ->where(fn($q) => $q->where('offer_id', $offer->id))
                ->where(fn($q) => $q->where('status', 'unclaimed'))
                ->where(fn($q) => $q->where('absorbed_at', '>=', now()->subMinutes(1)))
                ->distinct('super_agent_id')
                ->pluck('super_agent_id');

            foreach ($affectedSAs as $saId) {
                $this->notificationService->notifySuperAgentNewAbsorption((int)$saId, $offer);
            }
        });

        return $stats;
    }

    /**
     * Helper: create an absorption record safely.
     */
    private function absorbPoints(
        Offer $offer,
        User $agent,
        float $points,
        string $reason,
        array &$stats
    ): void {
        if ($points <= 0) {
            return;
        }

        // Prevent duplicate absorptions (unique constraint)
        $alreadyAbsorbed = SuperAgentAbsorbedPoints::query()->where(fn ($q) => $q->where('offer_id', $offer->id))
            ->where(fn ($q) => $q->where('source_agent_id', $agent->id))
            ->exists();

        if ($alreadyAbsorbed) {
            return;
        }

        $receiverId = null;
        if ($agent->role === 'super_agent') {
            $receiverId = $agent->parent_id;
        } else {
            $receiverId = $agent->super_agent_id ?: $agent->parent_id;
        }

        if (!$receiverId) {
            \Illuminate\Support\Facades\Log::warning('OfferService::absorbPoints — No valid receiver found in hierarchy. Absorption skipped.', [
                'offer_id'        => $offer->id,
                'source_agent_id' => $agent->id,
                'points'          => $points,
                'reason'          => $reason,
                'agent_role'      => $agent->role,
                'parent_id'       => $agent->parent_id,
                'super_agent_id'  => $agent->super_agent_id,
            ]);
            return;
        }

        SuperAgentAbsorbedPoints::create([
            'super_agent_id' => $receiverId,
            'source_agent_id' => $agent->id,
            'offer_id' => $offer->id,
            'absorbed_points' => $points,
            'agent_total_points' => OfferProgress::query()->where(fn ($q) => $q->where('offer_id', $offer->id))
                ->where(fn ($q) => $q->where('user_id', $agent->id))
                ->value('total_points') ?? 0,
            'offer_target' => $offer->target_points,
            'absorption_reason' => $reason,
            'absorbed_at' => now(),
            'status' => 'unclaimed',
        ]);

        $stats['total_points_absorbed'] += $points;
        $stats['agents_absorbed']++;
    }

    /**
     * ADMIN APPROVES / MARKS DELIVERED
     */
    public function approveRedemption(OfferRedemption $redemption, User $admin, ?string $notes = null): OfferRedemption
    {
        $redemption->update([
            'status' => 'approved',
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'notes' => $notes,
        ]);

        $this->notificationService->notifyAgentRedemptionApproved($redemption->offer, $redemption->user, $redemption);

        return $redemption->fresh();
    }

    public function approveRedemptionByAdmin(OfferRedemption $redemption, User $admin, ?string $notes = null): OfferRedemption
    {
        $redemption->update([
            'status' => 'admin_approved',
            'admin_approved_by' => $admin->id,
            'admin_approved_at' => now(),
            'notes' => $notes,
        ]);

        // Keep existing notification or add a new one if needed
        $this->notificationService->notifyAgentRedemptionApproved($redemption->offer, $redemption->user, $redemption);

        return $redemption->fresh();
    }

    public function markDelivered(OfferRedemption $redemption, User $admin, ?string $notes = null): OfferRedemption
    {
        $redemption->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'notes' => $notes ?? $redemption->notes,
        ]);

        $this->notificationService->notifyAgentPrizeDelivered($redemption->offer, $redemption->user);

        return $redemption->fresh();
    }

    /**
     * CANCEL REDEMPTION
     * Reverts points back to the user's progress.
     */
    public function cancelRedemption(OfferRedemption $redemption, User $admin, ?string $notes = null): OfferRedemption
    {
        return DB::transaction(function () use ($redemption, $admin, $notes) {
            if ($redemption->status !== 'pending' && $redemption->status !== 'approved') {
                throw new \Exception('Only pending or approved redemptions can be cancelled.');
            }

            $pointsToRevert = (float) $redemption->points_used;
            $user = $redemption->user;
            $offer = $redemption->offer;

            // Find progress
            $progress = OfferProgress::where('user_id', $user->id)
                ->where('offer_id', $offer->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Revert points
            $newRedeemed = max(0, (float)$progress->redeemed_points - $pointsToRevert);
            $newUnredeemed = (float)$progress->unredeemed_points + $pointsToRevert;
            
            // We only decrement redemption_count if it was already incremented during redemption
            $newCount = max(0, $progress->redemption_count - 1);
            
            $target = (float)$offer->target_points;
            $newPendingCount = $target > 0 ? (int)floor($newUnredeemed / $target) : 0;

            $progress->update([
                'redeemed_points' => $newRedeemed,
                'unredeemed_points' => $newUnredeemed,
                'redemption_count' => $newCount,
                'pending_redemption_count' => $newPendingCount,
                'can_redeem' => $newUnredeemed >= $target,
            ]);

            $redemption->update([
                'status' => 'cancelled',
                'notes' => $notes ?? "Cancelled by admin: " . $admin->name,
                // We don't set approved_by/approved_at for cancellation
            ]);

            // Reverse the sync for Super Agent if this was an Agent's redemption
            if ($user->role === 'agent' && $user->super_agent_id) {
                $this->reverseSyncRedemptionToSuperAgent($offer, $user, $pointsToRevert);
            }

            // Notify user
            // app(NotificationService::class)->notifyAgentRedemptionCancelled($offer, $user, $redemption);

            return $redemption->fresh();
        });
    }

    /**
     * GET OFFERS FOR USER DASHBOARD
     */
    public function getOffersForUser(User $user): array
    {
        $offers = Offer::live()
            ->visibleTo($user->role)
            ->with(['progress' => function ($q) use ($user) {
                /** @var \Illuminate\Database\Eloquent\Relations\HasMany $q */
                $q->where(fn ($q2) => $q2->where('user_id', $user->id));
            }])
            ->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->orderBy('offer_to')
            ->get();

        return $offers->map(function (Offer $offer) use ($user) {
            $p = $offer->progress->first();

            $myTotal = (float)($p?->total_points ?? 0);
            // No additional threshold deduction — absorption already applied at award time
            $myRedeemed = (float)($p?->redeemed_points ?? 0);
            $myUnredeemed = max(0, $myTotal - $myRedeemed);
            $myCount = $p?->redemption_count ?? 0;
            $canRedeem = $p?->can_redeem ?? false;
            $pendingCount = $p?->pending_redemption_count ?? 0;
            $target = max(0.1, (float)$offer->target_points);

            // Progress within CURRENT redemption cycle
            $cycleInstalls = ($target > 0) ? fmod($myUnredeemed, $target) : 0;
            $cycleNeeded = max(0, $target - $cycleInstalls);

            // Helper to safe-format dates
            $safeFormat = fn($date) => ($date instanceof \Carbon\Carbon || $date instanceof \DateTimeInterface) 
                ? $date->format('d M Y') 
                : (is_string($date) ? date('d M Y', strtotime($date)) : null);

            $personalData = [
                // Personal data (Individual)
                'my_total_points' => $myTotal,
                'my_redeemed_points' => $myRedeemed,
                'my_unredeemed_points' => $myUnredeemed,
                'my_redemption_count' => $myCount,
                'can_redeem' => $canRedeem,
                'pending_redemption_count' => $pendingCount,

                // Current cycle progress (toward NEXT redemption)
                'cycle_points' => $cycleInstalls, 
                'cycle_needed' => $cycleNeeded,
                'cycle_percentage' => $target > 0 ? round(($cycleInstalls / $target) * 100) : 0,
                
                // Also include basic fields inside for completeness
                'id' => $offer->id,
                'title' => $offer->title,
                'description' => $offer->description,
                'prize_label' => $offer->prize_label,
                'prize_amount' => $offer->prize_amount,
                'prize_image_url' => $offer->prize_image_url,
                'offer_from' => $safeFormat($offer->offer_from),
                'offer_to' => $safeFormat($offer->offer_to),
                'offer_type' => $offer->offer_type,
                'target_points' => $target,
                'is_featured' => $offer->is_featured,
                'is_annual' => $offer->is_annual,
                'is_claimable' => $offer->is_claimable,
                'days_remaining' => $offer->days_remaining,
                'offer_ended_zeroed_at' => $safeFormat($p?->offer_ended_zeroed_at),
            ];

            return [
                'id' => $offer->id,
                'title' => $offer->title,
                'description' => $offer->description,
                'prize_label' => $offer->prize_label,
                'prize_amount' => $offer->prize_amount,
                'prize_image_url' => $offer->prize_image_url,
                'offer_from' => $safeFormat($offer->offer_from),
                'offer_to' => $safeFormat($offer->offer_to),
                'offer_type' => $offer->offer_type,
                'visible_to' => $offer->visible_to,
                'target_points' => $target,
                'is_featured' => $offer->is_featured,
                'is_annual' => $offer->is_annual,
                'is_claimable' => $offer->is_claimable,
                'days_remaining' => $offer->days_remaining,

                // Relationship data nested as per frontend Expectation (OfferWithProgress)
                'progress' => $user->role === 'agent' ? $personalData : null,
                'own_progress' => $user->role === 'super_agent' ? $personalData : null,

                // Collective-only fields (Top level)
                'current_points' => $offer->current_points,
                'collective_remaining' => $offer->collective_remaining,
                'collective_redeemed' => $offer->collective_redeemed,
            ];
        })->values()->toArray();
    }

    /**
     * Get team performance summary for all live individual offers
     */
    public function getTeamOfferPerformance(User $superAgent): array
    {
        $agents = User::query()->agents()
            ->where(fn ($q) => $q->where('super_agent_id', $superAgent->id))
            ->get();
        $agentIds = $agents->pluck('id');

        $activeOffers = Offer::live()
            ->visibleTo('super_agent')
            ->individual()
            ->get();

        return $activeOffers->map(function ($offer) use ($agents, $agentIds) {
            $progressData = OfferProgress::query()
                ->where(fn ($q) => $q->where('offer_id', $offer->id))
                ->whereIn('user_id', $agentIds)
                ->get();

            $teamTotal = (float) $progressData->sum('total_points');
            $teamRedeemed = (float) $progressData->sum('redeemed_points');
            $teamRedemptionCount = (int) $progressData->sum('redemption_count');

            $agentStats = $agents->map(function ($agent) use ($offer, $progressData) {
                $p = $progressData->firstWhere('user_id', $agent->id);
                $totalPoints = (float) ($p?->total_points ?? 0);
                $unredeemed = (float) ($p?->unredeemed_points ?? 0);
                $target = (float) $offer->target_points;
                
                $cyclePoints = $target > 0 ? ($unredeemed % $target) : 0;
                $cycleNeeded = max(0, $target - $cyclePoints);

                return [
                    'agent_id' => $agent->id,
                    'agent_name' => $agent->name,
                    'agent_code' => $agent->agent_id,
                    'total_points' => $totalPoints,
                    'cycle_points' => $cyclePoints,
                    'cycle_needed' => $cycleNeeded,
                    'can_redeem' => $p?->can_redeem ?? false,
                ];
            });

            return [
                'id' => $offer->id,
                'offer_id' => $offer->id,
                'offer_title' => $offer->title,
                'title' => $offer->title,
                'target_points' => (float)$offer->target_points,
                'prize_label' => $offer->prize_label,
                'prize_image_url' => $offer->prize_image_url,
                'offer_to' => $offer->offer_to?->format('d M Y'),
                'team_totals' => [
                    'total_points' => $teamTotal,
                    'redeemed_points' => $teamRedeemed,
                    'unredeemed_points' => $teamTotal - $teamRedeemed,
                    'redemption_count' => $teamRedemptionCount,
                ],
                'agents' => $agentStats,
            ];
        })->toArray();
    }
}